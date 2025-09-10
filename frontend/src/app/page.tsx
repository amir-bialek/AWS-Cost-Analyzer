"use client"

import { useState, useEffect } from 'react';
import ReportTable from '@/components/ReportTable';
import { ReportItem, ApiResponse, HierarchicalData, FileMetadata } from '@/types/ReportItem';
import CurSetupModal from '@/components/CurSetupModal';


export default function Home() {
  const [flatData, setFlatData] = useState<ReportItem[] | null>(null);
  const [hierarchicalData, setHierarchicalData] = useState<HierarchicalData | null>(null);
  const [serviceHierarchies, setServiceHierarchies] = useState<Record<string, HierarchicalData> | null>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isCurSetupModalOpen, setIsCurSetupModalOpen] = useState<boolean>(false);
  
  const [availableFiles, setAvailableFiles] = useState<FileMetadata[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [loadingDots, setLoadingDots] = useState<string>('.');

  useEffect(() => {
    loadAvailableFilesAndAutoLoad();
  }, []);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingDots((prev: string) => {
          if (prev === '.') return '..';
          if (prev === '..') return '...';
          return '.';
        });
      }, 500);
      return () => clearInterval(interval);
    } else {
      setLoadingDots('.');
    }
  }, [isLoading]);

  const loadAvailableFilesAndAutoLoad = async () => {
    try {
      const response = await fetch('/api/files');
      if (response.ok) {
        const files = await response.json();
        setAvailableFiles(files);
        
        const lastFileId = typeof window !== 'undefined' ? localStorage.getItem('selectedFileId') : null;
        
        if (lastFileId && files.some((f: any) => f.id === lastFileId)) {
          loadFileData(lastFileId);
        } else if (files.length > 0) {
          loadFileData(files[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading file list:', error);
      setError('Unable to load file list. Please check your connection and try again.');
    }
  };


  const saveStateToStorage = (fileId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedFileId', fileId);
    }
  };

  const loadFileData = async (fileId: string) => {
    try {
      setIsLoading(true);
      setLoadingProgress(10);
      setLoadingStatus('Loading file data...');
      
      const response = await fetch(`/api/data/${fileId}`);
      if (response.ok) {
        setLoadingProgress(50);
        setLoadingStatus('Processing data...');
        
        const data: ApiResponse = await response.json();
        
        setLoadingProgress(80);
        setLoadingStatus('Building interface...');
        
        setFlatData(data.flat_data);
        setHierarchicalData(data.hierarchical_data);
        setServiceHierarchies(data.service_hierarchies);
        setSummaryData(data.summary);
        setSelectedFileId(fileId);
        saveStateToStorage(fileId);
        
        setLoadingProgress(100);
        setLoadingStatus('Complete!');
        
        setTimeout(() => {
          setLoadingProgress(0);
          setLoadingStatus('');
        }, 500);
      } else {
        throw new Error('Failed to load file data');
      }
    } catch (error) {
      console.error('Error loading file data:', error);
      setError('Failed to load file data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelection = (fileId: string) => {
    if (fileId !== selectedFileId && !isLoading) {
      loadFileData(fileId);
    }
  };


  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-slate-200 flex flex-col items-center justify-center font-sans overflow-hidden">
      {(!flatData || !hierarchicalData || !serviceHierarchies) && availableFiles.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="mb-8 text-center max-w-2xl">
            <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
{"{{COMPANY_NAME}}"} Cost and Usage Report (CUR) Analyzer
            </h1>
            <p className="text-slate-300 text-lg mb-8">
              No parquet files found in the mounted volume.
            </p>
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 text-left">
              <h3 className="text-xl font-semibold text-slate-200 mb-4">To get started:</h3>
              <ol className="text-slate-300 space-y-3">
                <li>1. Place your AWS CUR .parquet files in the <code className="bg-blue-400/10 text-blue-400 px-2 py-1 rounded font-mono">/app/storage/uploads/</code> directory</li>
                <li>2. Click the "Refresh Files" button to scan for new files</li>
                <li>3. Select a file from the dropdown to analyze your costs</li>
              </ol>
              <div className="mt-6 text-center">
                <button
                  onClick={loadAvailableFilesAndAutoLoad}
                  disabled={isLoading}
                  className={`bg-gradient-to-r from-blue-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-600 hover:to-emerald-600'}`}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Scanning...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh Files
                    </div>
                  )}
                </button>
              </div>
            </div>
            {error && (
              <p className="text-red-400 bg-red-400/10 border border-red-400/20 px-6 py-4 rounded-xl text-center font-medium mt-4">
                {error}
              </p>
            )}
          </div>
        </div>
      ) : (!flatData || !hierarchicalData || !serviceHierarchies) && (availableFiles.length > 0 || isLoading) ? (
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Loading AWS Cost Data
            </h1>
            {loadingProgress > 0 && (
              <div className="w-96 max-w-md mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-200 font-medium text-sm">{loadingStatus}</span>
                  <span className="text-blue-400 font-semibold text-sm">{loadingProgress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300 ease-out"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
              </div>
            )}
            {loadingProgress === 0 && (
              <div className="flex items-center gap-2 text-blue-400 font-medium">
                <div className="w-5 h-5 border-2 border-blue-400/20 border-t-blue-400 rounded-full animate-spin"></div>
                Initializing...
              </div>
            )}
          </div>
        </div>
      ) : (
        <ReportTable 
          flatData={flatData!} 
          hierarchicalData={hierarchicalData!}
          serviceHierarchies={serviceHierarchies!}
          summaryData={summaryData}
          availableFiles={availableFiles}
          selectedFileId={selectedFileId}
          onFileSelection={handleFileSelection}
          isLoading={isLoading}
          loadingDots={loadingDots}
        />
      )}
      <CurSetupModal
        isOpen={isCurSetupModalOpen}
        onClose={() => setIsCurSetupModalOpen(false)}
      />
    </div>
  );
}
