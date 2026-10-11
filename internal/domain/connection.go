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
	Target      string            `json:"target,omitempty"`
	Environment string            `json:"environment,omitempty"`
	ChannelType string            `json:"channelType,omitempty"`
	Ssh         SshTunnelSettings `json:"ssh"`
	Mysql       MysqlEndpoint     `json:"mysql"`
}

type ActiveConnectionInfo struct {
	Target      string              `json:"target"`
	Status      string              `json:"status"`
	DbName      string              `json:"dbName"`
	ChannelType string              `json:"channelType"`
	Username    string              `json:"username"`
	Environment string              `json:"environment"`
	Connection  *SshMysqlConnection `json:"connection,omitempty"`
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

type ColumnSchema struct {
	Name         string `json:"name"`
	Type         string `json:"type"`
	IsNullable   bool   `json:"isNullable"`
	IsPrimaryKey bool   `json:"isPrimaryKey"`
	IsForeignKey bool   `json:"isForeignKey"`
}

type TableRelation struct {
	ConstraintName string `json:"constraintName"`
	SourceTable    string `json:"sourceTable"`
	SourceColumn   string `json:"sourceColumn"`
	TargetTable    string `json:"targetTable"`
	TargetColumn   string `json:"targetColumn"`
}

type TableSchema struct {
	Name    string         `json:"name"`
	Columns []ColumnSchema `json:"columns"`
}

type DatabaseSchemaResponse struct {
	DatabaseName     string          `json:"databaseName"`
	Schema           string          `json:"schema"`
	AvailableSchemas []string        `json:"availableSchemas,omitempty"`
	Tables           []TableSchema   `json:"tables"`
	Relations        []TableRelation `json:"relations"`
}
