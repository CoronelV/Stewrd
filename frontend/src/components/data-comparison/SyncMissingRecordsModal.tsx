import React from 'react';
import { Button } from '@heroui/react';
import { AlertTriangle, ArrowRight, DatabaseZap, ShieldCheck, X } from 'lucide-react';
import type { SyncDirection } from '../../api/requests.interface';
import { EnvironmentBadge } from '../common/EnvironmentBadge';

interface SyncMissingRecordsModalProps {
  direction: SyncDirection | null;
  tableName: string;
  sourceSchema: string;
  targetSchema: string;
  sourceEnvironment?: string | undefined;
  targetEnvironment?: string | undefined;
  recordCount: number;
  onConfirm: (direction: SyncDirection) => void;
  onClose: () => void;
}

export const SyncMissingRecordsModal: React.FC<SyncMissingRecordsModalProps> = ({
  direction,
  tableName,
  sourceSchema,
  targetSchema,
  sourceEnvironment,
  targetEnvironment,
  recordCount,
  onConfirm,
  onClose,
}) => {
  if (!direction) return null;

  const toTarget = direction === 'source_to_target';
  const originLabel = toTarget ? 'Source' : 'Target';
  const destinationLabel = toTarget ? 'Target' : 'Source';
  const originSchema = toTarget ? sourceSchema : targetSchema;
  const destinationSchema = toTarget ? targetSchema : sourceSchema;
  const originEnv = toTarget ? sourceEnvironment : targetEnvironment;
  const destinationEnv = toTarget ? targetEnvironment : sourceEnvironment;
  const isProductionDestination = (destinationEnv ?? '').toUpperCase() === 'PRD';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-lg bg-surface border border-separator rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-separator">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${toTarget ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
              <DatabaseZap size={20} />
            </div>
            <div>
              <h4 className="text-lg font-bold">Sync missing records</h4>
              <p className="text-xs text-foreground/70">
                Insert the {originLabel}-only records of &apos;{tableName}&apos; into {destinationLabel}.
              </p>
            </div>
          </div>
          <Button isIconOnly variant="ghost" size="sm" onPress={onClose} aria-label="Close">
            <X size={18} />
          </Button>
        </div>

        <div className="p-6 flex flex-col gap-4 text-xs">
          {/* Direction overview */}
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-default-100 border border-default-200">
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-foreground/50 tracking-wider">From ({originLabel})</span>
                <EnvironmentBadge environment={originEnv} size="sm" className="shrink-0" />
              </div>
              <span className="font-mono font-semibold text-xs text-foreground truncate" title={`${originSchema}.${tableName}`}>
                {originSchema}.{tableName}
              </span>
            </div>

            <div className="shrink-0 px-1 pt-3">
              <ArrowRight size={18} className="text-foreground/40" />
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-1 items-end text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-[10px] uppercase font-bold text-foreground/50 tracking-wider">To ({destinationLabel})</span>
                <EnvironmentBadge environment={destinationEnv} size="sm" className="shrink-0" />
              </div>
              <span className="font-mono font-semibold text-xs text-foreground truncate max-w-full" title={`${destinationSchema}.${tableName}`}>
                {destinationSchema}.{tableName}
              </span>
            </div>
          </div>

          <p className="text-foreground/80">
            <span className="font-bold text-foreground">{recordCount.toLocaleString()}</span> record(s) will be
            inserted into {destinationLabel}.
          </p>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-success/5 border border-success/30">
            <ShieldCheck size={16} className="text-success shrink-0 mt-0.5" />
            <span className="text-foreground/80">
              Insert-only operation: existing records in {destinationLabel} are never updated nor deleted.
              Records that collide with an existing key or violate a constraint are skipped.
            </span>
          </div>

          {isProductionDestination && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-danger/5 border border-danger/30">
              <AlertTriangle size={16} className="text-danger shrink-0 mt-0.5" />
              <span className="text-foreground/80">
                The destination is a <span className="font-bold text-danger">production</span> database. Make sure
                you really want to write into it.
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-end items-center gap-2 px-6 py-4 border-t border-separator bg-default-50">
          <Button variant="ghost" onPress={onClose}>
            Cancel
          </Button>
          <Button
            variant={isProductionDestination ? 'danger' : 'primary'}
            className="font-bold"
            onPress={() => onConfirm(direction)}
          >
            Insert into {destinationLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
