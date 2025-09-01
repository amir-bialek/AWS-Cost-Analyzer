export interface ReportItem {
  Service: string;
  ServiceCode: string;
  UsageType: string;
  Unit: string;
  UsageAmount: number;
  CostBeforeCredit: number;
  CostAfterCredit: number;
  ResourceId: string;
}

export interface CostCategory {
  name: string;
  cost_before_credit: number;
  cost_after_credit: number;
  line_items: ReportItem[];
}

export interface ResourceSummary {
  resourceId: string;
  service: string;
  serviceCode: string;
  totalCostBeforeCredit: number;
  totalCostAfterCredit: number;
  categories: CostCategory[];
}

export interface HierarchicalData {
  resources: ResourceSummary[];
  summary: {
    totalResources: number;
    totalCostBeforeCredit: number;
    totalCostAfterCredit: number;
  };
}

export interface ApiResponse {
  flat_data: ReportItem[];
  hierarchical_data: HierarchicalData;
  service_hierarchies: Record<string, HierarchicalData>;
  file_id?: string; // Added for file persistence
}

export interface FileMetadata {
  id: string;
  original_filename: string;
  upload_date: string;
  file_size: number;
  processed: boolean;
}

export interface StorageStats {
  total_files: number;
  total_size_bytes: number;
  total_size_mb: number;
  oldest_file: string | null;
  newest_file: string | null;
}