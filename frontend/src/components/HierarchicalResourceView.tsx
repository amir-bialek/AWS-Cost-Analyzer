import React, { useState, useMemo } from 'react';
import { HierarchicalData } from '@/types/ReportItem';
import ResourceRow from './ResourceRow';

interface HierarchicalResourceViewProps {
  data: HierarchicalData;
  serviceFilter?: string;
}

const HierarchicalResourceView: React.FC<HierarchicalResourceViewProps> = ({ data, serviceFilter }) => {
  const [costSortFilter, setCostSortFilter] = useState<'desc' | 'asc'>('desc');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount);
  };

  const availableServices = useMemo(() => {
    if (!data || !data.resources) return [];
    const services = new Set(data.resources.map(resource => resource.service));
    return Array.from(services).sort();
  }, [data]);

  const filteredAndSortedResources = useMemo(() => {
    if (!data || !data.resources) return [];
    
    let filtered = [...data.resources];
    
    if (!serviceFilter && serviceTypeFilter !== 'all') {
      filtered = filtered.filter(resource => resource.service === serviceTypeFilter);
    }
    
    filtered.sort((a, b) => {
      const costA = a.totalCostBeforeCredit;
      const costB = b.totalCostBeforeCredit;
      return costSortFilter === 'desc' ? costB - costA : costA - costB;
    });
    
    return filtered;
  }, [data, serviceTypeFilter, costSortFilter, serviceFilter]);

  const filteredSummary = useMemo(() => {
    if (!filteredAndSortedResources.length) {
      return {
        totalResources: 0,
        totalCostBeforeCredit: 0,
        totalCostAfterCredit: 0,
        totalCostAfterTax: 0
      };
    }
    
    return {
      totalResources: filteredAndSortedResources.length,
      totalCostBeforeCredit: filteredAndSortedResources.reduce((sum, resource) => sum + resource.totalCostBeforeCredit, 0),
      totalCostAfterCredit: filteredAndSortedResources.reduce((sum, resource) => sum + resource.totalCostAfterCredit, 0),
      totalCostAfterTax: filteredAndSortedResources.reduce((sum, resource) => sum + (resource.totalCostAfterTax || 0), 0)
    };
  }, [filteredAndSortedResources]);

  if (!data || !data.resources || data.resources.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[200px] bg-white/[0.03] rounded-2xl border border-white/10 m-8">
        <p className="text-slate-400 text-lg font-medium text-center">No hierarchical data to display.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-8">

      {!serviceFilter && (
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-white/5 rounded-lg p-4 border border-white/10 flex-shrink-0">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="serviceFilter" className="text-slate-300 font-medium text-sm">
                Filter by Service:
              </label>
              <select
                id="serviceFilter"
                value={serviceTypeFilter}
                onChange={(e) => setServiceTypeFilter(e.target.value)}
                className="bg-white/10 border border-white/20 text-slate-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:shadow-lg focus:shadow-blue-400/10"
              >
                <option value="all" className="bg-slate-800 text-slate-200">All Services</option>
                {availableServices.map((service) => (
                  <option key={service} value={service} className="bg-slate-800 text-slate-200">
                    {service}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label htmlFor="sortFilter" className="text-slate-300 font-medium text-sm">
                Sort by Cost:
              </label>
              <select
                id="sortFilter"
                value={costSortFilter}
                onChange={(e) => setCostSortFilter(e.target.value as 'desc' | 'asc')}
                className="bg-white/10 border border-white/20 text-slate-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:shadow-lg focus:shadow-blue-400/10"
              >
                <option value="desc" className="bg-slate-800 text-slate-200">Highest to Lowest</option>
                <option value="asc" className="bg-slate-800 text-slate-200">Lowest to Highest</option>
              </select>
            </div>
          </div>
          
          <div className="text-slate-400 text-sm">
            Showing {filteredSummary.totalResources} of {data.summary.totalResources} resources
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="text-slate-400 text-sm font-medium">
            {serviceFilter ? `${serviceFilter} Resources` : 
             serviceTypeFilter !== 'all' ? `${serviceTypeFilter} Resources` : 'Total Resources'}
          </div>
          <div className="text-2xl font-bold text-blue-400">{filteredSummary.totalResources}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="text-slate-400 text-sm font-medium">
            {serviceFilter ? `${serviceFilter} Cost Before Credit` : 
             serviceTypeFilter !== 'all' ? `${serviceTypeFilter} Cost Before Credit` : 'Total Cost Before Credit'}
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {formatCurrency(filteredSummary.totalCostBeforeCredit)}
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="text-slate-400 text-sm font-medium">
            {serviceFilter ? `${serviceFilter} Cost After Credit` : 
             serviceTypeFilter !== 'all' ? `${serviceTypeFilter} Cost After Credit` : 'Total Cost After Credit'}
          </div>
          <div className="text-2xl font-bold text-emerald-300">
            {formatCurrency(filteredSummary.totalCostAfterCredit)}
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="text-slate-400 text-sm font-medium">
            {serviceFilter ? `${serviceFilter} Cost After Tax` : 
             serviceTypeFilter !== 'all' ? `${serviceTypeFilter} Cost After Tax` : 'Total Cost After Tax'}
          </div>
          <div className="text-2xl font-bold text-purple-400">
            {formatCurrency(filteredSummary.totalCostAfterTax)}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="h-full overflow-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-white/10 backdrop-blur-md border-b border-white/20 z-10">
              <tr>
                <th className="text-left p-2 font-semibold text-slate-200 text-sm tracking-wide border-r border-white/10 bg-gradient-to-b from-white/5 to-transparent">
                  {serviceFilter ? `${serviceFilter} Resource ID` : 'Resource ID'}
                </th>
                <th className="text-left p-2 font-semibold text-slate-200 text-sm tracking-wide border-r border-white/10 bg-gradient-to-b from-white/5 to-transparent">
                  Cost Before Credit
                </th>
                <th className="text-left p-2 font-semibold text-slate-200 text-sm tracking-wide border-r border-white/10 bg-gradient-to-b from-white/5 to-transparent">
                  Cost After Credit
                </th>
                <th className="text-left p-2 font-semibold text-slate-200 text-sm tracking-wide border-r border-white/10 bg-gradient-to-b from-white/5 to-transparent">
                  Cost After Tax
                </th>
                <th className="text-left p-2 font-semibold text-slate-200 text-sm tracking-wide border-r border-white/10 bg-gradient-to-b from-white/5 to-transparent">
                  Service Code
                </th>
                <th className="text-left p-2 font-semibold text-slate-200 text-sm tracking-wide border-r border-white/10 bg-gradient-to-b from-white/5 to-transparent">
                  Usage Type
                </th>
                <th className="text-left p-2 font-semibold text-slate-200 text-sm tracking-wide border-r border-white/10 bg-gradient-to-b from-white/5 to-transparent">
                  Unit
                </th>
                <th className="text-left p-2 font-semibold text-slate-200 text-sm tracking-wide border-r border-white/10 last:border-r-0 bg-gradient-to-b from-white/5 to-transparent">
                  Usage Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedResources.map((resource, index) => (
                <ResourceRow 
                  key={`${resource.resourceId}-${index}`} 
                  resource={resource} 
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HierarchicalResourceView;
