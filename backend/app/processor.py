import pandas as pd
import io
import os
from typing import Dict, List, Any

MAX_RECORDS = int(os.getenv("MAX_RECORDS", 500000))
REQUIRED_COLUMNS = [
    'line_item_line_item_type',
    'line_item_usage_amount',
    'line_item_product_code',
    'line_item_usage_type',
    'pricing_unit',
    'line_item_unblended_cost',
    'line_item_net_unblended_cost',
    'line_item_resource_id'
]

def sanitize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    if len(df) > MAX_RECORDS:
        raise ValueError(f"Too many records. Maximum allowed: {MAX_RECORDS:,}")

    missing_columns = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing_columns:
        raise ValueError(f"Missing required columns: {', '.join(missing_columns)}")

    try:
        df['line_item_usage_amount'] = pd.to_numeric(df['line_item_usage_amount'], errors='coerce')
        df = df[df['line_item_usage_amount'] >= 0]

        df['line_item_unblended_cost'] = pd.to_numeric(df['line_item_unblended_cost'], errors='coerce')
        df['line_item_net_unblended_cost'] = pd.to_numeric(df['line_item_net_unblended_cost'], errors='coerce')
        df = df[df['line_item_unblended_cost'] >= 0]
        df = df[df['line_item_net_unblended_cost'] >= 0]

        df = df.dropna(subset=['line_item_usage_amount', 'line_item_unblended_cost', 'line_item_net_unblended_cost'])

        string_columns = ['line_item_product_code', 'line_item_usage_type', 'pricing_unit', 'line_item_resource_id']
        for col in string_columns:
            if col in df.columns:
                df[col] = df[col].astype(str).str.replace(r'[<>"\';]', '', regex=True).str[:100]

        if len(df) == 0:
            raise ValueError("No valid records found after data sanitization")

        return df

    except Exception as e:
        raise ValueError(f"Data sanitization failed: {str(e)}")

def classify_s3_usage_type(usage_type: str) -> str:
    usage_type = usage_type.lower()
    
    if any(term in usage_type for term in ['timedstorage', 'storage', 'reduced', 'glacier', 'intelligence', 'onezone']):
        return "Storage"
    elif any(term in usage_type for term in ['datatransfer-out', 'datatransfer-regional']):
        return "Data Transfer Out"
    elif any(term in usage_type for term in ['requests-tier1', 'requests-tier2', 'requests-', 'get', 'put', 'post', 'list', 'copy']):
        return "Requests"
    elif any(term in usage_type for term in ['inventory', 'analytics', 'insights', 'monitoring']):
        return "Management & Analytics"
    else:
        return "Other"

def classify_ec2_usage_type(usage_type: str) -> str:
    usage_type = usage_type.lower()
    
    if any(term in usage_type for term in ['runinstances', 'boxusage', 'instance', 'vcpu', 'hours']):
        return "Compute"
    elif any(term in usage_type for term in ['datatransfer-out', 'datatransfer-regional']):
        return "Data Transfer Out"
    elif any(term in usage_type for term in ['elb', 'loadbalancer', 'balancing']):
        return "Load Balancing"
    else:
        return "Other"

def classify_ebs_usage_type(usage_type: str) -> str:
    usage_type = usage_type.lower()
    
    if any(term in usage_type for term in ['volumeusage', 'volume']):
        return "Volume Storage"
    elif any(term in usage_type for term in ['snapshotusage', 'snapshot']):
        return "Snapshots"
    elif any(term in usage_type for term in ['volumeiousage', 'iops', 'provisioned']):
        return "Provisioned IOPS"
    else:
        return "Other"

def classify_vpc_usage_type(usage_type: str) -> str:
    usage_type = usage_type.lower()
    
    if any(term in usage_type for term in ['vpn', 'vpnconnection']):
        return "VPN Connections"
    elif any(term in usage_type for term in ['natgateway', 'nat-gateway']):
        return "NAT Gateway"
    elif any(term in usage_type for term in ['datatransfer', 'data-transfer']):
        return "Data Transfer"
    elif any(term in usage_type for term in ['publicipv4', 'public-ipv4', 'elasticip']):
        return "Public IPv4 Addresses"
    else:
        return "Other"

