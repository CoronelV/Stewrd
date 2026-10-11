import React from 'react';
import { Card, CardHeader, CardContent, Input, Button, Separator } from '@heroui/react';
import { labelClass, requiredLabelClass, disabledInputClass } from '../common/formStyles';
import { EnvironmentSelector } from '../common/EnvironmentSelector';
import { StatusButton } from '../common/StatusButton';
import type { ActionStatus } from '../common/StatusButton';
import type { Environment } from '../../../store/useAppStore';

interface AwsDatabaseProps {
  isTunnelEstablished: boolean;
  localProxyPort: string;
  dbName: string;
  setDbName: (v: string) => void;
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
  isTunnelEstablished,
  localProxyPort,
  dbName,
  setDbName,
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
              <label className={requiredLabelClass}>Database Name</label>
              <Input
                placeholder="postgres"
                variant="primary"
                value={dbName}
                onChange={(e) => setDbName(e.target.value)}
                required
                disabled={!isTunnelEstablished}
              />
            </div>
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

          <div className="flex flex-wrap justify-end items-center gap-3 mt-4">
            <EnvironmentSelector
              value={environment}
              onChange={setEnvironment}
              size="sm"
            />
            <StatusButton
              status={testStatus}
              idleText="Test DB Connection"
              loadingText="Testing..."
              successText="Success"
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
