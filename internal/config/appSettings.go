package config

import (
	"time"

	appErrors "github.com/CoronelV/Stewrd/internal/errors"
)

type ConnectionKind string

const (
	ConnectionKindDirect ConnectionKind = "direct"
	ConnectionKindSsh    ConnectionKind = "ssh"
	ConnectionKindSsm    ConnectionKind = "ssm"
)

type AppSettings struct {
	Server      ServerSettings       `yaml:"server"`
	Database    DatabaseSettings     `yaml:"database"`
	Engine      EngineSettings       `yaml:"engine"`
	Logger      LoggerSettings       `yaml:"logger"`
	Connections []ConnectionSettings `yaml:"connections"`
}

type ServerSettings struct {
	Host            string        `yaml:"host"`
	Port            int           `yaml:"port"`
	ShutdownTimeout time.Duration `yaml:"shutdownTimeout"`
	AllowedOrigins  []string      `yaml:"allowedOrigins"`
}

type DatabaseSettings struct {
	Path        string        `yaml:"path"`
	BusyTimeout time.Duration `yaml:"busyTimeout"`
}

type EngineSettings struct {
	MaxConcurrentTasks    int           `yaml:"maxConcurrentTasks"`
	DefaultBatchSize      int           `yaml:"defaultBatchSize"`
	ChannelBufferSize     int           `yaml:"channelBufferSize"`
	ProgressFlushInterval time.Duration `yaml:"progressFlushInterval"`
	TelemetryBufferSize   int           `yaml:"telemetryBufferSize"`
}

type LoggerSettings struct {
	Level  string `yaml:"level"`
	Format string `yaml:"format"`
}

type DatabaseEndpoint struct {
	Driver      string            `yaml:"driver"`
	Host        string            `yaml:"host"`
	Port        int               `yaml:"port"`
	Name        string            `yaml:"name"`
	User        string            `yaml:"user"`
	PasswordEnv string            `yaml:"passwordEnv"`
	Options     map[string]string `yaml:"options"`
}

type SshSettings struct {
	Host           string `yaml:"host"`
	Port           int    `yaml:"port"`
	User           string `yaml:"user"`
	PrivateKeyPath string `yaml:"privateKeyPath"`
	KnownHostsPath string `yaml:"knownHostsPath"`
}

type SsmSettings struct {
	Region           string `yaml:"region"`
	Profile          string `yaml:"profile"`
	TargetInstanceId string `yaml:"targetInstanceId"`
	LocalPort        int    `yaml:"localPort"`
}

type ConnectionSettings struct {
	Name     string           `yaml:"name"`
	Kind     ConnectionKind   `yaml:"kind"`
	Endpoint DatabaseEndpoint `yaml:"endpoint"`
	Ssh      *SshSettings     `yaml:"ssh,omitempty"`
	Ssm      *SsmSettings     `yaml:"ssm,omitempty"`
}

func Load(path string) (*AppSettings, error) {
	panic(appErrors.ErrNotImplemented)
}

func (s *AppSettings) Validate() error {
	panic(appErrors.ErrNotImplemented)
}
