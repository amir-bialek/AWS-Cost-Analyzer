import { useState, useRef, useEffect } from 'react';
import { ReportItem, HierarchicalData, FileMetadata } from '@/types/ReportItem';
import DataVisualization from './DataVisualization';
import HierarchicalResourceView from './HierarchicalResourceView';
import InfoModal from './InfoModal';

interface ReportTableProps {
  flatData: ReportItem[];
  hierarchicalData: HierarchicalData;
  serviceHierarchies: Record<string, HierarchicalData>;
  availableFiles?: FileMetadata[];
  selectedFileId?: string | null;
  onFileSelection?: (fileId: string) => void;
  onBack?: () => void;
  isLoading?: boolean;
  loadingDots?: string;
}

export default function ReportTable({ flatData, hierarchicalData, serviceHierarchies, availableFiles, selectedFileId, onFileSelection, onBack, isLoading, loadingDots }: ReportTableProps) {
  const [activeTab, setActiveTab] = useState<string>('');
  const [viewMode, setViewMode] = useState<'flat' | 'hierarchical'>('hierarchical');
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);

  if (!flatData || flatData.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[200px] bg-white/[0.03] rounded-2xl border border-white/10 m-8">
        <p className="text-slate-400 text-lg font-medium text-center">No data to display or incorrect format.</p>
      </div>
    );
  }

  if (typeof flatData[0] !== 'object' || flatData[0] === null) {
    return (
      <div className="flex justify-center items-center min-h-[200px] bg-white/[0.03] rounded-2xl border border-white/10 m-8">
        <p className="text-slate-400 text-lg font-medium text-center">Unexpected data format.</p>
      </div>
    );
  }

  const availableServices = Object.keys(serviceHierarchies || {}).filter(service => 
    serviceHierarchies[service] && serviceHierarchies[service].resources.length > 0
  ).sort(); // Sort alphabetically for consistent ordering

  const visualizationTabKey = 'VISUALIZATIONS';
  const hierarchicalTabKey = 'HIERARCHICAL';

  useEffect(() => {
    if (!activeTab) {
      setActiveTab(visualizationTabKey);
    }
  }, [activeTab, visualizationTabKey]);

  const getCurrentHierarchicalData = () => {
    if (activeTab === hierarchicalTabKey) {
      return hierarchicalData;
    } else if (serviceHierarchies[activeTab]) {
      return serviceHierarchies[activeTab];
    }
    return null;
  };


  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-slate-200 flex flex-col font-sans overflow-hidden">
      <div className="flex justify-between items-center px-8 py-6 bg-white/5 backdrop-blur-lg border-b border-white/10 shadow-lg md:flex-row flex-col gap-4 md:gap-0">
        <div className="flex items-center gap-4 md:justify-start justify-center">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 bg-white/10 text-slate-200 border border-white/20 px-4 py-2 rounded-lg font-medium text-sm cursor-pointer transition-all duration-200 hover:bg-white/15 hover:border-white/30 hover:-translate-x-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}
          <h1 className="text-2xl md:text-3xl font-bold m-0 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent tracking-tight md:text-left text-center">
            {"{{COMPANY_NAME}}"} AWS Consumption Report
          </h1>
        </div>
        <div className="flex items-center gap-4 md:justify-end justify-center flex-wrap">
          {availableFiles && availableFiles.length > 0 && (
            <div className="flex items-center gap-2">
              {isLoading && (
                <div className="flex items-center gap-2 text-blue-400 font-medium text-sm">
                  <div className="w-4 h-4 border-2 border-blue-400/20 border-t-blue-400 rounded-full animate-spin"></div>
                  Loading{loadingDots}
                </div>
              )}
              <label htmlFor="fileSelect" className="text-slate-300 font-medium text-sm whitespace-nowrap">
                Current File:
              </label>
              <select
                id="fileSelect"
                value={selectedFileId || ''}
                onChange={(e) => onFileSelection && onFileSelection(e.target.value)}
                disabled={isLoading}
                className={`bg-white/10 border border-white/20 text-slate-200 px-3 py-2 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-400 focus:shadow-lg focus:shadow-blue-400/10 min-w-48 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {availableFiles.map((file) => (
                  <option key={file.id} value={file.id} className="bg-slate-800 text-slate-200">
                    {file.original_filename} ({new Date(file.upload_date).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setIsInfoModalOpen(true)}
            disabled={isLoading}
            className={`flex items-center gap-2 bg-white/10 text-slate-300 border border-white/20 px-4 py-2 rounded-lg font-medium text-sm cursor-pointer transition-all duration-200 hover:bg-white/15 hover:text-slate-200 hover:border-white/30 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Read Me
          </button>
        </div>
      </div>

      <div className={`px-8 bg-white/[0.02] border-b border-white/10 ${
        (2 + availableServices.length) > 12 
          ? 'flex flex-wrap' 
          : 'flex overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/30'
      }`}>
        <button
          onClick={() => setActiveTab(hierarchicalTabKey)}
          className={`flex items-center gap-1 bg-transparent border-none text-slate-400 px-3 py-2.5 font-medium text-xs cursor-pointer transition-all duration-200 border-b-2 border-transparent whitespace-nowrap min-w-fit hover:text-slate-200 hover:bg-white/5 ${
            activeTab === hierarchicalTabKey ? 'text-blue-400 border-blue-400 bg-blue-400/10' : ''
          }`}
        >
          🏗️ Resource View
          <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
            activeTab === hierarchicalTabKey ? 'bg-blue-400/20 text-blue-400' : 'bg-white/10 text-slate-300'
          }`}>
            ({hierarchicalData.summary.totalResources})
          </span>
        </button>



        <button
          onClick={() => setActiveTab(visualizationTabKey)}
          className={`flex items-center gap-1 bg-transparent border-none text-slate-400 px-3 py-2.5 font-medium text-xs cursor-pointer transition-all duration-200 border-b-2 border-transparent whitespace-nowrap min-w-fit hover:text-slate-200 hover:bg-white/5 ${
            activeTab === visualizationTabKey ? 'text-blue-400 border-blue-400 bg-blue-400/10' : ''
          }`}
        >
          📊 Visualizations
        </button>

        {availableServices.map((service) => (
          <button
            key={service}
            onClick={() => setActiveTab(service)}
            className={`flex items-center gap-1 bg-transparent border-none text-slate-400 px-3 py-2.5 font-medium text-xs cursor-pointer transition-all duration-200 border-b-2 border-transparent whitespace-nowrap min-w-fit hover:text-slate-200 hover:bg-white/5 ${
              activeTab === service ? 'text-blue-400 border-blue-400 bg-blue-400/10' : ''
            }`}
          >
            {service}
            <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
              activeTab === service ? 'bg-blue-400/20 text-blue-400' : 'bg-white/10 text-slate-300'
            }`}>
              ({serviceHierarchies[service]?.summary.totalResources || 0})
            </span>
          </button>
        ))}
      </div>

      {activeTab === visualizationTabKey ? (
        <DataVisualization data={flatData} />
      ) : activeTab === hierarchicalTabKey ? (
        <HierarchicalResourceView data={hierarchicalData} />
      ) : (
        (() => {
          const currentHierarchicalData = getCurrentHierarchicalData();
          if (currentHierarchicalData) {
            return (
              <HierarchicalResourceView 
                data={currentHierarchicalData}
                serviceFilter={activeTab}
              />
            );
          } else {
            return (
              <div className="flex-1 overflow-hidden p-8">
                <div className="h-full bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-sm flex items-center justify-center">
                  <p className="text-slate-400 text-lg font-medium text-center">
                    No data available for {activeTab}
                  </p>
                </div>
              </div>
            );
          }
        })()
      )}
      
      <InfoModal 
        isOpen={isInfoModalOpen} 
        onClose={() => setIsInfoModalOpen(false)} 
      />
    </div>
  );
}