import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Separator } from '@heroui/react';
import { ApiRequestError, testConnection, saveConnection } from '../../api/connectionsApi';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import type { Environment } from '../../store/useAppStore';
import type { ActionStatus } from './common/StatusButton';
import { SshChannel } from './channels/SshChannel';
import { AwsTunnelChannel } from './channels/AwsTunnelChannel';
import { MySqlDatabase } from './databases/MySqlDatabase';
import { AwsDatabase } from './databases/AwsDatabase';
import { Monitor, Network, Cloud } from 'lucide-react';

const SetupSourceDB: React.FC = () => {
  const navigate = useNavigate();
  const { setSourceDb, addNotification, updateNotification } = useAppStore();
  const [connectionMethod, setConnectionMethod] = useState<'direct' | 'ssh' | 'aws_ssm'>('direct');
  const isDirect = connectionMethod === 'direct';
  const isSsh = connectionMethod === 'ssh';
  const isAws = connectionMethod === 'aws_ssm';
  const [environment, setEnvironment] = useState<Environment>('DEV');

  // AWS SSM
  const [awsProfile, setAwsProfile] = useState('');
  const [bastionHost, setBastionHost] = useState('');
  const [remoteDbHost, setRemoteDbHost] = useState('');
  const [remoteDbPort, setRemoteDbPort] = useState('5432');
  const [localProxyPort, setLocalProxyPort] = useState('');

  // SSH
  const [sshHost, setSshHost] = useState('ssh.pythonanywhere.com');
  const [sshPort, setSshPort] = useState('22');
  const [sshUsername, setSshUsername] = useState('');
  const [sshPassword, setSshPassword] = useState('');
  const [sshKeyFile, setSshKeyFile] = useState('');
  const [insecureHostKey, setInsecureHostKey] = useState(false);

  // Database
  const [databaseEngine, setDatabaseEngine] = useState('');
  const [mysqlHost, setMysqlHost] = useState('');
  const [mysqlPort, setMysqlPort] = useState('3306');
  const [dbName, setDbName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Statuses
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; detail?: string } | null>(null);
  const [tunnelStatus, setTunnelStatus] = useState<ActionStatus>('idle');
  const isTunnelEstablished = tunnelStatus === 'success';
  const [awsTestStatus, setAwsTestStatus] = useState<ActionStatus>('idle');
  const [sshTestStatus, setSshTestStatus] = useState<ActionStatus>('idle');
  const [isGenerating, setIsGenerating] = useState(false);

  const selectMethod = (method: 'direct' | 'ssh' | 'aws_ssm') => {
    if (method === connectionMethod) return;
    setConnectionMethod(method);
    setTunnelStatus('idle');
    setAwsTestStatus('idle');
    setSshTestStatus('idle');
    setTestResult(null);
    if (method === 'direct' && !mysqlHost) {
      setMysqlHost('127.0.0.1');
    }
  };

  const handleEstablishTunnel = async () => {
    setTunnelStatus('loading');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTunnelStatus('success');
    } catch (error) {
      console.error("Failed to establish tunnel", error);
      setTunnelStatus('error');
    }
  };

  const handleTestAwsConnection = async () => {
    setAwsTestStatus('loading');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setAwsTestStatus('success');
    } catch (error) {
      setAwsTestStatus('error');
    }
  };

  const handleSaveConnection = async () => {
    if (!databaseEngine || databaseEngine === '-') {
      addNotification({ id: Date.now().toString(), message: 'Database engine is required. Please select a database engine.', status: 'error' });
      return;
    }

    const notifId = Date.now().toString();
    addNotification({ id: notifId, message: 'Connecting to db...', status: 'loading' });

    try {
      if (connectionMethod === 'direct') {
        await saveConnection({
          target: 'source',
          environment: environment,
          channelType: 'Direct (Local)',
          engine: databaseEngine,
          ssh: {
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
        }, 'source');

        setSourceDb({
          target: 'source',
          status: 'active',
          dbName: dbName.trim() || '-',
          channelType: 'Direct (Local)',
          engine: databaseEngine,
          username: username.trim(),
          environment: environment,
        });
      } else if (connectionMethod === 'ssh') {
        await saveConnection({
          target: 'source',
          environment: environment,
          channelType: 'SSH Tunnel',
          engine: databaseEngine,
          ssh: {
            host: sshHost,
            port: Number(sshPort),
            user: sshUsername,
            password: sshPassword,
            insecureIgnoreHostKey: insecureHostKey,
          },
          mysql: {
            host: mysqlHost,
            port: Number(mysqlPort),
            user: username,
            password: password,
            schema: dbName,
          },
        }, 'source');

        setSourceDb({
          target: 'source',
          status: 'active',
          dbName: dbName || '-',
          channelType: 'SSH Tunnel',
          engine: databaseEngine,
          username: username,
          environment: environment,
        });
      } else {
        await new Promise(resolve => setTimeout(resolve, 1500));

        setSourceDb({
          target: 'source',
          status: 'active',
          dbName: dbName || '-',
          channelType: 'AWS SSM',
          engine: databaseEngine,
          username: username,
          environment: environment,
        });
      }

      updateNotification(notifId, { message: 'Source database connected', status: 'success' });
      navigate('/');
    } catch (error) {
      updateNotification(notifId, { message: 'Failed to connect', status: 'error' });
    }
  };

  const handleTestSshConnection = async () => {
    if (!databaseEngine || databaseEngine === '-') {
      setSshTestStatus('error');
      setTestResult({
        ok: false,
        message: 'Database engine is required. Please select a database engine.',
      });
      return;
    }

    setSshTestStatus('loading');
    setTestResult(null);

    try {
      const isDirectConn = connectionMethod === 'direct';
      const result = await testConnection({
        target: 'source',
        environment: environment,
        channelType: isDirectConn ? 'Direct' : 'SSH Tunnel',
        engine: databaseEngine,
        ssh: isDirectConn ? {
          host: '',
          port: 22,
          user: '',
        } : {
          host: sshHost.trim(),
          port: Number(sshPort),
          user: sshUsername.trim(),
          password: sshPassword || undefined,
          privateKeyPath: sshKeyFile.trim() || undefined,
          insecureIgnoreHostKey: insecureHostKey || undefined,
        },
        mysql: {
          host: mysqlHost.trim() || (isDirectConn ? '127.0.0.1' : ''),
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
      setSshTestStatus('success');
    } catch (err) {
      setSshTestStatus('error');
      if (err instanceof ApiRequestError) {
        setTestResult({
          ok: false,
          message: err.message,
          detail: err.detailed,
        });
      } else {
        setTestResult({
          ok: false,
          message: `Error testing ${connectionMethod === 'direct' ? 'local ' : ''}${databaseEngine.toUpperCase()} connection.`,
          detail: String(err),
        });
      }
    }
  };

  const handleGenerateToken = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setPassword("token_" + Math.random().toString(36).substring(7));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">Source Database Setup</h2>

      {/* STEP 1: Select Connection Method */}
      <Card className="w-full">
        <CardHeader className="flex flex-col items-start gap-1 pb-2">
          <p className="text-xl font-bold">1. Select DB Connection Method</p>
          <p className="text-sm text-foreground/70">Choose how you want to connect to the source database.</p>
        </CardHeader>
        <Separator />
        <CardContent className="py-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <p className="text-sm text-foreground/70">Connect directly to a database running locally on your machine.</p>
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
                <p className="font-bold mb-1">SSH Tunnel</p>
                <p className="text-sm text-foreground/70">Standard TCP/IP over SSH tunnel.</p>
              </div>
            </div>

            <div
              onClick={() => selectMethod('aws_ssm')}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex items-start gap-3 ${
                connectionMethod === 'aws_ssm'
                  ? 'border-primary bg-primary/10 shadow-xs'
                  : 'border-default-200 hover:border-primary/50'
              }`}
            >
              <Cloud className="text-primary mt-0.5 shrink-0" size={24} />
              <div>
                <p className="font-bold mb-1">AWS SSM Tunnel</p>
                <p className="text-sm text-foreground/70">Connect securely via AWS Systems Manager proxy.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* When Direct: configure local database directly */}
      {isDirect && (
        <MySqlDatabase
          databaseEngine={databaseEngine}
          setDatabaseEngine={setDatabaseEngine}
          mysqlHost={mysqlHost || '127.0.0.1'}
          setMysqlHost={setMysqlHost}
          mysqlPort={mysqlPort}
          setMysqlPort={setMysqlPort}
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          dbName={dbName}
          setDbName={setDbName}
          environment={environment}
          setEnvironment={setEnvironment}
          testStatus={sshTestStatus}
          onTestConnection={handleTestSshConnection}
          onSaveConnection={handleSaveConnection}
          testResult={testResult}
          stepNumber="2."
          subtitle="Configure credentials to connect directly to your local database engine."
          hostLabel="Local Database Host"
          hostDescription="Localhost IP or host address (127.0.0.1)."
        />
      )}

      {/* STEP 2: Channel Configuration for SSH or AWS */}
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

      {isAws && (
        <AwsTunnelChannel
          awsProfile={awsProfile}
          setAwsProfile={setAwsProfile}
          bastionHost={bastionHost}
          setBastionHost={setBastionHost}
          remoteDbHost={remoteDbHost}
          setRemoteDbHost={setRemoteDbHost}
          remoteDbPort={remoteDbPort}
          setRemoteDbPort={setRemoteDbPort}
          localProxyPort={localProxyPort}
          setLocalProxyPort={setLocalProxyPort}
          tunnelStatus={tunnelStatus}
          onEstablishTunnel={handleEstablishTunnel}
        />
      )}

      {/* STEP 3: Database Connection for SSH */}
      {isSsh && (
        <MySqlDatabase
          databaseEngine={databaseEngine}
          setDatabaseEngine={setDatabaseEngine}
          mysqlHost={mysqlHost}
          setMysqlHost={setMysqlHost}
          mysqlPort={mysqlPort}
          setMysqlPort={setMysqlPort}
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          dbName={dbName}
          setDbName={setDbName}
          environment={environment}
          setEnvironment={setEnvironment}
          testStatus={sshTestStatus}
          onTestConnection={handleTestSshConnection}
          onSaveConnection={handleSaveConnection}
          testResult={testResult}
          stepNumber="3."
          subtitle="Select your database engine and configure credentials through the SSH tunnel."
          hostLabel="Database Hostname"
          hostDescription="Database server host relative to the SSH server."
        />
      )}

      {/* STEP 3: Database Connection for AWS */}
      {isAws && (
        <AwsDatabase
          databaseEngine={databaseEngine}
          setDatabaseEngine={setDatabaseEngine}
          isTunnelEstablished={isTunnelEstablished}
          localProxyPort={localProxyPort}
          dbName={dbName}
          setDbName={setDbName}
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          isGenerating={isGenerating}
          onGenerateToken={handleGenerateToken}
          environment={environment}
          setEnvironment={setEnvironment}
          testStatus={awsTestStatus}
          onTestConnection={handleTestAwsConnection}
          onSaveConnection={handleSaveConnection}
        />
      )}
    </div>
  );
};

export default SetupSourceDB;
