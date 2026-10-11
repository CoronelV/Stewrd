import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  MarkerType,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button, Chip, Spinner } from '@heroui/react';
import {
  Database,
  X,
  Search,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { getSchema } from '../../api/connectionsApi';
import type { DatabaseSchemaResponse, TableSchema, TableRelation } from './types';
import { TableNode, type TableNodeData } from './TableNode';
import { EnvironmentBadge } from '../common/EnvironmentBadge';
import type { Environment, ConnectionTarget } from '../../store/useAppStore';

const CARD_WIDTH = 330;
const CARD_GAP_X = 140;
const CARD_GAP_Y = 60;
const HEADER_HEIGHT = 44;
const ROW_HEIGHT = 32;

const nodeTypes = {
  tableNode: TableNode,
};

interface SchemaDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: ConnectionTarget;
  dbName: string;
  environment: Environment;
  channelType?: string | undefined;
}

export const SchemaDiagramModal: React.FC<SchemaDiagramModalProps> = ({
  isOpen,
  onClose,
  target,
  dbName,
  environment,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [schemaData, setSchemaData] = useState<DatabaseSchemaResponse | null>(null);
  const [selectedSchema, setSelectedSchema] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<TableNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Fetch schema from backend
  const fetchSchema = useCallback(async (overrideSchema?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSchema(target, overrideSchema);
      setSchemaData(data);
      if (data.schema) {
        setSelectedSchema(data.schema);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [target]);

  useEffect(() => {
    if (isOpen) {
      fetchSchema();
    } else {
      setSchemaData(null);
      setError(null);
      setSearchQuery('');
      setSelectedSchema('');
    }
  }, [isOpen, fetchSchema]);

  // Convert schema data into React Flow nodes and edges
  useEffect(() => {
    if (!schemaData || schemaData.tables.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const cols = Math.max(1, Math.ceil(Math.sqrt(schemaData.tables.length * 1.4)));
    const colHeights: number[] = new Array(cols).fill(60);

    const initialNodes: Node<TableNodeData>[] = schemaData.tables.map((table: TableSchema, index: number) => {
      const col = index % cols;
      const currentH = colHeights[col] ?? 60;
      const x = col * (CARD_WIDTH + CARD_GAP_X) + 80;
      const y = currentH;

      const cardH = HEADER_HEIGHT + table.columns.length * ROW_HEIGHT + 24;
      colHeights[col] = currentH + cardH + CARD_GAP_Y;

      return {
        id: table.name,
        type: 'tableNode',
        position: { x, y },
        data: {
          table,
          isMatched: true,
        },
      };
    });

    const initialEdges: Edge[] = (schemaData.relations || []).map((rel: TableRelation) => ({
      id: `e-${rel.constraintName}-${rel.sourceTable}-${rel.targetTable}`,
      source: rel.sourceTable,
      target: rel.targetTable,
      sourceHandle: `${rel.sourceTable}-${rel.sourceColumn}-source`,
      targetHandle: `${rel.targetTable}-${rel.targetColumn}-target`,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#006FEE', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#006FEE',
        width: 14,
        height: 14,
      },
    }));

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [schemaData, setNodes, setEdges]);

  // Update nodes highlighting when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, isMatched: true },
        }))
      );
      return;
    }

    const query = searchQuery.toLowerCase();
    setNodes((nds) =>
      nds.map((n) => {
        const matches =
          n.data.table.name.toLowerCase().includes(query) ||
          n.data.table.columns.some((c) => c.name.toLowerCase().includes(query));
        return {
          ...n,
          data: { ...n.data, isMatched: matches },
        };
      })
    );
  }, [searchQuery, setNodes]);

  // Keyboard escape handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentDbName = schemaData?.databaseName || dbName;
  const currentSchema = schemaData?.schema || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 md:p-6 animate-appearance-in select-none">
      <div className="relative flex flex-col w-full h-full max-w-[98vw] max-h-[96vh] bg-surface border border-separator rounded-2xl shadow-2xl overflow-hidden">

        {/* TOP BAR: Esquina superior izquierda con nombre de la base de datos, ambiente y schema */}
        <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-separator bg-surface/90 backdrop-blur-md z-20">

          {/* Esquina superior izquierda */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Database size={22} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-tight text-foreground">{currentDbName}</span>
                  <EnvironmentBadge environment={environment} size="sm" />
                  <Chip size="sm" variant="soft" className="font-semibold text-xs capitalize">
                    {target === 'source' ? 'Source DB' : 'Target DB'}
                  </Chip>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground/60">
                  <span className="flex items-center gap-1.5">
                    Schema:
                    {schemaData?.availableSchemas && schemaData.availableSchemas.length > 1 ? (
                      <select
                        aria-label="Select database schema"
                        value={selectedSchema || currentSchema}
                        onChange={(e) => {
                          const newSchema = e.target.value;
                          setSelectedSchema(newSchema);
                          void fetchSchema(newSchema);
                        }}
                        style={{ colorScheme: 'dark' }}
                        className="bg-default-100 hover:bg-default-200 border border-separator/60 rounded px-1.5 py-0.5 text-xs font-mono font-semibold text-foreground/90 focus:outline-hidden focus:border-primary cursor-pointer transition-colors [color-scheme:dark]"
                      >
                        {schemaData.availableSchemas.map((s) => (
                          <option key={s} value={s} className="bg-surface text-foreground font-mono">
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <strong className="text-foreground/90 font-mono">{currentSchema}</strong>
                    )}
                  </span>
                  {schemaData && (
                    <>
                      <span>•</span>
                      <span>{schemaData.tables.length} tables</span>
                      <span>•</span>
                      <span>{schemaData.relations.length} relations</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Controls: Search & Close */}
          <div className="flex items-center gap-2.5">
            {schemaData && schemaData.tables.length > 0 && (
              <div className="relative w-48 sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search table or column..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg bg-default-100 border border-separator/50 text-foreground placeholder:text-foreground/40 focus:outline-hidden focus:border-primary"
                />
              </div>
            )}

            {/* Close button */}
            <Button
              isIconOnly
              variant="ghost"
              onPress={onClose}
              aria-label="Close schema view"
              className="rounded-full hover:bg-danger/20 hover:text-danger transition-colors"
            >
              <X size={20} />
            </Button>
          </div>
        </header>

        {/* WORKSPACE CANVAS WITH REACT FLOW */}
        <div className="relative flex-1 w-full h-full overflow-hidden bg-background">

          {/* Loading state */}
          {loading && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-surface/60 backdrop-blur-xs">
              <Spinner size="lg" />
              <p className="text-sm font-semibold text-foreground/80">Fetching database schema & relations...</p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 p-6 bg-surface/80 backdrop-blur-xs text-center max-w-lg mx-auto">
              <div className="p-3 bg-danger/10 text-danger rounded-full border border-danger/20">
                <AlertCircle size={36} />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-foreground">Could not load schema</h3>
                <p className="text-sm text-foreground/70">{error}</p>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <Button variant="secondary" size="sm" onPress={() => void fetchSchema()} className="flex items-center gap-1.5">
                  <RefreshCw size={14} />
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* React Flow Diagram */}
          {!loading && !error && (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.2}
              maxZoom={2.0}
              nodesDraggable={true}
              nodesConnectable={false}
              elementsSelectable={true}
              proOptions={{ hideAttribution: true }}
              className="bg-background"
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={24}
                size={1.5}
                color="var(--color-separator, #444)"
              />
              <Controls
                showInteractive={false}
                className="bg-surface border border-separator shadow-lg rounded-xl overflow-hidden text-foreground"
              />
              <MiniMap
                nodeColor="#006FEE"
                maskColor="rgba(0, 0, 0, 0.4)"
                className="bg-surface/90 border border-separator rounded-xl overflow-hidden shadow-lg !bottom-4 !right-4"
              />
            </ReactFlow>
          )}
        </div>
      </div>
    </div>
  );
};
