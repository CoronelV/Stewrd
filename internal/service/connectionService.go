package service

import (
	"context"
	"database/sql"
	"io"
	"net"
	"strconv"
	"strings"
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
	// TestSshMysql opens the SSH tunnel (if configured) or connects directly to MySQL and
	// runs a trivial query. Everything is closed before returning.
	TestSshMysql(ctx context.Context, input domain.SshMysqlConnection) (*domain.ConnectionTestResult, error)
	SaveActiveSshMysql(ctx context.Context, target string, input domain.SshMysqlConnection) error
	GetActiveConnection(ctx context.Context, target string) (*domain.ActiveConnectionInfo, error)
	GetTelemetry(ctx context.Context) (*domain.TelemetryResponse, error)
	GetSchema(ctx context.Context, target string, requestedSchema string) (*domain.DatabaseSchemaResponse, error)
	OpenSession(ctx context.Context, target string) (*sql.DB, io.Closer, error)
	GetRawConnection(ctx context.Context, target string) (*domain.SshMysqlConnection, error)
}

type connectionService struct {
	logger                 logger.Logger
	activeConnection       *domain.SshMysqlConnection
	activeTargetConnection *domain.SshMysqlConnection
}

var _ ConnectionService = (*connectionService)(nil)

func NewConnectionService(log logger.Logger) ConnectionService {
	return &connectionService{logger: log}
}

func (s *connectionService) openMysqlSession(ctx context.Context, input domain.SshMysqlConnection) (*sql.DB, io.Closer, error) {
	var tun io.Closer

	mysqlConfig := mysql.NewConfig()
	mysqlConfig.User = input.Mysql.User
	mysqlConfig.Passwd = input.Mysql.Password
	// For target connections, the schema might not exist yet (replication will create it).
	// Connect to MySQL server without forcing an initial database.
	if !strings.EqualFold(input.Target, "target") {
		mysqlConfig.DBName = input.Mysql.Schema
	}
	mysqlConfig.Net = "tcp"
	mysqlConfig.Addr = net.JoinHostPort(input.Mysql.Host, strconv.Itoa(input.Mysql.Port))
	mysqlConfig.Timeout = mysqlDialTimeout
	mysqlConfig.AllowNativePasswords = true
	mysqlConfig.ParseTime = true

	isDirect := strings.EqualFold(input.ChannelType, "Direct") || strings.TrimSpace(input.Ssh.Host) == ""
	if !isDirect {
		t, err := tunnel.Open(ctx, tunnel.Config{
			Host:                  input.Ssh.Host,
			Port:                  input.Ssh.Port,
			User:                  input.Ssh.User,
			Password:              input.Ssh.Password,
			PrivateKeyPath:        input.Ssh.PrivateKeyPath,
			KnownHostsPath:        input.Ssh.KnownHostsPath,
			InsecureIgnoreHostKey: input.Ssh.InsecureIgnoreHostKey,
		})
		if err != nil {
			return nil, nil, err
		}
		tun = t
		mysqlConfig.DialFunc = t.DialContext
	}

	connector, err := mysql.NewConnector(mysqlConfig)
	if err != nil {
		if tun != nil {
			_ = tun.Close()
		}
		return nil, nil, appErrors.New(appErrors.CodeValidation, "invalid mysql connection settings", err)
	}
	db := sql.OpenDB(connector)
	db.SetMaxOpenConns(5)
	return db, tun, nil
}

