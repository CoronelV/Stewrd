import React from 'react';
import { Card, CardHeader, CardContent, Input, Separator } from '@heroui/react';
import { labelClass, requiredLabelClass } from '../common/formStyles';

interface SshChannelProps {
  sshHost: string;
  setSshHost: (v: string) => void;
  sshPort: string;
  setSshPort: (v: string) => void;
  sshUsername: string;
  setSshUsername: (v: string) => void;
  sshPassword: string;
  setSshPassword: (v: string) => void;
  sshKeyFile: string;
  setSshKeyFile: (v: string) => void;
  insecureHostKey: boolean;
  setInsecureHostKey: (v: boolean) => void;
}

export const SshChannel: React.FC<SshChannelProps> = ({
  sshHost,
  setSshHost,
  sshPort,
  setSshPort,
  sshUsername,
  setSshUsername,
  sshPassword,
  setSshPassword,
  sshKeyFile,
  setSshKeyFile,
  insecureHostKey,
  setInsecureHostKey,
}) => {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col items-start gap-1 pb-2">
        <p className="text-xl font-bold">2. SSH Connection</p>
        <p className="text-sm text-foreground/70">
          Standard TCP/IP over SSH. The tunnel is opened automatically when you test or save. Provide an SSH password, a private key file, or both.
        </p>
      </CardHeader>
      <Separator />
      <CardContent className="py-2">
        <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className={requiredLabelClass}>SSH Hostname</label>
              <Input
                placeholder="ssh.pythonanywhere.com"
                variant="primary"
                value={sshHost}
                onChange={(e) => setSshHost(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={requiredLabelClass}>SSH Port</label>
              <Input
                placeholder="22"
                type="number"
                min={1}
                max={65535}
                variant="primary"
                value={sshPort}
                onChange={(e) => setSshPort(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={requiredLabelClass}>SSH Username</label>
              <Input
                placeholder="SSH user name"
                variant="primary"
                value={sshUsername}
                onChange={(e) => setSshUsername(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>SSH Password</label>
              <Input
                placeholder="SSH user password"
                type="password"
                variant="primary"
                value={sshPassword}
                onChange={(e) => setSshPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>SSH Key File</label>
            <Input
              placeholder="Path to SSH private key file (optional)"
              variant="primary"
              value={sshKeyFile}
              onChange={(e) => setSshKeyFile(e.target.value)}
            />
          </div>

          <label className="flex items-start gap-2 text-sm text-foreground/70 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={insecureHostKey}
              onChange={(e) => setInsecureHostKey(e.target.checked)}
            />
            <span>
              Skip SSH host key verification (insecure). By default the host must already be in your <code>~/.ssh/known_hosts</code>.
            </span>
          </label>
        </form>
      </CardContent>
    </Card>
  );
};
