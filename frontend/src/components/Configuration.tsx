import React from 'react';
import { Card, CardHeader, CardContent, Separator, Input } from '@heroui/react';
import { useAppStore } from '../store/useAppStore';

const Configuration: React.FC = () => {
  const { config, updateConfig, addNotification } = useAppStore();

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">Configuration</h2>

      <Card>
        <CardHeader className="flex flex-col items-start">
          <p className="text-md font-bold">System Settings</p>
          <p className="text-sm text-foreground/70">Adjust global application parameters</p>
        </CardHeader>
        <Separator />
        <CardContent className="py-6">
          <div className="flex flex-col gap-4 max-w-sm">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Telemetry Refresh Interval</label>
              <Input
                type="number"
                variant="primary"
                value={config.telemetryInterval.toString()}
                onChange={(e) => updateConfig({ telemetryInterval: parseInt(e.target.value) || 30 })}
                onBlur={() => addNotification({ id: Date.now().toString(), status: 'success', message: 'Configuration updated' })}
                min={5}
                max={300}
              />
              <span className="text-xs text-foreground/50">Frequency (in seconds) to fetch updated metrics from connected databases.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Configuration;