func (s *connectionService) TestSshMysql(ctx context.Context, input domain.SshMysqlConnection) (*domain.ConnectionTestResult, error) {
	if err := validateMysqlEndpoint(&input.Mysql); err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(ctx, connectionTestTimeout)
	defer cancel()

	log := s.logger.With(
		logger.Field{Key: "sshHost", Value: input.Ssh.Host},
		logger.Field{Key: "mysqlHost", Value: input.Mysql.Host},
	)

	db, tun, err := s.openMysqlSession(ctx, input)
	if err != nil {
		log.Error("connection session failed", err)
		return nil, err
	}
	if tun != nil {
		defer tun.Close()
	}
	defer db.Close()

	startedAt := time.Now()
	var serverVersion string
	if err := db.QueryRowContext(ctx, "SELECT VERSION()").Scan(&serverVersion); err != nil {
		// If error is 1049 (Unknown database), retry at server level without the schema
		if strings.Contains(err.Error(), "1049") || strings.Contains(err.Error(), "Unknown database") {
			fallbackInput := input
			fallbackInput.Mysql.Schema = ""
			fallbackInput.Target = "target"
			if fbDb, fbTun, fbErr := s.openMysqlSession(ctx, fallbackInput); fbErr == nil {
				if fbTun != nil {
					defer fbTun.Close()
				}
				defer fbDb.Close()
				if fbErr := fbDb.QueryRowContext(ctx, "SELECT VERSION()").Scan(&serverVersion); fbErr == nil {
					log.Info("mysql connection test succeeded without initial schema (schema will be created on replication)")
					return &domain.ConnectionTestResult{
						ServerVersion: serverVersion,
						LatencyMs:     time.Since(startedAt).Milliseconds(),
					}, nil
				}
			}
		}
		log.Error("mysql connection query failed", err)
		return nil, appErrors.New(appErrors.CodeConnection, "cannot connect to mysql", err)
	}

	log.Info("mysql connection test succeeded")
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

func (s *connectionService) SaveActiveSshMysql(ctx context.Context, target string, input domain.SshMysqlConnection) error {
	if err := validateMysqlEndpoint(&input.Mysql); err != nil {
		return err
	}
	normalizedTarget := strings.ToLower(strings.TrimSpace(target))
	if normalizedTarget == "target" || strings.ToLower(input.Target) == "target" {
		input.Target = "target"
		s.activeTargetConnection = &input
	} else {
		input.Target = "source"
		s.activeConnection = &input
	}
	return nil
}

func (s *connectionService) GetActiveConnection(ctx context.Context, target string) (*domain.ActiveConnectionInfo, error) {
	var conn *domain.SshMysqlConnection
	normalizedTarget := strings.ToLower(strings.TrimSpace(target))
	if normalizedTarget == "target" {
		conn = s.activeTargetConnection
	} else {
		conn = s.activeConnection
		normalizedTarget = "source"
	}

	if conn == nil {
		return nil, nil
	}

	sanitizedConn := *conn
	sanitizedConn.Ssh.Password = ""
	sanitizedConn.Mysql.Password = ""

	return &domain.ActiveConnectionInfo{
		Target:      normalizedTarget,
		Status:      "active",
		DbName:      conn.Mysql.Schema,
		ChannelType: conn.ChannelType,
		Username:    conn.Mysql.User,
		Environment: conn.Environment,
		Connection:  &sanitizedConn,
	}, nil
}

func (s *connectionService) GetRawConnection(ctx context.Context, target string) (*domain.SshMysqlConnection, error) {
	var conn *domain.SshMysqlConnection
	normalizedTarget := strings.ToLower(strings.TrimSpace(target))
	if normalizedTarget == "target" {
		conn = s.activeTargetConnection
	} else {
		conn = s.activeConnection
	}

	if conn == nil {
		return nil, appErrors.New(appErrors.CodeValidation, "no active connection configured for "+target, nil)
	}
	return conn, nil
}

func (s *connectionService) OpenSession(ctx context.Context, target string) (*sql.DB, io.Closer, error) {
	raw, err := s.GetRawConnection(ctx, target)
	if err != nil {
		return nil, nil, err
	}
	return s.openMysqlSession(ctx, *raw)
}


func (s *connectionService) GetTelemetry(ctx context.Context) (*domain.TelemetryResponse, error) {
	if s.activeConnection == nil {
		return nil, appErrors.New(appErrors.CodeValidation, "no active connection configured", nil)
	}

	input := *s.activeConnection

	ctx, cancel := context.WithTimeout(ctx, connectionTestTimeout)
	defer cancel()

	db, tun, err := s.openMysqlSession(ctx, input)
	if err != nil {
		s.logger.Error("ssh tunnel failed in telemetry", err)
		return nil, err
	}
	if tun != nil {
		defer tun.Close()
	}
	defer db.Close()

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

func (s *connectionService) GetSchema(ctx context.Context, target string, requestedSchema string) (*domain.DatabaseSchemaResponse, error) {
	var conn *domain.SshMysqlConnection
	if target == "target" {
		conn = s.activeTargetConnection
	} else {
		conn = s.activeConnection
	}
	if conn == nil {
		return nil, appErrors.New(appErrors.CodeValidation, "no active connection configured for "+target, nil)
	}

	ctx, cancel := context.WithTimeout(ctx, connectionTestTimeout)
	defer cancel()

	db, tun, err := s.openMysqlSession(ctx, *conn)
	if err != nil {
		s.logger.Error("ssh tunnel failed in schema retrieval", err)
		return nil, err
	}
	if tun != nil {
		defer tun.Close()
	}
	defer db.Close()

	// Query available non-system schemas
	availableSchemas := make([]string, 0)
	schemaRows, err := db.QueryContext(ctx, "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys') ORDER BY SCHEMA_NAME")
	if err == nil {
		defer schemaRows.Close()
		for schemaRows.Next() {
			var sn string
			if err := schemaRows.Scan(&sn); err == nil {
				availableSchemas = append(availableSchemas, sn)
			}
		}
	}

	schemaName := strings.TrimSpace(requestedSchema)
	if schemaName == "" {
		candidate := strings.TrimSpace(conn.Mysql.Schema)
		if candidate != "" {
			// Check if configured schema actually exists in available schemas
			for _, s := range availableSchemas {
				if strings.EqualFold(s, candidate) {
					schemaName = s
					break
				}
			}
		}
	}
	if schemaName == "" {
		var currentDb sql.NullString
		_ = db.QueryRowContext(ctx, "SELECT DATABASE()").Scan(&currentDb)
		if currentDb.Valid && strings.TrimSpace(currentDb.String) != "" {
			schemaName = strings.TrimSpace(currentDb.String)
		}
	}
	if schemaName == "" && len(availableSchemas) > 0 {
		// Prefer the first schema that contains base tables
		for _, s := range availableSchemas {
			var tableCount int
			_ = db.QueryRowContext(ctx, "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'", s).Scan(&tableCount)
			if tableCount > 0 {
				schemaName = s
				break
			}
		}
		if schemaName == "" {
			schemaName = availableSchemas[0]
		}
	}
	if schemaName == "" {
		return nil, appErrors.New(appErrors.CodeValidation, "no database schema specified or found in MySQL", nil)
	}

	// 1. Query Relations (Foreign Keys)
	relationsQuery := `
		SELECT 
			k.CONSTRAINT_NAME,
			k.TABLE_NAME,
			k.COLUMN_NAME,
			k.REFERENCED_TABLE_NAME,
			k.REFERENCED_COLUMN_NAME
		FROM information_schema.KEY_COLUMN_USAGE k
		WHERE k.TABLE_SCHEMA = ?
		  AND k.REFERENCED_TABLE_NAME IS NOT NULL
		ORDER BY k.TABLE_NAME, k.CONSTRAINT_NAME, k.ORDINAL_POSITION`

	relRows, err := db.QueryContext(ctx, relationsQuery, schemaName)
	if err != nil {
		s.logger.Error("failed to query relations schema", err)
		return nil, appErrors.New(appErrors.CodeConnection, "failed to query relations schema", err)
	}
	defer relRows.Close()

	relations := make([]domain.TableRelation, 0)
	fkLookup := make(map[string]bool)
	for relRows.Next() {
		var rel domain.TableRelation
		if err := relRows.Scan(&rel.ConstraintName, &rel.SourceTable, &rel.SourceColumn, &rel.TargetTable, &rel.TargetColumn); err != nil {
			return nil, err
		}
		relations = append(relations, rel)
		fkLookup[rel.SourceTable+"."+rel.SourceColumn] = true
	}
	if err := relRows.Err(); err != nil {
		return nil, err
	}

	// 2. Query Tables
	tablesQuery := `
		SELECT TABLE_NAME 
		FROM information_schema.TABLES 
		WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
		ORDER BY TABLE_NAME`

	tableRows, err := db.QueryContext(ctx, tablesQuery, schemaName)
	if err != nil {
		s.logger.Error("failed to query tables schema", err)
		return nil, appErrors.New(appErrors.CodeConnection, "failed to query tables schema", err)
	}
	defer tableRows.Close()

	tables := make([]domain.TableSchema, 0)
	tableMap := make(map[string]*domain.TableSchema)
	for tableRows.Next() {
		var tableName string
		if err := tableRows.Scan(&tableName); err != nil {
			return nil, err
		}
		tSchema := domain.TableSchema{
			Name:    tableName,
			Columns: make([]domain.ColumnSchema, 0),
		}
		tables = append(tables, tSchema)
	}
	if err := tableRows.Err(); err != nil {
		return nil, err
	}

	for i := range tables {
		tableMap[tables[i].Name] = &tables[i]
	}

	// 3. Query Columns
	columnsQuery := `
		SELECT 
			TABLE_NAME,
			COLUMN_NAME,
			COLUMN_TYPE,
			IS_NULLABLE,
			COLUMN_KEY
		FROM information_schema.COLUMNS 
		WHERE TABLE_SCHEMA = ?
		ORDER BY TABLE_NAME, ORDINAL_POSITION`

	colRows, err := db.QueryContext(ctx, columnsQuery, schemaName)
	if err != nil {
		s.logger.Error("failed to query columns schema", err)
		return nil, appErrors.New(appErrors.CodeConnection, "failed to query columns schema", err)
	}
	defer colRows.Close()

	for colRows.Next() {
		var tableName, colName, colType, isNullable, colKey string
		if err := colRows.Scan(&tableName, &colName, &colType, &isNullable, &colKey); err != nil {
			return nil, err
		}
		if t, exists := tableMap[tableName]; exists {
			col := domain.ColumnSchema{
				Name:         colName,
				Type:         colType,
				IsNullable:   strings.EqualFold(isNullable, "YES"),
				IsPrimaryKey: strings.EqualFold(colKey, "PRI"),
				IsForeignKey: fkLookup[tableName+"."+colName],
			}
			t.Columns = append(t.Columns, col)
		}
	}
	if err := colRows.Err(); err != nil {
		return nil, err
	}

	dbDisplayName := conn.Mysql.Schema
	if dbDisplayName == "" {
		dbDisplayName = schemaName
	}

	return &domain.DatabaseSchemaResponse{
		DatabaseName:     dbDisplayName,
		Schema:           schemaName,
		AvailableSchemas: availableSchemas,
		Tables:           tables,
		Relations:        relations,
	}, nil
}
