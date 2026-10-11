import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Separator, Input, Button } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { ApiRequestError, testConnection, saveConnection } from '../../api/connectionsApi';
import { useAppStore } from '../../store/useAppStore';
import type { Environment } from '../../store/useAppStore';
import { StatusButton } from '../setup-source/common/StatusButton';
import type { ActionStatus } from '../setup-source/common/StatusButton';
import { labelClass, requiredLabelClass } from '../setup-source/common/formStyles';
import { EnvironmentSelector } from '../setup-source/common/EnvironmentSelector';
import { SshChannel } from '../setup-source/channels/SshChannel';
import { DatabaseEngineSelector } from '../common/DatabaseEngineSelector';
import { CheckCircle2, AlertTriangle, Monitor, Network } from 'lucide-react';

export const SetupTargetDB: React.FC = () => {
  const navigate = useNavigate();
  const { setTargetDb, addNotification, updateNotification } = useAppStore();

  const [connectionMethod, setConnectionMethod] = useState<'direct' | 'ssh'>('direct');
  const isSsh = connectionMethod === 'ssh';
  const [environment, setEnvironment] = useState<Environment>('DEV');

  // SSH Fields (if SSH mode selected)
  const [sshHost, setSshHost] = useState('');
  const [sshPort, setSshPort] = useState('22');
  const [sshUsername, setSshUsername] = useState('');
  const [sshPassword, setSshPassword] = useState('');
  const [sshKeyFile, setSshKeyFile] = useState('');
  const [insecureHostKey, setInsecureHostKey] = useState(false);

  // Database Connection Fields (Local Direct or through SSH)
  const [databaseEngine, setDatabaseEngine] = useState('');
  const [mysqlHost, setMysqlHost] = useState('127.0.0.1');
  const [mysqlPort, setMysqlPort] = useState('3306');
  const [dbName, setDbName] = useState('stewrd_local');
  const [username, setUsername] = useState('root');
  const [password, setPassword] = useState('');

  // Statuses & Feedback
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; detail?: string } | null>(null);
  const [testStatus, setTestStatus] = useState<ActionStatus>('idle');

  const selectMethod = (method: 'direct' | 'ssh') => {
    if (method === connectionMethod) return;
    setConnectionMethod(method);
    setTestResult(null);
    setTestStatus('idle');
    if (method === 'direct') {
      setMysqlHost('127.0.0.1');
      setMysqlPort('3306');
    }
  };

  const handleTestConnection = async () => {
    if (!databaseEngine || databaseEngine === '-') {
      setTestStatus('error');
      setTestResult({
        ok: false,
        message: 'Database engine is required. Please select a database engine.',
      });
      return;
    }

    setTestStatus('loading');
    setTestResult(null);

    try {
      const result = await testConnection({
        target: 'target',
        environment: environment,
        channelType: isSsh ? 'SSH Tunnel' : 'Direct',
        engine: databaseEngine,
        ssh: isSsh ? {
          host: sshHost.trim(),
          port: Number(sshPort),
          user: sshUsername.trim(),
          password: sshPassword || undefined,
          privateKeyPath: sshKeyFile.trim() || undefined,
          insecureIgnoreHostKey: insecureHostKey || undefined,
        } : {
          host: '',
          port: 22,
          user: '',
        },
        mysql: {
          host: mysqlHost.trim() || '127.0.0.1',
          port: Number(mysqlPort) || 3306,
          user: username.trim(),
          password: password,
          schema: dbName.trim() || undefined,
        },
      });

      setTestResult({
        ok: true,
        message: `Connected to ${result.serverVersion || databaseEngine.toUpperCase()} in ${result.latencyMs}ms`,
      });
      setTestStatus('success');
    } catch (err) {
      setTestStatus('error');
      if (err instanceof ApiRequestError) {
        setTestResult({
          ok: false,
          message: err.message,
          detail: err.detailed,
        });
      } else {
        setTestResult({
          ok: false,
          message: `Error testing local ${databaseEngine.toUpperCase()} connection.`,
          detail: String(err),
        });
      }
    }
  };

  const handleSaveConnection = async () => {
    if (!databaseEngine || databaseEngine === '-') {
      addNotification({ id: Date.now().toString(), message: 'Database engine is required. Please select a database engine.', status: 'error' });
      return;
    }

    const notifId = Date.now().toString();
    addNotification({ id: notifId, message: 'Saving local target connection...', status: 'loading' });

    try {
      await saveConnection({
        target: 'target',
        environment: environment,
        channelType: isSsh ? 'SSH Tunnel' : 'Direct',
        engine: databaseEngine,
        ssh: isSsh ? {
          host: sshHost,
          port: Number(sshPort),
          user: sshUsername,
          password: sshPassword,
          insecureIgnoreHostKey: insecureHostKey,
        } : {
          host: '',
          port: 22,
          user: '',
        },
        mysql: {
          host: mysqlHost.trim() || '127.0.0.1',
          port: Number(mysqlPort) || 3306,
          user: username.trim(),
          password: password,
          schema: dbName.trim() || 'stewrd_local',
        },
      }, 'target');

      setTargetDb({
        target: 'target',
        status: 'active',
        dbName: dbName || 'stewrd_local',
        channelType: isSsh ? 'SSH Tunnel' : 'Direct (Local)',
        engine: databaseEngine,
        username: username,
        environment: environment,
      });

      updateNotification(notifId, { message: 'Local target connection configured successfully', status: 'success' });
      navigate('/');
    } catch {
      updateNotification(notifId, { message: 'Failed to save local target connection', status: 'error' });
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-bold">Set Up Target DB (Local)</h2>
        <p className="text-sm text-foreground/70 mt-1">
          Configure your local MySQL database as the replication target to copy schemas and data.
        </p>
      </div>

      {/* STEP 1: Connection Type */}
      <Card className="w-full">
        <CardHeader className="flex flex-col items-start gap-1 pb-2">
          <p className="text-xl font-bold">1. Connection Type</p>
          <p className="text-sm text-foreground/70">
            Select whether to connect directly to the MySQL installed on your machine or through a tunnel.
          </p>
        </CardHeader>
        <Separator />
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => selectMethod('direct')}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex items-start gap-3 ${
                connectionMethod === 'direct'
                  ? 'border-primary bg-primary/10 shadow-xs'
                  : 'border-default-200 hover:border-primary/50'
              }`}
            >
              <Monitor className="text-primary mt-0.5 shrink-0" size={24} />
              <div>
                <p className="font-bold mb-1">Direct Localhost</p>
                <p className="text-sm text-foreground/70">
                  Direct connection to locally installed MySQL Server (127.0.0.1:3306).
                </p>
              </div>
            </div>

            <div
              onClick={() => selectMethod('ssh')}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex items-start gap-3 ${
                connectionMethod === 'ssh'
                  ? 'border-primary bg-primary/10 shadow-xs'
                  : 'border-default-200 hover:border-primary/50'
              }`}
            >
              <Network className="text-primary mt-0.5 shrink-0" size={24} />
              <div>
                <p className="font-bold mb-1">SSH Tunnel (Remote)</p>
                <p className="text-sm text-foreground/70">
                  When the target database is located on a host or network accessible via SSH.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* STEP 2: SSH Channel (only if SSH selected) */}
      {isSsh && (
        <SshChannel
          sshHost={sshHost}
          setSshHost={setSshHost}
          sshPort={sshPort}
          setSshPort={setSshPort}
          sshUsername={sshUsername}
          setSshUsername={setSshUsername}
          sshPassword={sshPassword}
          setSshPassword={setSshPassword}
          sshKeyFile={sshKeyFile}
          setSshKeyFile={setSshKeyFile}
          insecureHostKey={insecureHostKey}
          setInsecureHostKey={setInsecureHostKey}
        />
      )}

      {/* STEP 3: Local MySQL Credentials & Endpoint */}
      <Card className="w-full">
        <CardHeader className="flex flex-col items-start gap-1 pb-2">
          <p className="text-xl font-bold">{isSsh ? '3.' : '2.'} Local Database Parameters</p>
          <p className="text-sm text-foreground/70">
            Enter credentials and target schema on your local MySQL.
          </p>
        </CardHeader>
        <Separator />
        <CardContent className="py-4">
          <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Database Engine</label>
                <DatabaseEngineSelector
                  value={databaseEngine}
                  onChange={(engine) => setDatabaseEngine(engine)}
                  onAutoPortChange={(newPort) => setMysqlPort(newPort)}
                  currentPort={mysqlPort}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Environment</label>
                <EnvironmentSelector
                  value={environment}
                  onChange={setEnvironment}
                  options={['DEV', 'STG', 'UAT']}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className={requiredLabelClass}>Host</label>
                <Input
                  placeholder="127.0.0.1"
                  variant="primary"
                  value={mysqlHost}
                  onChange={(e) => setMysqlHost(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={requiredLabelClass}>Port</label>
                <Input
                  placeholder="3306"
                  type="number"
                  variant="primary"
                  value={mysqlPort}
                  onChange={(e) => setMysqlPort(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={requiredLabelClass}>Database Username</label>
                <Input
                  placeholder="root"
                  variant="primary"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Password</label>
                <Input
                  placeholder="Password for local database"
                  type="password"
                  variant="primary"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={requiredLabelClass}>Destination Database / Schema Name</label>
              <Input
                placeholder="stewrd_local"
                variant="primary"
                value={dbName}
                onChange={(e) => setDbName(e.target.value)}
                required
              />
              <p className="text-xs text-foreground/50">
                The job will create this schema automatically if it does not yet exist on your local MySQL.
              </p>
            </div>

            {/* Test Connection Output */}
            {testResult && (
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  testResult.ok
                    ? 'bg-success/10 border-success/30 text-success-700 dark:text-success-400'
                    : 'bg-danger/10 border-danger/30 text-danger-700 dark:text-danger-400'
                }`}
              >
                {testResult.ok ? (
                  <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                )}
                <div className="flex flex-col gap-1 text-sm">
                  <span className="font-semibold">{testResult.message}</span>
                  {testResult.detail && (
                    <span className="text-xs opacity-80 font-mono break-all">{testResult.detail}</span>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-separator">
              <StatusButton
                status={testStatus}
                onPress={handleTestConnection}
                idleText="Test Local Connection"
                loadingText="Connecting to MySQL..."
                variant="secondary"
                isDisabled={!mysqlHost || !username}
              />
              <Button
                variant="primary"
                onPress={handleSaveConnection}
                isDisabled={!mysqlHost || !username}
                className="w-full sm:w-auto font-semibold shadow-xs"
              >
                Save Destination Connection
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupTargetDB;