def classify_cloudfront_usage_type(usage_type: str) -> str:
    usage_type = usage_type.lower()
    
    if any(term in usage_type for term in ['origin-request', 'origin']):
        return "Origin Requests"
    elif any(term in usage_type for term in ['request', 'https', 'http']):
        return "Edge Requests"
    elif any(term in usage_type for term in ['datatransfer', 'data-transfer']):
        return "Data Transfer"
    else:
        return "Other"

def classify_rds_usage_type(usage_type: str) -> str:
    usage_type = usage_type.lower()
    
    if any(term in usage_type for term in ['instanceusage', 'db.', 'running']):
        return "Database Instances"
    elif any(term in usage_type for term in ['storage', 'gp2', 'gp3', 'io1']):
        return "Storage"
    elif any(term in usage_type for term in ['backup', 'snapshot']):
        return "Backup & Snapshots"
    elif any(term in usage_type for term in ['datatransfer', 'data-transfer']):
        return "Data Transfer"
    else:
        return "Other"

def get_cost_category(service_code: str, usage_type: str) -> str:
    service_code = service_code.upper()
    
    if service_code == 'AMAZONS3':
        return classify_s3_usage_type(usage_type)
    elif service_code == 'AMAZONEC2':
        return classify_ec2_usage_type(usage_type)
    elif service_code in ['AMAZONEBS', 'EBS']:
        return classify_ebs_usage_type(usage_type)
    elif service_code in ['AMAZONVPC', 'VPC']:
        return classify_vpc_usage_type(usage_type)
    elif service_code == 'AMAZONCLOUDFRONT':
        return classify_cloudfront_usage_type(usage_type)
    elif service_code in ['AMAZONRDS', 'RDS']:
        return classify_rds_usage_type(usage_type)
    else:
        return "Other"

