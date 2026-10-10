import React from 'react';
import { Card, CardHeader, CardContent, Input, Separator } from '@heroui/react';
import { requiredLabelClass } from '../common/formStyles';
import { StatusButton } from '../common/StatusButton';
import type { ActionStatus } from '../common/StatusButton';

interface AwsTunnelChannelProps {
  awsProfile: string;
  setAwsProfile: (v: string) => void;
  bastionHost: string;
  setBastionHost: (v: string) => void;
  remoteDbHost: string;
  setRemoteDbHost: (v: string) => void;
  remoteDbPort: string;
  setRemoteDbPort: (v: string) => void;
  localProxyPort: string;
  setLocalProxyPort: (v: string) => void;
  tunnelStatus: ActionStatus;
  onEstablishTunnel: () => void;
}

export const AwsTunnelChannel: React.FC<AwsTunnelChannelProps> = ({
  awsProfile,
  setAwsProfile,
  bastionHost,
  setBastionHost,
  remoteDbHost,
  setRemoteDbHost,
  remoteDbPort,
  setRemoteDbPort,
  localProxyPort,
  setLocalProxyPort,
  tunnelStatus,
  onEstablishTunnel,
}) => {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col items-start gap-1 pb-2">
        <p className="text-xl font-bold">2. AWS SSM Tunnel Configuration</p>
        <p className="text-sm text-foreground/70">
          Establish an AWS Session Manager port forwarding session through your bastion host to the remote RDS instance.
        </p>
      </CardHeader>
      <Separator />
      <CardContent className="py-2">
        <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5 md:col-span-1">
              <label className={requiredLabelClass}>AWS Profile</label>
              <Input
                placeholder="default"
                variant="primary"
                value={awsProfile}
                onChange={(e) => setAwsProfile(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className={requiredLabelClass}>Bastion Host (Instance ID)</label>
              <Input
                placeholder="i-123293..."
                variant="primary"
                value={bastionHost}
                onChange={(e) => setBastionHost(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={requiredLabelClass}>Remote DB Host</label>
            <Input
              placeholder="my-cluster.cluster-xyz.us-east-1.rds.amazonaws.com"
              variant="primary"
              value={remoteDbHost}
              onChange={(e) => setRemoteDbHost(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={requiredLabelClass}>Remote DB Port</label>
              <Input
                placeholder="5432"
                type="number"
                min={0}
                max={65535}
                variant="primary"
                value={remoteDbPort}
                onChange={(e) => setRemoteDbPort(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={requiredLabelClass}>Local DB Proxy Port</label>
              <Input
                placeholder="5433"
                type="number"
                min={0}
                max={65535}
                variant="primary"
                value={localProxyPort}
                onChange={(e) => setLocalProxyPort(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <StatusButton
              status={tunnelStatus}
              idleText="Establish Tunnel"
              loadingText="Establishing Tunnel..."
              successText="Tunnel Active"
              variant="tertiary"
              onPress={onEstablishTunnel}
            />
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
