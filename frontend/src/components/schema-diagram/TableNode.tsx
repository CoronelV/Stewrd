import React from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { KeyRound, Link2, Table as TableIcon } from 'lucide-react';
import type { TableSchema } from './types';

export interface TableNodeData extends Record<string, unknown> {
  table: TableSchema;
  isMatched?: boolean;
}

export type TableNodeType = Node<TableNodeData, 'tableNode'>;

export const TableNode: React.FC<NodeProps<TableNodeType>> = ({ data, selected }) => {
  const { table, isMatched = true } = data;

  return (
    <div
      className={`flex flex-col bg-surface border rounded-xl shadow-lg w-[330px] overflow-hidden transition-all duration-200 ${
        selected
          ? 'border-primary ring-2 ring-primary/40 shadow-xl'
          : isMatched
          ? 'border-separator hover:border-primary/50'
          : 'border-separator/30 opacity-40'
      }`}
    >
      {/* Table Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-default-100/80 border-b border-separator/80 rounded-t-xl">
        <div className="flex items-center gap-2 overflow-hidden min-w-0">
          <TableIcon size={16} className="text-primary shrink-0" />
          <span className="font-bold text-sm tracking-tight truncate text-foreground" title={table.name}>
            {table.name}
          </span>
        </div>
        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-default-200/80 text-foreground/70 shrink-0 ml-2">
          {table.columns.length}
        </span>
      </div>

      {/* Columns List - Strictly overflow-x-hidden to prevent horizontal scrolling */}
      <div className="flex flex-col py-1 max-h-[380px] overflow-y-auto overflow-x-hidden divide-y divide-separator/20">
        {table.columns.map((col) => {
          const sourceHandleId = `${table.name}-${col.name}-source`;
          const targetHandleId = `${table.name}-${col.name}-target`;

          return (
            <div
              key={col.name}
              className="relative flex items-center justify-between px-3 py-1.5 hover:bg-default-100/50 transition-colors text-xs min-h-[32px] w-full min-w-0"
            >
              {/* Target Handle (Left) - anchor for incoming relations */}
              {col.isPrimaryKey && (
                <Handle
                  type="target"
                  position={Position.Left}
                  id={targetHandleId}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'none',
                    opacity: 0,
                    width: 0,
                    height: 0,
                    pointerEvents: 'none',
                    border: 'none',
                  }}
                  isConnectable={false}
                />
              )}

              {/* Column Name & Badge */}
              <div className="flex items-center gap-2 overflow-hidden mr-2 min-w-0 flex-1">
                {col.isPrimaryKey ? (
                  <span
                    className="flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 shrink-0"
                    title="Primary Key"
                  >
                    <KeyRound size={9} />
                    PK
                  </span>
                ) : col.isForeignKey ? (
                  <span
                    className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-500 dark:text-blue-400 border border-blue-500/30 shrink-0"
                    title="Foreign Key"
                  >
                    <Link2 size={9} />
                    FK
                  </span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/20 shrink-0 mx-1" />
                )}
                <span
                  className={`truncate ${
                    col.isPrimaryKey ? 'text-foreground font-semibold' : 'text-foreground/90 font-medium'
                  }`}
                  title={col.name}
                >
                  {col.name}
                </span>
              </div>

              {/* Column Type & Nullable badge */}
              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                <span
                  className="font-mono text-[11px] text-foreground/50 truncate max-w-[130px]"
                  title={col.type}
                >
                  {col.type}
                </span>
                {col.isNullable && (
                  <span
                    className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-default-200/50 text-foreground/40"
                    title="Nullable"
                  >
                    null
                  </span>
                )}
              </div>

              {/* Source Handle (Right) - anchor for outgoing relations */}
              {col.isForeignKey && (
                <Handle
                  type="source"
                  position={Position.Right}
                  id={sourceHandleId}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'none',
                    opacity: 0,
                    width: 0,
                    height: 0,
                    pointerEvents: 'none',
                    border: 'none',
                  }}
                  isConnectable={false}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
