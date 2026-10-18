import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from '@heroui/react';
import { GitCompare, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getActiveConnection } from '../../api/connectionsApi';
import {
  validateComparisonSchemas,
  getComparisonTables,
  getComparisonData,
} from '../../api/comparisonApi';
import type {
  SchemaValidationResponse,
  TableOverviewItem,
  ComparisonFilter,
  ComparisonRow,
  ComparisonStats,
} from '../../api/requests.interface';

import { CommonSchemaSelector } from './CommonSchemaSelector';
import { TablesOverviewCard } from './TablesOverviewCard';
import { UniquenessCriteriaSelector } from './UniquenessCriteriaSelector';
import { ComparisonFilterTabs } from './ComparisonFilterTabs';
import { DataComparisonTable } from './DataComparisonTable';

const CHUNK_LIMIT = 50;

export const DataComparisonView: React.FC = () => {
  const { sourceDb, targetDb, setSourceDb, setTargetDb } = useAppStore();

  const preferredSourceSchema = sourceDb?.dbName && sourceDb.dbName !== '-' ? sourceDb.dbName : '';
  const preferredTargetSchema = targetDb?.dbName && targetDb.dbName !== '-' ? targetDb.dbName : '';

  const sourceSchemas = useMemo(() => sourceDb?.availableSchemas || [], [sourceDb?.availableSchemas]);
  const targetSchemas = useMemo(() => targetDb?.availableSchemas || [], [targetDb?.availableSchemas]);
  const commonSchemas = useMemo(
    () => sourceSchemas.filter((s) => targetSchemas.includes(s)),
    [sourceSchemas, targetSchemas],
  );

  const [selectedSourceSchema, setSelectedSourceSchema] = useState<string>('');
  const [selectedTargetSchema, setSelectedTargetSchema] = useState<string>('');
  const userChangedSourceRef = useRef(false);
  const userChangedTargetRef = useRef(false);

  // Schema Validation State
  const [isValidatingSchemas, setIsValidatingSchemas] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<SchemaValidationResponse | null>(null);

  const [tables, setTables] = useState<TableOverviewItem[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState<boolean>(false);
  const [selectedTableName, setSelectedTableName] = useState<string>('');

  const [filter, setFilter] = useState<ComparisonFilter>('differences');
  const [uniqueKeys, setUniqueKeys] = useState<string[]>([]);

  // Comparison data & infinite scroll state
  const [rows, setRows] = useState<ComparisonRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [stats, setStats] = useState<ComparisonStats | undefined>(undefined);
  const [totalMatches, setTotalMatches] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const comparisonSectionRef = useRef<HTMLDivElement>(null);

  // 1. Ensure connections are loaded in store if page was refreshed directly on /data-comparison
  useEffect(() => {
    let mounted = true;
    const restore = async () => {
      try {
        const [sRes, tRes] = await Promise.allSettled([
          getActiveConnection('source'),
          getActiveConnection('target'),
        ]);
        if (!mounted) return;
        if (sRes.status === 'fulfilled' && sRes.value) {
          setSourceDb(sRes.value);
        }
        if (tRes.status === 'fulfilled' && tRes.value) {
          setTargetDb(tRes.value);
        }
      } catch (err) {
        console.error('Error fetching active connections in DataComparisonView:', err);
      }
    };

    if (sourceDb?.status !== 'active' || targetDb?.status !== 'active') {
      void restore();
    }
    return () => {
      mounted = false;
    };
  }, [sourceDb?.status, targetDb?.status, setSourceDb, setTargetDb]);

  // 2. Select default schemas directly from store (preferred schema -> common schema -> first schema)
  useEffect(() => {
    let chosenSource = '';
    if (sourceSchemas.length > 0) {
      const defaultSource =
        preferredSourceSchema && sourceSchemas.includes(preferredSourceSchema)
          ? preferredSourceSchema
          : commonSchemas.length > 0
          ? commonSchemas[0]!
          : sourceSchemas[0] || '';

      setSelectedSourceSchema((prev) => {
        chosenSource =
          userChangedSourceRef.current && prev && sourceSchemas.includes(prev)
            ? prev
            : defaultSource;
        return chosenSource;
      });
    } else {
      setSelectedSourceSchema('');
    }

    if (targetSchemas.length > 0) {
      const defaultTarget =
        preferredTargetSchema && targetSchemas.includes(preferredTargetSchema)
          ? preferredTargetSchema
          : chosenSource && targetSchemas.includes(chosenSource)
          ? chosenSource
          : commonSchemas.length > 0
          ? commonSchemas[0]!
          : targetSchemas[0] || '';

      setSelectedTargetSchema((prev) =>
        userChangedTargetRef.current && prev && targetSchemas.includes(prev)
          ? prev
          : defaultTarget,
      );
    } else {
      setSelectedTargetSchema('');
    }
  }, [sourceSchemas, targetSchemas, commonSchemas, preferredSourceSchema, preferredTargetSchema]);

  // 3. Automatically validate schemas and fetch tables when sourceSchema or targetSchema changes
  useEffect(() => {
    if (!selectedSourceSchema || !selectedTargetSchema) {
      setValidationResult(null);
      setTables([]);
      setSelectedTableName('');
      return;
    }

    let mounted = true;
    setIsValidatingSchemas(true);
    setValidationResult(null);
    setTables([]);

    const validateAndLoadTables = async () => {
      try {
        const valRes = await validateComparisonSchemas(selectedSourceSchema, selectedTargetSchema);
        if (!mounted) return;
        setValidationResult(valRes);
        setIsValidatingSchemas(false);

        if (!valRes.available) {
          setTables([]);
          setSelectedTableName('');
          return;
        }

        setIsLoadingTables(true);
        const tblRes = await getComparisonTables(selectedSourceSchema, selectedTargetSchema);
        if (!mounted) return;
        const tbls = tblRes.tables || [];
        setTables(tbls);
        if (tbls.length > 0) {
          setSelectedTableName((prev) => {
            const found = tbls.some((t) => t.tableName === prev);
            if (found) return prev;
            const firstShared = tbls.find((t) => t.existsInSource && t.existsInTarget);
            return firstShared?.tableName ?? tbls[0]?.tableName ?? '';
          });
        } else {
          setSelectedTableName('');
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Failed to validate schemas or load comparison tables:', err);
        setTables([]);
        setSelectedTableName('');
      } finally {
        if (mounted) {
          setIsValidatingSchemas(false);
          setIsLoadingTables(false);
        }
      }
    };

    void validateAndLoadTables();

    return () => {
      mounted = false;
    };
  }, [selectedSourceSchema, selectedTargetSchema]);

  // Find currently selected table item
  const selectedTableMeta = tables.find((t) => t.tableName === selectedTableName);

  // 4. Update unique keys when selected table changes
  useEffect(() => {
    if (!selectedTableMeta) {
      setUniqueKeys([]);
      return;
    }

    // Default to primary keys if available, otherwise first column
    if (selectedTableMeta.primaryKeys && selectedTableMeta.primaryKeys.length > 0) {
      setUniqueKeys(selectedTableMeta.primaryKeys);
    } else if (selectedTableMeta.columns && selectedTableMeta.columns.length > 0) {
      const first = selectedTableMeta.columns[0];
      setUniqueKeys(first ? [first] : []);
    } else {
      setUniqueKeys([]);
    }
  }, [selectedTableName, selectedTableMeta]);

  // 5. Fetch initial comparison data (Page 0)
  const fetchInitialData = useCallback(async () => {
    if (!selectedSourceSchema || !selectedTargetSchema || !selectedTableName || uniqueKeys.length === 0) {
      setRows([]);
      setColumns([]);
      setTotalMatches(0);
      setHasMore(false);
      return;
    }

    setIsLoadingData(true);
    try {
      const res = await getComparisonData({
        sourceSchema: selectedSourceSchema,
        targetSchema: selectedTargetSchema,
        table: selectedTableName,
        uniqueKeys,
        filter,
        limit: CHUNK_LIMIT,
        offset: 0,
      });

      setRows(res.rows || []);
      setColumns(res.columns || []);
      setStats(res.stats);
      setTotalMatches(res.totalMatches);
      setHasMore(res.hasMore);
    } catch (err) {
      console.error('Failed to compare data:', err);
      setRows([]);
      setTotalMatches(0);
      setHasMore(false);
    } finally {
      setIsLoadingData(false);
    }
  }, [selectedSourceSchema, selectedTargetSchema, selectedTableName, uniqueKeys, filter]);

  useEffect(() => {
    void fetchInitialData();
  }, [fetchInitialData]);

  // 6. Infinite scroll: Load more records
  const handleLoadMore = useCallback(async () => {
    if (
      !selectedSourceSchema ||
      !selectedTargetSchema ||
      !selectedTableName ||
      !hasMore ||
      isLoadingMore ||
      isLoadingData
    ) {
      return;
    }

    setIsLoadingMore(true);
    try {
      const nextOffset = rows.length;
      const res = await getComparisonData({
        sourceSchema: selectedSourceSchema,
        targetSchema: selectedTargetSchema,
        table: selectedTableName,
        uniqueKeys,
        filter,
        limit: CHUNK_LIMIT,
        offset: nextOffset,
      });

      const newRows = res.rows || [];
      setRows((prev) => [...prev, ...newRows]);
      setHasMore(res.hasMore);
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load more comparison records:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    selectedSourceSchema,
    selectedTargetSchema,
    selectedTableName,
    hasMore,
    isLoadingMore,
    isLoadingData,
    rows.length,
    uniqueKeys,
    filter,
  ]);

  // Toggle unique key
  const handleToggleUniqueKey = (col: string) => {
    setUniqueKeys((prev) => {
      if (prev.includes(col)) {
        return prev.filter((k) => k !== col);
      } else {
        return [...prev, col];
      }
    });
  };

  // Reset to primary keys
  const handleResetToPrimaryKeys = () => {
    if (selectedTableMeta && selectedTableMeta.primaryKeys.length > 0) {
      setUniqueKeys(selectedTableMeta.primaryKeys);
    }
  };

  // Select table handler
  const handleSelectTable = (tbl: string) => {
    setSelectedTableName(tbl);
    // Smooth scroll down to comparison section
    setTimeout(() => {
      comparisonSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const canCompareTables = Boolean(
    selectedSourceSchema &&
      selectedTargetSchema &&
      validationResult?.available,
  );

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <GitCompare size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Data Comparison</h2>
              <p className="text-sm text-foreground/70">
                Inspect and compare table records between Source and Target databases in real time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Source & Target Schema Selector + Validation */}
      <CommonSchemaSelector
        sourceSchemas={sourceSchemas}
        targetSchemas={targetSchemas}
        selectedSourceSchema={selectedSourceSchema}
        selectedTargetSchema={selectedTargetSchema}
        onSelectSourceSchema={(s) => {
          userChangedSourceRef.current = true;
          setSelectedSourceSchema(s);
        }}
        onSelectTargetSchema={(s) => {
          userChangedTargetRef.current = true;
          setSelectedTargetSchema(s);
        }}
        isValidating={isValidatingSchemas}
        validationResult={validationResult}
        sourceDb={sourceDb}
        targetDb={targetDb}
      />

      {canCompareTables && (
        <>
          {/* 2. Tables Overview Card (Compact / No muy alta) */}
          <TablesOverviewCard
            tables={tables}
            selectedTable={selectedTableName}
            onSelectTable={handleSelectTable}
            isLoading={isLoadingTables}
            sourceSchema={selectedSourceSchema}
            targetSchema={selectedTargetSchema}
          />

          {/* 3. Detailed Data Comparison Section */}
          {selectedTableName && selectedTableMeta && (
            <div ref={comparisonSectionRef} className="flex flex-col gap-4 animate-appearance-in">
              {/* Uniqueness Criteria Selector (before the table and before filter buttons) */}
              <UniquenessCriteriaSelector
                tableName={selectedTableName}
                allColumns={selectedTableMeta.columns}
                primaryKeys={selectedTableMeta.primaryKeys}
                selectedUniqueKeys={uniqueKeys}
                onToggleKey={handleToggleUniqueKey}
                onResetToPrimaryKeys={handleResetToPrimaryKeys}
              />

              {/* 3 Filter Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <ComparisonFilterTabs
                  currentFilter={filter}
                  onFilterChange={setFilter}
                  stats={stats}
                  isLoading={isLoadingData}
                />

                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => void fetchInitialData()}
                  className="text-xs text-foreground/70 self-start sm:self-auto"
                >
                  <RefreshCw size={14} className={isLoadingData ? 'animate-spin' : ''} />
                  Refresh Comparison
                </Button>
              </div>

              {/* Data Comparison Table with Side-by-Side colors, spinners, animations, and infinite scroll */}
              <DataComparisonTable
                rows={rows}
                columns={columns.length > 0 ? columns : selectedTableMeta.columns}
                uniqueKeys={uniqueKeys}
                filter={filter}
                isLoading={isLoadingData}
                isLoadingMore={isLoadingMore}
                hasMore={hasMore}
                totalMatches={totalMatches}
                tableName={selectedTableName}
                onLoadMore={() => void handleLoadMore()}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
