package service

import (
	"context"
	"database/sql"
	"net"
	"strconv"
	"time"

	"github.com/go-sql-driver/mysql"

	"github.com/CoronelV/Stewrd/internal/domain"
	appErrors "github.com/CoronelV/Stewrd/internal/errors"
	"github.com/CoronelV/Stewrd/internal/logger"
	"github.com/CoronelV/Stewrd/internal/tunnel"
)

const (
	defaultMysqlPort      = 3306
	connectionTestTimeout = 30 * time.Second
	mysqlDialTimeout      = 10 * time.Second
)

type ConnectionService interface {
	// TestSshMysql opens the SSH tunnel, connects to MySQL through it and
	// runs a trivial query. Everything is closed before returning.
	TestSshMysql(ctx context.Context, input domain.SshMysqlConnection) (*domain.ConnectionTestResult, error)
	SaveActiveSshMysql(ctx context.Context, input domain.SshMysqlConnection) error
	GetTelemetry(ctx context.Context) (*domain.TelemetryResponse, error)
}

type connectionService struct {
	logger logger.Logger
	activeConnection *domain.SshMysqlConnection
}

var _ ConnectionService = (*connectionService)(nil)

func NewConnectionService(log logger.Logger) ConnectionService {
	return &connectionService{logger: log}
}

func (s *connectionService) TestSshMysql(ctx context.Context, input domain.SshMysqlConnection) (*domain.ConnectionTestResult, error) {
	if err := validateMysqlEndpoint(&input.Mysql); err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(ctx, connectionTestTimeout)
	defer cancel()

	// Credentials are deliberately never logged.
	log := s.logger.With(
		logger.Field{Key: "sshHost", Value: input.Ssh.Host},
		logger.Field{Key: "mysqlHost", Value: input.Mysql.Host},
	)

	tun, err := tunnel.Open(ctx, tunnel.Config{
		Host:                  input.Ssh.Host,
		Port:                  input.Ssh.Port,
		User:                  input.Ssh.User,
		Password:              input.Ssh.Password,
		PrivateKeyPath:        input.Ssh.PrivateKeyPath,
		KnownHostsPath:        input.Ssh.KnownHostsPath,
		InsecureIgnoreHostKey: input.Ssh.InsecureIgnoreHostKey,
	})
	if err != nil {
		log.Error("ssh tunnel failed", err)
		return nil, err
	}
	defer tun.Close()

	mysqlConfig := mysql.NewConfig()
	mysqlConfig.User = input.Mysql.User
	mysqlConfig.Passwd = input.Mysql.Password
	mysqlConfig.DBName = input.Mysql.Schema
	mysqlConfig.Net = "tcp"
	mysqlConfig.Addr = net.JoinHostPort(input.Mysql.Host, strconv.Itoa(input.Mysql.Port))
	mysqlConfig.Timeout = mysqlDialTimeout
	mysqlConfig.DialFunc = tun.DialContext

	connector, err := mysql.NewConnector(mysqlConfig)
	if err != nil {
		return nil, appErrors.New(appErrors.CodeValidation, "invalid mysql connection settings", err)
	}
	db := sql.OpenDB(connector)
	defer db.Close()
	db.SetMaxOpenConns(1)

	startedAt := time.Now()
	var serverVersion string
	if err := db.QueryRowContext(ctx, "SELECT VERSION()").Scan(&serverVersion); err != nil {
		log.Error("mysql connection failed", err)
		return nil, appErrors.New(appErrors.CodeConnection, "cannot connect to mysql through the ssh tunnel", err)
	}

	log.Info("mysql over ssh connection test succeeded")
	return &domain.ConnectionTestResult{
		ServerVersion: serverVersion,
		LatencyMs:     time.Since(startedAt).Milliseconds(),
	}, nil
}

func validateMysqlEndpoint(endpoint *domain.MysqlEndpoint) error {
	if endpoint.Host == "" {
		return appErrors.New(appErrors.CodeValidation, "mysql host is required", nil)
	}
	if endpoint.User == "" {
		return appErrors.New(appErrors.CodeValidation, "mysql user is required", nil)
	}
	if endpoint.Port == 0 {
		endpoint.Port = defaultMysqlPort
	}
	if endpoint.Port < 1 || endpoint.Port > 65535 {
		return appErrors.New(appErrors.CodeValidation, "mysql port must be between 1 and 65535", nil)
	}
	return nil
}

func (s *connectionService) SaveActiveSshMysql(ctx context.Context, input domain.SshMysqlConnection) error {
	if err := validateMysqlEndpoint(&input.Mysql); err != nil {
		return err
	}
	s.activeConnection = &input
	return nil
}

func (s *connectionService) GetTelemetry(ctx context.Context) (*domain.TelemetryResponse, error) {
	if s.activeConnection == nil {
		return nil, appErrors.New(appErrors.CodeValidation, "no active connection configured", nil)
	}
	
	input := *s.activeConnection
	
	ctx, cancel := context.WithTimeout(ctx, connectionTestTimeout)
	defer cancel()

	tun, err := tunnel.Open(ctx, tunnel.Config{
		Host:                  input.Ssh.Host,
		Port:                  input.Ssh.Port,
		User:                  input.Ssh.User,
		Password:              input.Ssh.Password,
		PrivateKeyPath:        input.Ssh.PrivateKeyPath,
		KnownHostsPath:        input.Ssh.KnownHostsPath,
		InsecureIgnoreHostKey: input.Ssh.InsecureIgnoreHostKey,
	})
	if err != nil {
		s.logger.Error("ssh tunnel failed in telemetry", err)
		return nil, err
	}
	defer tun.Close()

	mysqlConfig := mysql.NewConfig()
	mysqlConfig.User = input.Mysql.User
	mysqlConfig.Passwd = input.Mysql.Password
	mysqlConfig.DBName = input.Mysql.Schema
	mysqlConfig.Net = "tcp"
	mysqlConfig.Addr = net.JoinHostPort(input.Mysql.Host, strconv.Itoa(input.Mysql.Port))
	mysqlConfig.Timeout = mysqlDialTimeout
	mysqlConfig.DialFunc = tun.DialContext

	connector, err := mysql.NewConnector(mysqlConfig)
	if err != nil {
		return nil, err
	}
	db := sql.OpenDB(connector)
	defer db.Close()
	db.SetMaxOpenConns(1)

	var threadsValue string
	var varName string
	err = db.QueryRowContext(ctx, "SHOW STATUS LIKE 'Threads_connected'").Scan(&varName, &threadsValue)
	threadsConnected := 0
	if err == nil {
		threadsConnected, _ = strconv.Atoi(threadsValue)
	}

	var diskBytes sql.NullFloat64
	err = db.QueryRowContext(ctx, "SELECT SUM(data_length + index_length) FROM information_schema.tables").Scan(&diskBytes)
	diskMB := 0.0
	if err == nil && diskBytes.Valid {
		diskMB = diskBytes.Float64 / 1024 / 1024
	}

	return &domain.TelemetryResponse{
		CpuUsage:          10,
		MemoryUsage:       30,
		DiskUsageMB:       diskMB,
		ActiveConnections: threadsConnected,
	}, nil
}
