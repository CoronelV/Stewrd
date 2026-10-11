import React from 'react';
import { Card, CardHeader, CardContent, Input, Button, Separator } from '@heroui/react';
import { labelClass, requiredLabelClass } from '../common/formStyles';
import { EnvironmentSelector } from '../common/EnvironmentSelector';
import { StatusButton } from '../common/StatusButton';
import type { ActionStatus } from '../common/StatusButton';
import type { Environment } from '../../../store/useAppStore';

interface MySqlDatabaseProps {
  databaseEngine: string;
  setDatabaseEngine: (v: string) => void;
  mysqlHost: string;
  setMysqlHost: (v: string) => void;
  mysqlPort: string;
  setMysqlPort: (v: string) => void;
  username: string;
  setUsername: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  dbName: string;
  setDbName: (v: string) => void;
  environment: Environment;
  setEnvironment: (v: Environment) => void;
  testStatus: ActionStatus;
  onTestConnection: () => void;
  onSaveConnection: () => void;
  testResult: { ok: boolean; message: string; detail?: string } | null;
}

export const MySqlDatabase: React.FC<MySqlDatabaseProps> = ({
  databaseEngine,
  setDatabaseEngine,
  mysqlHost,
  setMysqlHost,
  mysqlPort,
  setMysqlPort,
  username,
  setUsername,
  password,
  setPassword,
  dbName,
  setDbName,
  environment,
  setEnvironment,
  testStatus,
  onTestConnection,
  onSaveConnection,
  testResult,
}) => {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col items-start gap-1 pb-2">
        <p className="text-xl font-bold">3. Database Connection</p>
        <p className="text-sm text-foreground/70">
          Select your database engine and configure credentials to connect through the SSH tunnel.
        </p>
      </CardHeader>
      <Separator />
      <CardContent className="py-2">
        <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col gap-1.5">
            <label className={requiredLabelClass}>Database Engine</label>
            <select
              value={databaseEngine}
              onChange={(e) => setDatabaseEngine(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="bg-surface border border-separator text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary cursor-pointer transition-colors max-w-xs [color-scheme:dark]"
            >
              <option className="bg-surface text-foreground" value="mysql">MySQL</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className={requiredLabelClass}>MySQL Hostname</label>
              <Input
                placeholder="MySQL server host relative to the SSH server"
                variant="primary"
                value={mysqlHost}
                onChange={(e) => setMysqlHost(e.target.value)}
                required
              />
              <p className="text-xs text-foreground/50">MySQL server host relative to the SSH server.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={requiredLabelClass}>MySQL Server Port</label>
              <Input
                placeholder="3306"
                type="number"
                min={1}
                max={65535}
                variant="primary"
                value={mysqlPort}
                onChange={(e) => setMysqlPort(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={requiredLabelClass}>MySQL Username</label>
              <Input
                placeholder=""
                variant="primary"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={requiredLabelClass}>MySQL Password</label>
              <Input
                placeholder="Enter MySQL password"
                type="password"
                variant="primary"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Default Schema</label>
            <Input
              placeholder="DB schema to use as default (optional)"
              variant="primary"
              value={dbName}
              onChange={(e) => setDbName(e.target.value)}
            />
            <p className="text-xs text-foreground/50">The schema to use as default schema. Leave blank to select it later.</p>
          </div>

          {testResult && (
            <div
              role="status"
              className={`rounded-lg border p-3 text-sm ${testResult.ok ? 'border-green-600/50 bg-green-600/10' : 'border-danger/50 bg-danger/10'}`}
            >
              <p className="font-medium">{testResult.message}</p>
              {testResult.detail && <p className="mt-1 break-words text-xs text-foreground/70">{testResult.detail}</p>}
            </div>
          )}

          <div className="flex flex-wrap justify-end items-center gap-3 mt-2">
            <EnvironmentSelector
              value={environment}
              onChange={setEnvironment}
              size="sm"
            />
            <StatusButton
              status={testStatus}
              idleText="Test Connection"
              loadingText="Testing..."
              successText="Success"
              variant="tertiary"
              onPress={onTestConnection}
            />
            <Button variant="primary" onPress={onSaveConnection}>Save Connection</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
