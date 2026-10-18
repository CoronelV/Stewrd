import React from 'react';
import { Card, CardHeader, CardContent, Input, Button, Separator, Chip } from '@heroui/react';
import { labelClass, requiredLabelClass, disabledInputClass } from '../common/formStyles';
import { EnvironmentSelector } from '../common/EnvironmentSelector';
import { StatusButton } from '../common/StatusButton';
import type { ActionStatus } from '../common/StatusButton';
import type { Environment } from '../../../store/useAppStore';
import { DatabaseEngineSelector } from '../../common/DatabaseEngineSelector';
import { Database } from 'lucide-react';

interface AwsDatabaseProps {
  databaseEngine: string;
  setDatabaseEngine: (v: string) => void;
  isTunnelEstablished: boolean;
  localProxyPort: string;
  dbName: string;
  setDbName: (v: string) => void;
  availableSchemas?: string[];
  username: string;
  setUsername: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  isGenerating: boolean;
  onGenerateToken: () => void;
  environment: Environment;
  setEnvironment: (v: Environment) => void;
  testStatus: ActionStatus;
  onTestConnection: () => void;
  onSaveConnection: () => void;
}

export const AwsDatabase: React.FC<AwsDatabaseProps> = ({
  databaseEngine,
  setDatabaseEngine,
  isTunnelEstablished,
  localProxyPort,
  dbName,
  setDbName,
  availableSchemas = [],
  username,
  setUsername,
  password,
  setPassword,
  isGenerating,
  onGenerateToken,
  environment,
  setEnvironment,
  testStatus,
  onTestConnection,
  onSaveConnection,
}) => {
  const isConnectionValidated = testStatus === 'success';

  return (
    <Card className={`w-full transition-opacity duration-300 ${!isTunnelEstablished ? "opacity-60" : ""}`}>
      <CardHeader className="flex flex-col items-start gap-1 pb-2">
        <p className="text-xl font-bold">3. Database Connection</p>
        <p className="text-sm text-foreground/70">
          {!isTunnelEstablished
            ? "Establish the tunnel in step 2 to unlock database configuration."
            : "Enter your credentials to connect to the DB through the tunnel."}
        </p>
      </CardHeader>
      <Separator />
      <CardContent className="py-2">
        <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col gap-1.5">
            <label className={requiredLabelClass}>Database Engine</label>
            <DatabaseEngineSelector
              value={databaseEngine}
              onChange={(engine) => setDatabaseEngine(engine)}
              disabled={!isTunnelEstablished}
              className="max-w-md"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className={labelClass}>Host</label>
              <Input
                value="localhost"
                disabled
                variant="secondary"
                className={disabledInputClass}
              />
              <p className="text-xs text-foreground/50">Connected via SSM tunnel</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Port</label>
              <Input
                value={localProxyPort || "—"}
                disabled
                variant="secondary"
                className={disabledInputClass}
              />
              <p className="text-xs text-foreground/50">Mapped to proxy port</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={requiredLabelClass}>Username</label>
              <Input
                placeholder="db_user"
                variant="primary"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={!isTunnelEstablished}
              />
            </div>

            <div className="flex items-end gap-2">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className={requiredLabelClass}>Password / Token</label>
                <Input
                  placeholder="Enter password or generate token"
                  type="password"
                  variant="primary"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={!isTunnelEstablished}
                />
              </div>
              <Button
                variant="secondary"
                className="h-10 px-6"
                onPress={onGenerateToken}
                isPending={isGenerating}
                isDisabled={!isTunnelEstablished}
              >
                Generate Token
              </Button>
            </div>
          </div>

          {/* Post-Validation Preferred Schema Selection */}
          {isConnectionValidated && (
            <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-default-100/80 border border-primary/25 animate-appearance-in">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-primary shrink-0" />
                  <label htmlFor="aws-schema-selector" className={labelClass}>
                    Preferred DB Schema (Default)
                  </label>
                </div>
                <Chip size="sm" variant="soft" className="text-[11px] font-medium">
                  Default for all actions
                </Chip>
              </div>

              <select
                id="aws-schema-selector"
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
                Select your preferred schema. It will be used as the default for all actions, though you can still change it right before executing any job or comparison.
              </p>
            </div>
          )}

          <div className="flex flex-wrap justify-end items-center gap-3 mt-4">
            <EnvironmentSelector
              value={environment}
              onChange={setEnvironment}
              size="sm"
            />
            <StatusButton
              status={testStatus}
              idleText="Test DB Connection"
              loadingText="Validating..."
              successText="Validated"
              variant="tertiary"
              isDisabled={!isTunnelEstablished}
              onPress={onTestConnection}
            />
            <Button variant="primary" isDisabled={!isTunnelEstablished} onPress={onSaveConnection}>
              Save Connection
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

