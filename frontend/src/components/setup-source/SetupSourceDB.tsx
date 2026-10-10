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

const SetupSourceDB: React.FC = () => {
  const navigate = useNavigate();
  const { setSourceDb, addNotification, updateNotification } = useAppStore();
  const [connectionMethod, setConnectionMethod] = useState<'aws_ssm' | 'ssh'>('aws_ssm');
  const isSsh = connectionMethod === 'ssh';
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
  const [databaseEngine, setDatabaseEngine] = useState('mysql');
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

  const selectMethod = (method: 'aws_ssm' | 'ssh') => {
    if (method === connectionMethod) return;
    setConnectionMethod(method);
    setTunnelStatus('idle');
    setAwsTestStatus('idle');
    setSshTestStatus('idle');
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
    const notifId = Date.now().toString();
    addNotification({ id: notifId, message: 'Connecting to db...', status: 'loading' });

    try {
      if (connectionMethod === 'ssh') {
        await saveConnection({
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
          }
        });
      } else {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      setSourceDb({
        type: 'Source',
        status: 'active',
        dbName: dbName || 'default_db',
        channelType: connectionMethod === 'ssh' ? 'SSH Tunnel' : 'AWS SSM',
        username: username || sshUsername || 'admin',
        environment: environment,
      });

      updateNotification(notifId, { message: 'Connected', status: 'success' });
      navigate('/');
    } catch (error) {
      updateNotification(notifId, { message: 'Failed to connect', status: 'error' });
    }
  };

  const handleTestSshConnection = async () => {
    setSshTestStatus('loading');
    setTestResult(null);

    try {
      const result = await testConnection({
        ssh: {
          host: sshHost.trim(),
          port: Number(sshPort),
          user: sshUsername.trim(),
          password: sshPassword || undefined,
          privateKeyPath: sshKeyFile.trim() || undefined,
          insecureIgnoreHostKey: insecureHostKey || undefined,
        },
        mysql: {
          host: mysqlHost.trim(),
          port: Number(mysqlPort),
          user: username.trim(),
          password: password,
          schema: dbName.trim() || undefined,
        },
      });

      setTestResult({
        ok: true,
        message: `Connected to MySQL ${result.serverVersion || ''} in ${result.latencyMs}ms`,
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
          message: 'An unexpected error occurred during test.',
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
          <p className="text-sm text-foreground/70">Choose how you want to connect to the database.</p>
        </CardHeader>
        <Separator />
        <CardContent className="py-2">
          <div className="flex flex-col md:flex-row gap-4">
            <div
              onClick={() => selectMethod('aws_ssm')}
              className={`flex-1 p-4 border-2 rounded-xl cursor-pointer transition-colors ${connectionMethod === 'aws_ssm' ? 'border-primary bg-primary/10' : 'border-default-200 hover:border-primary/50'}`}
            >
              <p className="font-bold mb-1">AWS Tunnel and Session</p>
              <p className="text-sm text-foreground/70">Connect securely via AWS Systems Manager (SSM) proxy.</p>
            </div>
            <div
              onClick={() => selectMethod('ssh')}
              className={`flex-1 p-4 border-2 rounded-xl cursor-pointer transition-colors ${connectionMethod === 'ssh' ? 'border-primary bg-primary/10' : 'border-default-200 hover:border-primary/50'}`}
            >
              <p className="font-bold mb-1">SSH</p>
              <p className="text-sm text-foreground/70">Standard TCP/IP over SSH tunnel.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* STEP 2: Channel Configuration */}
      {isSsh ? (
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
      ) : (
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

      {/* STEP 3: Database Connection */}
      {isSsh ? (
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
        />
      ) : (
        <AwsDatabase
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
