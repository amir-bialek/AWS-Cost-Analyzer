import React, { useState } from 'react';
import { CostCategory } from '@/types/ReportItem';

interface CategoryRowProps {
  category: CostCategory;
  isExpanded: boolean;
  onToggle: () => void;
}

const CategoryRow: React.FC<CategoryRowProps> = ({ category, isExpanded, onToggle }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount);
  };

  const hasZeroCost = category.cost_before_credit === 0;

  const copyResourceId = async (resourceId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (resourceId === 'nan' || !resourceId) {
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
        className={`border-b border-white/5 transition-colors duration-150 cursor-pointer ${
          hasZeroCost ? 'opacity-60' : 'hover:bg-white/5'
        }`}
        onClick={onToggle}
      >
        <td className="p-2 text-slate-300 text-sm border-r border-white/5 pl-8">
          <div className="flex items-center gap-2">
            <button 
              className="text-blue-400 hover:text-blue-300 transition-colors text-xs font-mono w-4 h-4 flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
            >
              {isExpanded ? '−' : '+'}
            </button>
            <span className={`font-medium ${hasZeroCost ? 'text-slate-500' : 'text-orange-400'}`}>
              {category.name}
            </span>
          </div>
        </td>
        <td className={`p-2 text-sm border-r border-white/5 font-mono ${
          hasZeroCost ? 'text-slate-500' : 'text-emerald-400'
        }`}>
          {formatCurrency(category.cost_before_credit)}
        </td>
        <td className={`p-2 text-sm border-r border-white/5 font-mono ${
          hasZeroCost ? 'text-slate-500' : 'text-emerald-400'
        }`}>
          {formatCurrency(category.cost_after_credit)}
        </td>
        <td className="p-2 text-slate-400 text-sm border-r border-white/5">—</td>
        <td className="p-2 text-slate-400 text-sm border-r border-white/5">—</td>
        <td className="p-2 text-slate-400 text-sm border-r border-white/5">—</td>
        <td className="p-2 text-slate-400 text-sm border-r border-white/5">—</td>
      </tr>

      {isExpanded && category.line_items.map((item, index) => (
        <tr 
          key={`${category.name}-${index}`} 
          className="border-b border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors duration-150"
        >
          <td className="p-2 text-slate-300 text-sm border-r border-white/5 font-mono pl-12">
            <div className="flex items-center gap-2">
              <span className="truncate max-w-xs">
                {item.ResourceId === 'nan' || !item.ResourceId ? 'N/A' : item.ResourceId}
              </span>
              {item.ResourceId !== 'nan' && item.ResourceId && (
                <button
                  onClick={(e) => copyResourceId(item.ResourceId, e)}
                  className="text-slate-400 hover:text-blue-400 transition-colors p-1 rounded hover:bg-white/10 flex-shrink-0"
                  title="Copy Resource ID"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              )}
            </div>
          </td>
          <td className="p-2 text-emerald-400 text-sm border-r border-white/5 font-mono">
            {formatCurrency(item.CostBeforeCredit)}
          </td>
          <td className="p-2 text-emerald-400 text-sm border-r border-white/5 font-mono">
            {formatCurrency(item.CostAfterCredit)}
          </td>
          <td className="p-2 text-slate-300 text-sm border-r border-white/5 font-mono">
            {item.ServiceCode}
          </td>
          <td className="p-2 text-slate-300 text-sm border-r border-white/5 font-mono">
            {item.UsageType}
          </td>
          <td className="p-2 text-slate-300 text-sm border-r border-white/5 font-mono">
            {item.Unit}
          </td>
          <td className="p-2 text-slate-300 text-sm border-r border-white/5 font-mono">
            {item.UsageAmount.toLocaleString()}
          </td>
        </tr>
      ))}
    </>
  );
};

export default CategoryRow;
