import React from 'react';
import { Button } from '@heroui/react';
import { GitCompare, ArrowDownToDot, ArrowUpFromDot } from 'lucide-react';
import type { ComparisonFilter, ComparisonStats } from '../../api/requests.interface';

interface ComparisonFilterTabsProps {
  currentFilter: ComparisonFilter;
  onFilterChange: (filter: ComparisonFilter) => void;
  stats?: ComparisonStats | undefined;
  isLoading: boolean;
}

export const ComparisonFilterTabs: React.FC<ComparisonFilterTabsProps> = ({
  currentFilter,
  onFilterChange,
  stats,
  isLoading,
}) => {
  const diffCount = stats
    ? stats.sourceOnlyCount + stats.targetOnlyCount + stats.differentCount
    : undefined;
  const targetOnlyCount = stats?.targetOnlyCount;
  const sourceOnlyCount = stats?.sourceOnlyCount;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* 1. View Differences */}
      <Button
        variant={currentFilter === 'differences' ? 'primary' : 'ghost'}
        onPress={() => onFilterChange('differences')}
        isDisabled={isLoading}
        className={`flex items-center gap-2 h-9 px-4 text-xs font-semibold rounded-xl transition-all duration-150 ${
          currentFilter === 'differences'
            ? 'shadow-xs ring-1 ring-primary/40'
            : 'border border-default-200 text-foreground/80 hover:bg-default-100'
        }`}
      >
        <GitCompare size={15} />
        <span>View Differences</span>
        {diffCount !== undefined && (
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
              currentFilter === 'differences'
                ? 'bg-white/20 text-white'
                : 'bg-default-200 text-foreground/70'
            }`}
          >
            {diffCount.toLocaleString()}
          </span>
        )}
      </Button>

      {/* 2. View Only Target */}
      <Button
        variant="ghost"
        onPress={() => onFilterChange('only_target')}
        isDisabled={isLoading}
        className={`flex items-center gap-2 h-9 px-4 text-xs font-semibold rounded-xl transition-all duration-150 ${
          currentFilter === 'only_target'
            ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/50'
            : 'border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10'
        }`}
      >
        <ArrowDownToDot size={15} />
        <span>View Only Target</span>
        {targetOnlyCount !== undefined && (
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
              currentFilter === 'only_target'
                ? 'bg-white/20 text-white'
                : 'bg-emerald-500/20 text-emerald-500'
            }`}
          >
            {targetOnlyCount.toLocaleString()}
          </span>
        )}
      </Button>

      {/* 3. View Only Source */}
      <Button
        variant="ghost"
        onPress={() => onFilterChange('only_source')}
        isDisabled={isLoading}
        className={`flex items-center gap-2 h-9 px-4 text-xs font-semibold rounded-xl transition-all duration-150 ${
          currentFilter === 'only_source'
            ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/50'
            : 'border border-blue-500/30 text-blue-500 hover:bg-blue-500/10'
        }`}
      >
        <ArrowUpFromDot size={15} />
        <span>View Only Source</span>
        {sourceOnlyCount !== undefined && (
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
              currentFilter === 'only_source'
                ? 'bg-white/20 text-white'
                : 'bg-blue-500/20 text-blue-500'
            }`}
          >
            {sourceOnlyCount.toLocaleString()}
          </span>
        )}
      </Button>
    </div>
  );
};