def build_resource_hierarchy(df: pd.DataFrame, service_filter: str = None, tax_by_service: Dict[str, float] = None) -> Dict[str, Any]:
    
    if service_filter:
        def clean_service_name(service_name):
            if isinstance(service_name, str):
                if service_name.startswith('Amazon '):
                    return service_name[7:]
                elif service_name.startswith('Amazon'):
                    return service_name[6:]
            return service_name
        
        df = df.copy()
        df['CleanedServiceName'] = df['EffectiveServiceName'].apply(clean_service_name)
        
        df = df[df['CleanedServiceName'].str.upper() == service_filter.upper()]
        
        if df.empty:
            return {
                'resources': [],
                'summary': {
                    'totalResources': 0,
                    'totalCostBeforeCredit': 0,
                    'totalCostAfterCredit': 0,
                    'totalCostAfterTax': 0
                }
            }
    
    resource_groups = df.groupby('line_item_resource_id')
    
    resources = []
    
    for resource_id, resource_df in resource_groups:
        if pd.isna(resource_id) or resource_id == 'nan' or resource_id == '':
            resource_id = "Unassigned"
        
        service_info = resource_df.iloc[0]
        service_name = service_info['EffectiveServiceName']
        service_code = service_info['line_item_product_code']
        
        total_cost_before_credit = resource_df['line_item_unblended_cost'].sum()
        total_cost_after_credit = resource_df['line_item_net_unblended_cost'].sum()
        
        # Calculate proportional tax for this resource
        service_tax = 0.0
        if tax_by_service and service_code in tax_by_service:
            service_tax = tax_by_service[service_code]
        
        # Calculate this resource's share of the service's total cost after credit
        service_total_cost = df[df['line_item_product_code'] == service_code]['line_item_net_unblended_cost'].sum()
        if service_total_cost > 0 and service_tax > 0:
            resource_tax_share = (total_cost_after_credit / service_total_cost) * service_tax
        else:
            resource_tax_share = 0.0
            
        total_cost_after_tax = total_cost_after_credit + resource_tax_share
        
        categories = {}
        
        for _, row in resource_df.iterrows():
            category = get_cost_category(row['line_item_product_code'], row['line_item_usage_type'])
            
            if category not in categories:
                categories[category] = {
                    'name': category,
                    'cost_before_credit': 0,
                    'cost_after_credit': 0,
                    'line_items': []
                }
            
            categories[category]['cost_before_credit'] += row['line_item_unblended_cost']
            categories[category]['cost_after_credit'] += row['line_item_net_unblended_cost']
            
            # Calculate proportional tax for this line item
            line_item_tax = 0.0
            if total_cost_after_credit > 0 and resource_tax_share > 0:
                line_item_tax = (row['line_item_net_unblended_cost'] / total_cost_after_credit) * resource_tax_share
            
            line_item = {
                'Service': row['EffectiveServiceName'],
                'ServiceCode': row['line_item_product_code'],
                'UsageType': row['line_item_usage_type'],
                'Unit': row['pricing_unit'],
                'UsageAmount': row['line_item_usage_amount'],
                'CostBeforeCredit': row['line_item_unblended_cost'],
                'CostAfterCredit': row['line_item_net_unblended_cost'],
                'CostAfterTax': row['line_item_net_unblended_cost'] + line_item_tax,
                'ResourceId': row['line_item_resource_id']
            }
            categories[category]['line_items'].append(line_item)
        
        categories_list = list(categories.values())
        categories_list.sort(key=lambda x: x['cost_before_credit'], reverse=True)
        
        resource_summary = {
            'resourceId': resource_id,
            'service': service_name,
            'serviceCode': service_code,
            'totalCostBeforeCredit': total_cost_before_credit,
            'totalCostAfterCredit': total_cost_after_credit,
            'totalCostAfterTax': total_cost_after_tax,
            'categories': categories_list
        }
        
        resources.append(resource_summary)
    
    resources.sort(key=lambda x: x['totalCostBeforeCredit'], reverse=True)
    
    return {
        'resources': resources,
        'summary': {
            'totalResources': len(resources),
            'totalCostBeforeCredit': sum(r['totalCostBeforeCredit'] for r in resources),
            'totalCostAfterCredit': sum(r['totalCostAfterCredit'] for r in resources),
            'totalCostAfterTax': sum(r['totalCostAfterTax'] for r in resources)
        }
    }

