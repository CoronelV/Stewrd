package config

import (
	stdErrors "errors"
	"os"
	"time"

	"gopkg.in/yaml.v3"

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

func defaultSettings() *AppSettings {
	return &AppSettings{
		Server: ServerSettings{
			Host:            "127.0.0.1",
			Port:            8080,
			ShutdownTimeout: 10 * time.Second,
		},
		Logger: LoggerSettings{Level: "info", Format: "text"},
	}
}

// Load reads the YAML settings file over the defaults. A missing file is not
// an error: the defaults are returned.
func Load(path string) (*AppSettings, error) {
	settings := defaultSettings()

	data, err := os.ReadFile(path)
	if err != nil {
		if stdErrors.Is(err, os.ErrNotExist) {
			return settings, nil
		}
		return nil, appErrors.New(appErrors.CodeValidation, "cannot read settings file "+path, err)
	}
	if err := yaml.Unmarshal(data, settings); err != nil {
		return nil, appErrors.New(appErrors.CodeValidation, "invalid settings file "+path, err)
	}
	return settings, nil
}

func (s *AppSettings) Validate() error {
	if s.Server.Port < 1 || s.Server.Port > 65535 {
		return appErrors.New(appErrors.CodeValidation, "server.port must be between 1 and 65535", nil)
	}
	if s.Server.ShutdownTimeout <= 0 {
		return appErrors.New(appErrors.CodeValidation, "server.shutdownTimeout must be positive", nil)
	}
	return nil
}
