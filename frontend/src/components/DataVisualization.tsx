import { useState, useEffect } from 'react';
import { ReportItem } from '@/types/ReportItem';

interface DataVisualizationProps {
  data: ReportItem[];
}

interface ServiceCostSummary {
  service: string;
  totalCostBeforeCredit: number;
  totalCostAfterCredit: number;
  resourceCount: number;
  topResources: ReportItem[];
}

interface TopResource extends ReportItem {
  rank: number;
}

interface ProcessedData {
  serviceCostSummaries: ServiceCostSummary[];
  totalCostBeforeCredit: number;
  totalCostAfterCredit: number;
  totalSavings: number;
  topResourcesOverall: TopResource[];
  totalServices: number;
  totalResources: number;
}

export default function DataVisualization({ data }: DataVisualizationProps) {
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const totalCostBeforeCredit = data.reduce((sum, item) => sum + (item.CostBeforeCredit || 0), 0);
    const totalCostAfterCredit = data.reduce((sum, item) => sum + (item.CostAfterCredit || 0), 0);
    const totalSavings = totalCostBeforeCredit - totalCostAfterCredit;

    const serviceGroups = data.reduce((acc, item) => {
      const service = item.Service || 'Unknown Service';
      if (!acc[service]) {
        acc[service] = [];
      }
      acc[service].push(item);
      return acc;
    }, {} as Record<string, ReportItem[]>);

    const serviceCostSummaries: ServiceCostSummary[] = Object.entries(serviceGroups)
      .map(([service, items]) => {
        const totalCostBeforeCredit = items.reduce((sum, item) => sum + (item.CostBeforeCredit || 0), 0);
        const totalCostAfterCredit = items.reduce((sum, item) => sum + (item.CostAfterCredit || 0), 0);
        
        const topResources = items
          .sort((a, b) => (b.CostBeforeCredit || 0) - (a.CostBeforeCredit || 0))
          .slice(0, 5);
        
        const uniqueResources = new Set(items.map(item => item.ResourceId || 'Unassigned')).size;

        return {
          service,
          totalCostBeforeCredit,
          totalCostAfterCredit,
          resourceCount: uniqueResources,
          topResources
        };
      })
      .sort((a, b) => b.totalCostBeforeCredit - a.totalCostBeforeCredit);

    const topResourcesOverall: TopResource[] = data
      .sort((a, b) => (b.CostBeforeCredit || 0) - (a.CostBeforeCredit || 0))
      .slice(0, 10)
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));

    setProcessedData({
      serviceCostSummaries,
      totalCostBeforeCredit,
      totalCostAfterCredit,
      totalSavings,
      topResourcesOverall,
      totalServices: serviceCostSummaries.length,
      totalResources: new Set(data.map(item => item.ResourceId || 'Unassigned')).size
    });
  }, [data]);

  if (!processedData) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-slate-400">
        <div className="w-8 h-8 border-3 border-blue-400/20 border-t-blue-400 rounded-full animate-spin mb-4"></div>
        <p>Processing data...</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="p-8 text-slate-200 h-full overflow-y-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold m-0 mb-2 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          AWS Cost Analysis & Summary
        </h2>
        <p className="text-slate-400 text-base m-0">
          Total costs per service and top expensive resources
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-500/10 to-emerald-500/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8 text-center shadow-2xl">
        <h3 className="text-2xl font-bold mb-6 text-slate-100">📊 Overall Total Spending Summary</h3>
        <div className="grid grid-cols-4 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1">
          <div className="bg-white/10 rounded-xl p-6">
            <h4 className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">Cost Before Credits</h4>
            <span className="text-2xl font-bold text-red-400 block">{formatCurrency(processedData.totalCostBeforeCredit)}</span>
          </div>
          <div className="bg-white/10 rounded-xl p-6">
            <h4 className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">Cost After Credits</h4>
            <span className="text-2xl font-bold text-green-400 block">{formatCurrency(processedData.totalCostAfterCredit)}</span>
          </div>
          <div className="bg-white/10 rounded-xl p-6">
            <h4 className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">Total Savings</h4>
            <span className="text-2xl font-bold text-emerald-400 block">{formatCurrency(processedData.totalSavings)}</span>
          </div>
          <div className="bg-white/10 rounded-xl p-6">
            <h4 className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">Services</h4>
            <span className="text-2xl font-bold text-blue-400 block">{processedData.totalServices}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8 max-lg:grid-cols-1">
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-xl font-semibold m-0 mb-4 text-slate-100 text-center">
            💰 Total Costs per Service
          </h3>
          <div className="flex flex-col gap-3">
            {processedData.serviceCostSummaries.map((summary, index) => (
              <div key={summary.service} className="bg-white/3 rounded-xl p-4 border border-white/10 transition-all duration-200 hover:bg-white/8 hover:border-blue-400/30">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-blue-400 text-sm min-w-6">#{index + 1}</span>
                    <span className="font-semibold text-slate-200">{summary.service}</span>
                  </div>
                  <span className="font-bold text-emerald-400 font-mono">
                    {formatCurrency(summary.totalCostAfterCredit)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Before Credits: {formatCurrency(summary.totalCostBeforeCredit)}</span>
                  <span>{summary.resourceCount} resources</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-xl font-semibold m-0 mb-4 text-slate-100 text-center">
            🏆 Top 10 Most Expensive Resources
          </h3>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-4 p-3 bg-white/8 rounded-lg font-semibold text-slate-100 text-sm uppercase tracking-wide">
              <span>Resource</span>
              <span>Service</span>
              <span>Cost</span>
            </div>
            {processedData.topResourcesOverall.map((resource) => (
              <div key={`${resource.ResourceId}-${resource.rank}`} className="grid grid-cols-3 gap-4 p-3 bg-white/3 rounded-lg items-center transition-all duration-200 border border-transparent hover:bg-white/8 hover:border-white/10">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-blue-400 text-sm min-w-6">#{resource.rank}</span>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-200 font-medium text-sm truncate" title={resource.ResourceId || 'Unassigned'}>
                      {(resource.ResourceId || 'Unassigned').length > 20 
                        ? `${(resource.ResourceId || 'Unassigned').substring(0, 20)}...` 
                        : (resource.ResourceId || 'Unassigned')}
                    </span>
                    <span className="text-slate-400 text-xs">{resource.UsageType}</span>
                  </div>
                </div>
                <span className="text-yellow-400 font-medium text-sm">{resource.Service}</span>
                <span className="text-emerald-400 font-semibold font-mono text-sm">{formatCurrency(resource.CostAfterCredit || 0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-xl font-semibold m-0 mb-6 text-slate-100 text-center">
          🎯 Top 5 Most Expensive Resources from Each Service
        </h3>
        <div className="grid grid-cols-1 gap-6">
          {processedData.serviceCostSummaries.slice(0, 5).map((summary) => (
            <div key={summary.service} className="bg-white/3 rounded-xl p-4 border border-white/10">
              <h4 className="text-lg font-semibold text-blue-400 mb-3">{summary.service}</h4>
              <div className="grid grid-cols-1 gap-2">
                {summary.topResources.map((resource, index) => (
                  <div key={`${resource.ResourceId}-${index}`} className="flex justify-between items-center py-2 px-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 font-semibold text-sm">#{index + 1}</span>
                      <div className="flex flex-col">
                        <span className="text-slate-200 font-medium text-sm" title={resource.ResourceId || 'Unassigned'}>
                          {(resource.ResourceId || 'Unassigned').length > 40 
                            ? `${(resource.ResourceId || 'Unassigned').substring(0, 40)}...` 
                            : (resource.ResourceId || 'Unassigned')}
                        </span>
                        <span className="text-slate-400 text-xs">{resource.UsageType}</span>
                      </div>
                    </div>
                    <span className="text-emerald-400 font-semibold font-mono">{formatCurrency(resource.CostAfterCredit || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
