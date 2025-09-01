import pandas as pd
import numpy as np
import sys
import os
from typing import Dict, Tuple

# File paths from environment variables
input_file = os.getenv("INPUT_FILE")
output_file = os.getenv("OUTPUT_FILE")

if not input_file:
    print("Error: INPUT_FILE environment variable is required")
    sys.exit(1)
    
if not output_file:
    print("Error: OUTPUT_FILE environment variable is required")
    sys.exit(1)

print("=== Converting CUR Hourly to Monthly ===")

# Read the hourly data
df = pd.read_parquet(input_file)
print(f"Original hourly data: {df.shape[0]:,} rows, {df.shape[1]} columns")

# Convert usage start date to datetime and extract month
time_col = "line_item_usage_start_date"
df[time_col] = pd.to_datetime(df[time_col])
df["month"] = df[time_col].dt.to_period("M").dt.to_timestamp()

print(f"Date range: {df[time_col].min()} to {df[time_col].max()}")

# Define columns to group by (these identify unique cost line items)
group_columns = [
    "month",
    "line_item_line_item_type",
    "line_item_product_code", 
    "line_item_usage_type",
    "line_item_resource_id",
    "pricing_unit"
]

# Define numeric columns to sum (costs and usage amounts)
numeric_columns = [
    "line_item_usage_amount",
    "line_item_unblended_cost", 
    "line_item_net_unblended_cost"
]

# Add any other numeric columns that exist
for col in df.select_dtypes(include=[np.number]).columns:
    if col not in numeric_columns and col != "month":
        numeric_columns.append(col)

print(f"Grouping by: {len(group_columns)} columns")
print(f"Summing: {len(numeric_columns)} numeric columns")

# Group by month and cost line item identifiers, sum the numeric values
monthly_df = df.groupby(group_columns, as_index=False)[numeric_columns].sum()

print(f"Monthly aggregated data: {monthly_df.shape[0]:,} rows, {monthly_df.shape[1]} columns")

# Add back important descriptive columns (take first value from each group)
descriptive_columns = []
for col in df.columns:
    if any(keyword in col.lower() for keyword in ['product_name', 'service_name', 'product.product_name']):
        if col not in group_columns and df[col].dtype == 'object':
            descriptive_columns.append(col)

if descriptive_columns:
    print(f"Adding back {len(descriptive_columns)} descriptive columns")
    desc_df = df.groupby(group_columns, as_index=False)[descriptive_columns].first()
    monthly_df = monthly_df.merge(desc_df, on=group_columns, how='left')

# Verify required columns exist
required_columns = [
    'line_item_line_item_type',
    'line_item_usage_amount', 
    'line_item_product_code',
    'line_item_usage_type',
    'pricing_unit',
    'line_item_unblended_cost',
    'line_item_net_unblended_cost',
    'line_item_resource_id'
]

missing_columns = [col for col in required_columns if col not in monthly_df.columns]
if missing_columns:
    print(f"WARNING: Missing required columns: {missing_columns}")
else:
    print("✓ All required columns present")

# Show summary statistics
if 'line_item_line_item_type' in monthly_df.columns:
    print(f"\nLine item types in monthly data:")
    print(monthly_df['line_item_line_item_type'].value_counts())

# Save the monthly file
monthly_df.to_parquet(output_file, engine="pyarrow", index=False)
print(f"\n✓ Monthly file saved as: {output_file}")
print("Upload this file to your backend storage to use with the application.")

def calculate_service_totals(df: pd.DataFrame) -> Dict[str, Dict[str, float]]:
    required_cols = ['line_item_line_item_type', 'line_item_product_code', 'line_item_usage_type', 
                     'line_item_unblended_cost', 'line_item_net_unblended_cost', 'line_item_usage_amount']
    
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        print(f"Warning: Missing required columns for verification: {missing_cols}")
        return {}
    
    relevant_line_item_types = ['Usage', 'SavingsPlanCoveredUsage', 'DiscountedUsage']
    df_filtered = df[df['line_item_line_item_type'].isin(relevant_line_item_types)].copy()
    
    service_mapping = {
        'AmazonEC2': 'EC2',
        'AmazonS3': 'S3', 
        'AMAZONS3': 'S3',
        'AmazonEBS': 'EBS',
        'AMAZONEBS': 'EBS',
        'EBS': 'EBS'
    }
    
    def classify_service(row):
        product_code = row['line_item_product_code']
        usage_type = str(row['line_item_usage_type']).lower()
        
        if product_code == 'AmazonEC2' and any(ebs_term in usage_type for ebs_term in [
            'volumeusage', 'volume', 'snapshotusage', 'snapshot', 'volumeiousage', 'iops', 'provisioned'
        ]):
            return 'EBS'
        
        return service_mapping.get(product_code, 'Other')
    
    df_filtered['service_classification'] = df_filtered.apply(classify_service, axis=1)
    
    service_totals = {}
    
    for service in ['EC2', 'S3', 'EBS']:
        service_data = df_filtered[df_filtered['service_classification'] == service]
        service_totals[service] = {
            'unblended_cost': service_data['line_item_unblended_cost'].sum(),
            'net_unblended_cost': service_data['line_item_net_unblended_cost'].sum(),
            'usage_amount': service_data['line_item_usage_amount'].sum(),
            'record_count': len(service_data)
        }
    
    service_totals['AWS_TOTAL'] = {
        'unblended_cost': df_filtered['line_item_unblended_cost'].sum(),
        'net_unblended_cost': df_filtered['line_item_net_unblended_cost'].sum(), 
        'usage_amount': df_filtered['line_item_usage_amount'].sum(),
        'record_count': len(df_filtered)
    }
    
    return service_totals

