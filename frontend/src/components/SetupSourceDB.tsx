import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Input, Button, Separator } from '@heroui/react';

const SetupSourceDB: React.FC = () => {
  const [connectionMethod, setConnectionMethod] = useState<'aws_ssm' | 'ssh'>('aws_ssm');

  const [awsProfile, setAwsProfile] = useState('');
  const [bastionHost, setBastionHost] = useState('');
  const [remoteDbHost, setRemoteDbHost] = useState('');
  const [remoteDbPort, setRemoteDbPort] = useState('5432');
  const [localProxyPort, setLocalProxyPort] = useState('');

  const [dbName, setDbName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isTunnelEstablishing, setIsTunnelEstablishing] = useState(false);
  const [isTunnelEstablished, setIsTunnelEstablished] = useState(false);

  const handleEstablishTunnel = async () => {
    setIsTunnelEstablishing(true);
    try {
      // Simulate tunnel connection delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsTunnelEstablished(true);
    } catch (error) {
      console.error("Failed to establish tunnel", error);
    } finally {
      setIsTunnelEstablishing(false);
    }
  };

  const handleGenerateToken = async () => {
    setIsGenerating(true);
    try {
      // Simulate token generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPassword("rds-iam-auth-token-placeholder");
    } catch (error) {
      console.error("Failed to generate token", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      <h1 className="text-3xl font-bold mb-2">Create Connection (Source)</h1>

      {/* STEP 1: Connection Method */}
      <Card className="w-full">
        <CardHeader className="flex flex-col items-start gap-1 pb-2">
          <p className="text-xl font-bold">1. Select DB Connection Method</p>
          <p className="text-sm text-foreground/70">Choose how you want to connect to the database.</p>
        </CardHeader>
        <Separator />
        <CardContent className="py-2">
          <div className="flex flex-col md:flex-row gap-4">
            <div
              onClick={() => setConnectionMethod('aws_ssm')}
              className={`flex-1 p-4 border-2 rounded-xl cursor-pointer transition-colors ${connectionMethod === 'aws_ssm' ? 'border-primary bg-primary/10' : 'border-default-200 hover:border-primary/50'}`}
            >
              <p className="font-bold mb-1">AWS Tunnel and Session</p>
              <p className="text-sm text-foreground/70">Connect securely via AWS Systems Manager (SSM) proxy.</p>
            </div>
            <div
              onClick={() => setConnectionMethod('ssh')}
              className={`flex-1 p-4 border-2 rounded-xl cursor-pointer transition-colors ${connectionMethod === 'ssh' ? 'border-primary bg-primary/10' : 'border-default-200 hover:border-primary/50'}`}
            >
              <p className="font-bold mb-1">SSH</p>
              <p className="text-sm text-foreground/70">Connect using standard SSH port forwarding.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* STEP 2: AWS SSM Config */}
      {connectionMethod === 'aws_ssm' && (
        <Card className="w-full">
          <CardHeader className="flex flex-col items-start gap-1 pb-2">
            <p className="text-xl font-bold">2. AWS SSM Tunnel Configuration</p>
            <p className="text-sm text-foreground/70">Configure the parameters to create the session manager tunnel.</p>
          </CardHeader>
          <Separator />
          <CardContent className="py-2">
            <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5 md:col-span-1">
                  <label className="text-sm font-medium text-foreground-500 after:content-['*'] after:text-danger after:ml-0.5">AWS Profile</label>
                  <Input
                    placeholder="default"
                    variant="primary"
                    value={awsProfile}
                    onChange={(e) => setAwsProfile(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-foreground-500 after:content-['*'] after:text-danger after:ml-0.5">Bastion Host (Instance ID)</label>
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
                <label className="text-sm font-medium text-foreground-500 after:content-['*'] after:text-danger after:ml-0.5">Remote DB Host</label>
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
                  <label className="text-sm font-medium text-foreground-500 after:content-['*'] after:text-danger after:ml-0.5">Remote DB Port</label>
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
                  <label className="text-sm font-medium text-foreground-500 after:content-['*'] after:text-danger after:ml-0.5">Local DB Proxy Port</label>
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
                <Button
                  onPress={handleEstablishTunnel}
                  isPending={isTunnelEstablishing}
                  className={isTunnelEstablished ? "bg-green-600 hover:bg-green-700 text-white font-medium" : "font-medium"}
                >
                  {isTunnelEstablished && (
                    <span className="relative flex h-3 w-3 mr-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                  )}
                  {isTunnelEstablished ? "Tunnel Established" : "Establish Connection"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: SSH Config Placeholder */}
      {connectionMethod === 'ssh' && (
        <Card className="w-full">
          <CardHeader className="flex flex-col items-start gap-1 pb-2">
            <p className="text-xl font-bold">2. SSH Configuration</p>
            <p className="text-sm text-foreground/70">Configure your SSH parameters.</p>
          </CardHeader>
          <Separator />
          <CardContent className="py-12 flex justify-center text-foreground/50">
            <p>SSH Configuration form will be implemented here.</p>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Database Connection */}
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
                <label className="text-sm font-medium text-foreground-500">Host</label>
                <Input
                  value="localhost"
                  disabled
                  variant="secondary"
                  className="bg-default-200 opacity-60 cursor-not-allowed"
                />
                  <p className="text-xs text-foreground/50">Connected via SSM tunnel</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground-500">Port</label>
                <Input
                  value={localProxyPort || "—"}
                  disabled
                  variant="secondary"
                  className="bg-default-200 opacity-60 cursor-not-allowed"
                />
                  <p className="text-xs text-foreground/50">Mapped to proxy port</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground-500 after:content-['*'] after:text-danger after:ml-0.5">Database Name</label>
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
                <label className="text-sm font-medium text-foreground-500 after:content-['*'] after:text-danger after:ml-0.5">Username</label>
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
                <label className="text-sm font-medium text-foreground-500 after:content-['*'] after:text-danger after:ml-0.5">Password / Token</label>
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
                onPress={handleGenerateToken}
                isPending={isGenerating}
                isDisabled={!isTunnelEstablished}
              >
                Generate Token
              </Button>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <Button variant="tertiary" isDisabled={!isTunnelEstablished}>
                Test DB Connection
              </Button>
              <Button variant="primary" isDisabled={!isTunnelEstablished}>
                Save Connection
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupSourceDB;