def process_parquet_file(file_contents: bytes):
    try:
        parquet_file = io.BytesIO(file_contents)
        df = pd.read_parquet(parquet_file)

        df = sanitize_dataframe(df)

        tax_df = df[df['line_item_line_item_type'] == 'Tax'].copy()
        total_tax_amount = tax_df['line_item_net_unblended_cost'].sum() if not tax_df.empty else 0.0
        
        # Calculate tax by service
        tax_by_service = {}
        if not tax_df.empty:
            tax_by_service = tax_df.groupby('line_item_product_code')['line_item_net_unblended_cost'].sum().to_dict()

        relevant_line_item_types = ['Usage', 'SavingsPlanCoveredUsage', 'DiscountedUsage']
        df_usage = df[df['line_item_line_item_type'].isin(relevant_line_item_types)].copy()

        if df_usage.empty:
            return []

        df_usage = df_usage.dropna(subset=['line_item_usage_amount'])

        if 'product.product_name' in df_usage.columns:
            df_usage['EffectiveServiceName'] = df_usage['product.product_name']
        elif 'product_name' in df_usage.columns:
            df_usage['EffectiveServiceName'] = df_usage['product_name']
        else:
            df_usage['EffectiveServiceName'] = pd.NA

        df_usage['EffectiveServiceName'] = df_usage['EffectiveServiceName'].fillna(df_usage['line_item_product_code'])

        df_usage['EffectiveServiceName'] = df_usage['EffectiveServiceName'].fillna('UnknownService')
        
        def enhance_service_classification(row):
            service_name = row['EffectiveServiceName']
            product_code = row['line_item_product_code']
            usage_type = str(row['line_item_usage_type']).lower()
            
            if product_code == 'AmazonEC2' and any(ebs_term in usage_type for ebs_term in [
                'volumeusage', 'volume', 'snapshotusage', 'snapshot', 'volumeiousage', 'iops', 'provisioned'
            ]):
                return 'Amazon Elastic Block Store'
            
            if product_code == 'AmazonVPC':
                return 'Amazon Virtual Private Cloud'
                
            return service_name
        
        df_usage['EffectiveServiceName'] = df_usage.apply(enhance_service_classification, axis=1)

        flat_report = df_usage.groupby([
            'EffectiveServiceName',
            'line_item_product_code',
            'line_item_usage_type',
            'pricing_unit',
            'line_item_resource_id'
        ]).agg({
            'line_item_usage_amount': 'sum',
            'line_item_unblended_cost': 'sum',
            'line_item_net_unblended_cost': 'sum'
        }).reset_index()

        flat_report.rename(columns={
            'EffectiveServiceName': 'Service',
            'line_item_product_code': 'ServiceCode',
            'line_item_usage_type': 'UsageType',
            'pricing_unit': 'Unit',
            'line_item_usage_amount': 'UsageAmount',
            'line_item_unblended_cost': 'CostBeforeCredit',
            'line_item_net_unblended_cost': 'CostAfterCredit',
            'line_item_resource_id': 'ResourceId'
        }, inplace=True)

        def clean_service_name(service_name):
            if isinstance(service_name, str):
                if service_name.startswith('Amazon '):
                    return service_name[7:]
                elif service_name.startswith('Amazon'):
                    return service_name[6:]
            return service_name

        flat_report['Service'] = flat_report['Service'].apply(clean_service_name)

        hierarchical_data = build_resource_hierarchy(df_usage, None, tax_by_service)

        def clean_service_name_for_tab(service_name):
            if isinstance(service_name, str):
                if service_name.startswith('Amazon '):
                    return service_name[7:]
                elif service_name.startswith('Amazon'):
                    return service_name[6:]
            return service_name

        unique_services = set()
        for service_name in df_usage['EffectiveServiceName'].unique():
            cleaned_name = clean_service_name_for_tab(service_name)
            if cleaned_name and cleaned_name != 'UnknownService':
                unique_services.add(cleaned_name)
        
        service_hierarchies = {}
        for service in sorted(unique_services):
            hierarchy_data = build_resource_hierarchy(df_usage, service, tax_by_service)
            if hierarchy_data and hierarchy_data.get('resources') and len(hierarchy_data['resources']) > 0:
                service_hierarchies[service] = hierarchy_data

        if len(flat_report) > MAX_RECORDS:
            flat_report = flat_report.head(MAX_RECORDS)

        numeric_columns = ['UsageAmount', 'CostBeforeCredit', 'CostAfterCredit']
        for col in numeric_columns:
            flat_report[col] = flat_report[col].replace([float('inf'), float('-inf')], 0)

        flat_result = flat_report.to_dict(orient='records')

        for record in flat_result:
            for key, value in record.items():
                if isinstance(value, str):
                    record[key] = str(value)[:200].replace('<', '').replace('>', '').replace('"', '').replace("'", '')

        total_cost_before_credit = flat_report['CostBeforeCredit'].sum()
        total_cost_after_credit = flat_report['CostAfterCredit'].sum()
        total_cost_after_credit_and_tax = total_cost_after_credit + total_tax_amount

        return {
            'flat_data': flat_result,
            'hierarchical_data': hierarchical_data,
            'service_hierarchies': service_hierarchies,
            'summary': {
                'total_cost_before_credit': total_cost_before_credit,
                'total_cost_after_credit': total_cost_after_credit,
                'total_tax_amount': total_tax_amount,
                'total_cost_after_credit_and_tax': total_cost_after_credit_and_tax,
                'total_savings': total_cost_before_credit - total_cost_after_credit
            }
        }

    except Exception as e:
        print(f"Error processing Parquet file: {e}")
        return {"error": f"Failed to process Parquet file: {type(e).__name__} - {str(e)}"}