def compare_service_totals(original_totals: Dict, converted_totals: Dict, tolerance: float = 0.01) -> Tuple[bool, Dict]:
    comparison_results = {}
    is_valid = True
    
    for service in ['EC2', 'S3', 'EBS', 'AWS_TOTAL']:
        orig = original_totals.get(service, {'unblended_cost': 0, 'net_unblended_cost': 0, 'usage_amount': 0})
        conv = converted_totals.get(service, {'unblended_cost': 0, 'net_unblended_cost': 0, 'usage_amount': 0})
        
        unblended_diff = abs(orig['unblended_cost'] - conv['unblended_cost'])
        net_diff = abs(orig['net_unblended_cost'] - conv['net_unblended_cost'])
        usage_diff = abs(orig['usage_amount'] - conv['usage_amount'])
        
        unblended_pct = (unblended_diff / max(abs(orig['unblended_cost']), 0.01)) * 100
        net_pct = (net_diff / max(abs(orig['net_unblended_cost']), 0.01)) * 100
        usage_pct = (usage_diff / max(abs(orig['usage_amount']), 0.01)) * 100
        
        service_valid = (unblended_pct <= tolerance and net_pct <= tolerance and usage_pct <= tolerance)
        if not service_valid:
            is_valid = False
            
        comparison_results[service] = {
            'original_unblended_cost': orig['unblended_cost'],
            'converted_unblended_cost': conv['unblended_cost'],
            'unblended_diff': unblended_diff,
            'unblended_diff_pct': unblended_pct,
            'original_net_cost': orig['net_unblended_cost'],
            'converted_net_cost': conv['net_unblended_cost'],
            'net_diff': net_diff,
            'net_diff_pct': net_pct,
            'original_usage': orig['usage_amount'],
            'converted_usage': conv['usage_amount'],
            'usage_diff': usage_diff,
            'usage_diff_pct': usage_pct,
            'is_valid': service_valid,
            'original_records': orig.get('record_count', 0),
            'converted_records': conv.get('record_count', 0)
        }
    
    return is_valid, comparison_results

def print_comparison_results(comparison_results: Dict, is_valid: bool):
    print("\n" + "="*100)
    print("COST VERIFICATION RESULTS")
    print("="*100)
    
    for service in ['EC2', 'S3', 'EBS', 'AWS_TOTAL']:
        result = comparison_results[service]
        status = "PASS" if result['is_valid'] else "FAIL"
        
        print(f"\n{service} {status}")
        print("-" * 50)
        print(f"{'Metric':<25} {'Original':<15} {'Converted':<15} {'Diff %':<10}")
        print("-" * 65)
        
        print(f"{'Unblended Cost':<25} ${result['original_unblended_cost']:<14.2f} ${result['converted_unblended_cost']:<14.2f} {result['unblended_diff_pct']:<9.4f}%")
        print(f"{'Net Cost':<25} ${result['original_net_cost']:<14.2f} ${result['converted_net_cost']:<14.2f} {result['net_diff_pct']:<9.4f}%")
        print(f"{'Usage Amount':<25} {result['original_usage']:<15.2f} {result['converted_usage']:<15.2f} {result['usage_diff_pct']:<9.4f}%")
        print(f"{'Record Count':<25} {result['original_records']:<15,} {result['converted_records']:<15,}")
    
    print("\n" + "="*100)
    overall_status = "CONVERSION VALIDATED - All totals match!" if is_valid else "CONVERSION FAILED - Totals do not match!"
    print(f"OVERALL RESULT: {overall_status}")
    print("="*100)

def run_cost_verification_test():
    print(f"\nRUNNING COST VERIFICATION TEST")
    print("-" * 50)
    
    try:
        print(f"Reading original hourly data from: {input_file}")
        original_df = pd.read_parquet(input_file)
        
        print(f"Reading converted monthly data from: {output_file}")
        converted_df = pd.read_parquet(output_file)
        
        print("Calculating service totals for original data...")
        original_totals = calculate_service_totals(original_df)
        if not original_totals:
            print("Error: Could not calculate original totals - missing required columns")
            return False, {}
        
        print("Calculating service totals for converted data...")
        converted_totals = calculate_service_totals(converted_df)
        if not converted_totals:
            print("Error: Could not calculate converted totals - missing required columns")
            return False, {}
        
        print("Comparing totals...")
        is_valid, comparison_results = compare_service_totals(original_totals, converted_totals)
        
        print_comparison_results(comparison_results, is_valid)
        
        return is_valid, comparison_results
        
    except FileNotFoundError as e:
        print(f"Error: Could not find file - {e}")
        return False, {}
    except Exception as e:
        print(f"Error during verification: {e}")
        return False, {}

print(f"\nStarting automated cost verification...")
is_conversion_valid, test_results = run_cost_verification_test()

if not is_conversion_valid:
    print(f"\nWARNING: Cost verification failed! The conversion may have introduced errors.")
    print("Please review the comparison results above and check your data.")
    sys.exit(1)
else:
    print(f"\nSUCCESS: Cost verification passed! The conversion preserved all cost totals correctly.")