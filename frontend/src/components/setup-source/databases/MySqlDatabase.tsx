import React from 'react';
import { Card, CardHeader, CardContent, Input, Button, Separator, Chip } from '@heroui/react';
import { labelClass, requiredLabelClass } from '../common/formStyles';
import { EnvironmentSelector } from '../common/EnvironmentSelector';
import { StatusButton } from '../common/StatusButton';
import type { ActionStatus } from '../common/StatusButton';
import type { Environment } from '../../../store/useAppStore';
import { DatabaseEngineSelector } from '../../common/DatabaseEngineSelector';
import { Database, CheckCircle2, AlertTriangle } from 'lucide-react';

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
  availableSchemas?: string[];
  environment: Environment;
  setEnvironment: (v: Environment) => void;
  testStatus: ActionStatus;
  onTestConnection: () => void;
  onSaveConnection: () => void;
  testResult: { ok: boolean; message: string; detail?: string } | null;
  stepNumber?: string;
  subtitle?: string;
  hostLabel?: string;
  hostDescription?: string;
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
  availableSchemas = [],
  environment,
  setEnvironment,
  testStatus,
  onTestConnection,
  onSaveConnection,
  testResult,
  stepNumber = '3.',
  subtitle = 'Select your database engine and configure credentials.',
  hostLabel = 'Database Hostname',
  hostDescription = 'Database server host address.',
}) => {
  const isConnectionValidated =
    (testStatus === 'success' && Boolean(testResult?.ok)) || availableSchemas.length > 0;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col items-start gap-1 pb-2">
        <p className="text-xl font-bold">{stepNumber} Database Connection</p>
        <p className="text-sm text-foreground/70">{subtitle}</p>
      </CardHeader>
      <Separator />
      <CardContent className="py-2">
        <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col gap-1.5">
            <label className={requiredLabelClass}>Database Engine</label>
            <DatabaseEngineSelector
              value={databaseEngine}
              onChange={(engine) => setDatabaseEngine(engine)}
              onAutoPortChange={(newPort) => setMysqlPort(newPort)}
              currentPort={mysqlPort}
              className="max-w-md"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className={requiredLabelClass}>{hostLabel}</label>
              <Input
                placeholder="127.0.0.1 or server host"
                variant="primary"
                value={mysqlHost}
                onChange={(e) => setMysqlHost(e.target.value)}
                required
              />
              <p className="text-xs text-foreground/50">{hostDescription}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={requiredLabelClass}>Server Port</label>
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
              <label className={requiredLabelClass}>Username</label>
              <Input
                placeholder="Username"
                variant="primary"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={requiredLabelClass}>Password</label>
              <Input
                placeholder="Enter database password"
                type="password"
                variant="primary"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {testResult && (
            <div
              role="status"
              className={`rounded-xl border p-4 flex items-start gap-3 text-sm ${
                testResult.ok
                  ? 'border-success/30 bg-success/10 text-success-700 dark:text-success-400'
                  : 'border-danger/30 bg-danger/10 text-danger-700 dark:text-danger-400'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={20} className="shrink-0 mt-0.5" />
              )}
              <div className="flex flex-col gap-1">
                <p className="font-semibold">{testResult.message}</p>
                {testResult.detail && (
                  <p className="break-words text-xs opacity-80 font-mono">{testResult.detail}</p>
                )}
              </div>
            </div>
          )}

          {/* Post-Validation Preferred Schema Selection */}
          {isConnectionValidated && (
            <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-default-100/80 border border-primary/25 animate-appearance-in">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-primary shrink-0" />
                  <label htmlFor="source-schema-selector" className={labelClass}>
                    Preferred DB Schema (Default)
                  </label>
                </div>
                <Chip size="sm" variant="soft" className="text-[11px] font-medium">
                  Default for all actions • {availableSchemas.length} available
                </Chip>
              </div>

              <select
                id="source-schema-selector"
                value={dbName}
                onChange={(e) => setDbName(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="w-full bg-surface border border-separator text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary cursor-pointer [color-scheme:dark]"
              >
                <option value="" className="bg-surface text-foreground">
                  No preferred schema (select in each action / define on backup)
                </option>
                {availableSchemas.map((schema) => (
                  <option key={schema} value={schema} className="bg-surface text-foreground font-mono">
                    {schema}
                  </option>
                ))}
              </select>

              <p className="text-xs text-foreground/60">
                Select your preferred schema. It will be used as the default for all actions (Jobs, Data Comparison, Schema Viewer), though you can still change it right before executing any job or comparison.
              </p>
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
              loadingText="Validating..."
              successText="Validated"
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

