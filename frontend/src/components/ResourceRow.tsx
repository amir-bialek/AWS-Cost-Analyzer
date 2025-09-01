import React, { useState } from 'react';
import { ResourceSummary } from '@/types/ReportItem';
import CategoryRow from './CategoryRow';

interface ResourceRowProps {
  resource: ResourceSummary;
}

const ResourceRow: React.FC<ResourceRowProps> = ({ resource }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount);
  };

  const getResourceDisplayName = (resourceId: string, service: string) => {
    if (resourceId === 'Unassigned' || !resourceId || resourceId === 'nan') {
      return `${service} (Unassigned)`;
    }
    return `${service} - ${resourceId}`;
  };

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const hasZeroCost = resource.totalCostBeforeCredit === 0;

  const copyResourceId = async (resourceId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (resourceId === 'Unassigned' || resourceId === 'nan' || !resourceId) {
      return;
    }
    
    try {
      await navigator.clipboard.writeText(resourceId);
    } catch (err) {
      console.error('Failed to copy resource ID:', err);
      const textArea = document.createElement('textarea');
      textArea.value = resourceId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  return (
    <>
      <tr 
        className={`border-b border-white/10 transition-colors duration-150 cursor-pointer ${
          hasZeroCost ? 'opacity-60' : 'hover:bg-white/5'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <td className="p-2 text-slate-300 text-sm border-r border-white/5 font-mono">
          <div className="flex items-center gap-2">
            <button 
              className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-mono w-5 h-5 flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? '−' : '+'}
            </button>
            <span className="truncate max-w-xs">
              {resource.resourceId === 'Unassigned' || resource.resourceId === 'nan' ? 'N/A' : resource.resourceId}
            </span>
            {resource.resourceId !== 'Unassigned' && resource.resourceId !== 'nan' && resource.resourceId && (
              <button
                onClick={(e) => copyResourceId(resource.resourceId, e)}
                className="text-slate-400 hover:text-blue-400 transition-colors p-1 rounded hover:bg-white/10 flex-shrink-0"
                title="Copy Resource ID"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            )}
          </div>
        </td>
        <td className={`p-4 text-sm border-r border-white/5 font-mono font-semibold ${
          hasZeroCost ? 'text-slate-500' : 'text-emerald-300'
        }`}>
          {formatCurrency(resource.totalCostBeforeCredit)}
        </td>
        <td className={`p-4 text-sm border-r border-white/5 font-mono font-semibold ${
          hasZeroCost ? 'text-slate-500' : 'text-emerald-300'
        }`}>
          {formatCurrency(resource.totalCostAfterCredit)}
        </td>
        <td className="p-2 text-slate-400 text-sm border-r border-white/5 font-mono">
          {resource.serviceCode}
        </td>
        <td className="p-2 text-slate-400 text-sm border-r border-white/5">—</td>
        <td className="p-2 text-slate-400 text-sm border-r border-white/5">—</td>
        <td className="p-2 text-slate-400 text-sm border-r border-white/5">—</td>
      </tr>

      {isExpanded && resource.categories.map((category, index) => (
        <CategoryRow
          key={`${resource.resourceId}-${category.name}-${index}`}
          category={category}
          isExpanded={expandedCategories.has(category.name)}
          onToggle={() => toggleCategory(category.name)}
        />
      ))}
    </>
  );
};

export default ResourceRow;
