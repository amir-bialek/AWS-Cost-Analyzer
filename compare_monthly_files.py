import pandas as pd

print("=== COMPARING MONTHLY FILES ===")
print("File 1: 07-2025-monthly.parquet (original without tax)")
print("File 2: 07-2025-monthly-with-tax.parquet (new with tax)")
print()

df_original = pd.read_parquet('parquet/07-2025-monthly.parquet')
df_with_tax = pd.read_parquet('parquet/07-2025-monthly-with-tax.parquet')

print("=== FILE STRUCTURE COMPARISON ===")
print(f"Original file shape: {df_original.shape}")
print(f"With tax file shape: {df_with_tax.shape}")
print()

print("=== COLUMNS COMPARISON ===")
original_cols = set(df_original.columns)
with_tax_cols = set(df_with_tax.columns)

common_cols = original_cols.intersection(with_tax_cols)
only_original = original_cols - with_tax_cols
only_with_tax = with_tax_cols - original_cols

print(f"Common columns: {len(common_cols)}")
print(f"Only in original: {len(only_original)}")
if only_original:
    print(f"  {list(only_original)}")
print(f"Only in with-tax: {len(only_with_tax)}")
if only_with_tax:
    print(f"  {list(only_with_tax)}")
print()

print("=== LINE ITEM TYPES COMPARISON ===")
print("Original file line item types:")
print(df_original['line_item_line_item_type'].value_counts())
print()

print("With tax file line item types:")
print(df_with_tax['line_item_line_item_type'].value_counts())
print()

print("=== TAX DATA ANALYSIS ===")
if 'Tax' in df_with_tax['line_item_line_item_type'].values:
    tax_records = df_with_tax[df_with_tax['line_item_line_item_type'] == 'Tax']
    print(f"Tax records in with-tax file: {len(tax_records)}")
    print(f"Total tax amount: ${tax_records['line_item_unblended_cost'].sum():.2f}")
    print("Tax by product:")
    tax_by_product = tax_records.groupby('line_item_product_code')['line_item_unblended_cost'].sum().round(2)
    print(tax_by_product)
else:
    print("No tax records found in with-tax file")
print()

print("=== COST COMPARISON FOR COMMON RECORDS ===")
if 'line_item_unblended_cost' in common_cols and 'line_item_net_unblended_cost' in common_cols:
    original_total_unblended = df_original['line_item_unblended_cost'].sum()
    original_total_net = df_original['line_item_net_unblended_cost'].sum()
    
    with_tax_total_unblended = df_with_tax['line_item_unblended_cost'].sum()
    with_tax_total_net = df_with_tax['line_item_net_unblended_cost'].sum()
    
    print(f"Original total (unblended): ${original_total_unblended:.2f}")
    print(f"With tax total (unblended): ${with_tax_total_unblended:.2f}")
    print(f"Difference (unblended): ${abs(original_total_unblended - with_tax_total_unblended):.2f}")
    print()
    
    print(f"Original total (net): ${original_total_net:.2f}")
    print(f"With tax total (net): ${with_tax_total_net:.2f}")
    print(f"Difference (net): ${abs(original_total_net - with_tax_total_net):.2f}")
    print()

print("=== SERVICE BREAKDOWN COMPARISON ===")
def get_service_totals(df, service_name):
    if service_name == 'EC2':
        ec2_data = df[df['line_item_product_code'] == 'AmazonEC2']
        return {
            'unblended': ec2_data['line_item_unblended_cost'].sum(),
            'net': ec2_data['line_item_net_unblended_cost'].sum(),
            'records': len(ec2_data)
        }
    elif service_name == 'S3':
        s3_data = df[df['line_item_product_code'] == 'AmazonS3']
        return {
            'unblended': s3_data['line_item_unblended_cost'].sum(),
            'net': s3_data['line_item_net_unblended_cost'].sum(),
            'records': len(s3_data)
        }
    elif service_name == 'EBS':
        ebs_data = df[df['line_item_product_code'].isin(['AmazonEBS', 'EBS'])]
        return {
            'unblended': ebs_data['line_item_unblended_cost'].sum(),
            'net': ebs_data['line_item_net_unblended_cost'].sum(),
            'records': len(ebs_data)
        }
    return {'unblended': 0, 'net': 0, 'records': 0}

for service in ['EC2', 'S3', 'EBS']:
    print(f"--- {service} COMPARISON ---")
    orig_service = get_service_totals(df_original, service)
    tax_service = get_service_totals(df_with_tax, service)
    
    print(f"Original {service} (unblended): ${orig_service['unblended']:.2f}")
    print(f"With tax {service} (unblended): ${tax_service['unblended']:.2f}")
    print(f"Difference: ${abs(orig_service['unblended'] - tax_service['unblended']):.2f}")
    print(f"Original {service} records: {orig_service['records']}")
    print(f"With tax {service} records: {tax_service['records']}")
    print()

print("=== SUMMARY ===")
print("The main differences should be:")
print("1. With-tax file includes tax records (27 records)")
print("2. With-tax file has higher total costs due to tax inclusion")
print("3. With-tax file has additional columns for tax information")
print("4. Usage records should be identical between both files")
