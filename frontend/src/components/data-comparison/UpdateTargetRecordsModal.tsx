import React from 'react';
import { Button, Spinner } from '@heroui/react';
import { AlertTriangle, ArrowRight, ArrowRightToLine, ShieldAlert, X } from 'lucide-react';
import { EnvironmentBadge } from '../common/EnvironmentBadge';

interface UpdateTargetRecordsModalProps {
  isOpen: boolean;
  tableName: string;
  sourceSchema: string;
  targetSchema: string;
  sourceEnvironment?: string | undefined;
  targetEnvironment?: string | undefined;
  recordCount: number;
  singleKeyDisplay?: string | undefined;
  differingColumns?: string[] | undefined;
  isUpdating: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const UpdateTargetRecordsModal: React.FC<UpdateTargetRecordsModalProps> = ({
  isOpen,
  tableName,
  sourceSchema,
  targetSchema,
  sourceEnvironment,
  targetEnvironment,
  recordCount,
  singleKeyDisplay,
  differingColumns,
  isUpdating,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const isProductionDestination = (targetEnvironment ?? '').toUpperCase() === 'PRD';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-lg bg-surface border border-separator rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-separator">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <ArrowRightToLine size={20} />
            </div>
            <div>
              <h4 className="text-lg font-bold">Update Target Records</h4>
              <p className="text-xs text-foreground/70">
                Overwrite target values with data from source for &apos;{tableName}&apos;.
              </p>
            </div>
          </div>
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            onPress={onClose}
            isDisabled={isUpdating}
            aria-label="Close"
          >
            <X size={18} />
          </Button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4 text-xs">
          {/* Direction overview */}
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-default-100 border border-default-200">
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-foreground/50 tracking-wider">
                  Source (Origin)
                </span>
                <EnvironmentBadge environment={sourceEnvironment} size="sm" className="shrink-0" />
              </div>
              <span
                className="font-mono font-semibold text-xs text-foreground truncate"
                title={`${sourceSchema}.${tableName}`}
              >
                {sourceSchema}.{tableName}
              </span>
            </div>

            <div className="shrink-0 px-1 pt-3">
              <ArrowRight size={18} className="text-foreground/40" />
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-1 items-end text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-[10px] uppercase font-bold text-foreground/50 tracking-wider">
                  Target (Destination)
                </span>
                <EnvironmentBadge environment={targetEnvironment} size="sm" className="shrink-0" />
              </div>
              <span
                className="font-mono font-semibold text-xs text-foreground truncate max-w-full"
                title={`${targetSchema}.${tableName}`}
              >
                {targetSchema}.{tableName}
              </span>
            </div>
          </div>

          {/* Details */}
          {singleKeyDisplay ? (
            <div className="p-3 rounded-xl bg-default-50 border border-default-200 flex flex-col gap-1.5">
              <div className="text-[11px] font-medium text-foreground/70">Record Identity:</div>
              <div className="font-mono text-xs font-semibold text-primary">{singleKeyDisplay}</div>
              {differingColumns && differingColumns.length > 0 && (
                <div className="text-[11px] text-foreground/60 mt-1">
                  Differing columns ({differingColumns.length}):{' '}
                  <span className="font-mono text-amber-500 font-medium">
                    {differingColumns.join(', ')}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-foreground/80">
              <span className="font-bold text-foreground">{recordCount.toLocaleString()}</span> record(s)
              will be updated in Target with the matching Source values.
            </p>
          )}

          {/* Warning */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
            <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-500" />
            <span>
              Target records matching the specified primary key(s) will be modified to match the source
              database data. This operation modifies data in the target database.
            </span>
          </div>

          {isProductionDestination && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-danger/5 border border-danger/30">
              <AlertTriangle size={16} className="text-danger shrink-0 mt-0.5" />
              <span className="text-foreground/80">
                The target database is marked as <span className="font-bold text-danger">production</span>.
                Please ensure you intend to apply these updates to production.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center gap-2 px-6 py-4 border-t border-separator bg-default-50">
          <Button variant="ghost" onPress={onClose} isDisabled={isUpdating}>
            Cancel
          </Button>
          <Button
            variant={isProductionDestination ? 'danger' : 'primary'}
            className="font-bold"
            isDisabled={isUpdating}
            onPress={onConfirm}
          >
            {isUpdating ? (
              <>
                <Spinner size="sm" />
                <span>Updating Target…</span>
              </>
            ) : (
              <span>Update Target {recordCount === 1 ? 'Record' : `${recordCount.toLocaleString()} Records`}</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
