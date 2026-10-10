package domain

// SshTunnelSettings are the SSH parameters of a "MySQL over SSH" connection.
// Password never leaves the backend: it is accepted on input only.
type SshTunnelSettings struct {
	Host                  string `json:"host"`
	Port                  int    `json:"port"`
	User                  string `json:"user"`
	Password              string `json:"password,omitempty"`
	PrivateKeyPath        string `json:"privateKeyPath,omitempty"`
	KnownHostsPath        string `json:"knownHostsPath,omitempty"`
	InsecureIgnoreHostKey bool   `json:"insecureIgnoreHostKey,omitempty"`
}

// MysqlEndpoint is the MySQL server, addressed relative to the SSH server.
type MysqlEndpoint struct {
	Host     string `json:"host"`
	Port     int    `json:"port"`
	User     string `json:"user"`
	Password string `json:"password,omitempty"`
	Schema   string `json:"schema,omitempty"`
}

type SshMysqlConnection struct {
	Ssh   SshTunnelSettings `json:"ssh"`
	Mysql MysqlEndpoint     `json:"mysql"`
}

type ConnectionTestResult struct {
	ServerVersion string `json:"serverVersion"`
	LatencyMs     int64  `json:"latencyMs"`
}

type TelemetryResponse struct {
	CpuUsage          int     `json:"cpuUsage"`
	MemoryUsage       int     `json:"memoryUsage"`
	DiskUsageMB       float64 `json:"diskUsage"`
	ActiveConnections int     `json:"activeConnections"`
}
