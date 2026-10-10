export interface SshMysqlConnectionInput {
  ssh: {
    host: string;
    port: number;
    user: string;
    password?: string | undefined;
    privateKeyPath?: string | undefined;
    insecureIgnoreHostKey?: boolean | undefined;
  };
  mysql: {
    host: string;
    port: number;
    user: string;
    password: string;
    schema?: string | undefined;
  };
}

export interface TelemetryRequest {
  target?: 'source' | 'target';
}

export interface TelemetryResponse {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeConnections: number;
}
