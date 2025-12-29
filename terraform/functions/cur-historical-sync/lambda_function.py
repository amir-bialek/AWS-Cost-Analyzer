import json
import boto3
import os
import re

s3_client = boto3.client('s3')

SOURCE_BUCKET = os.environ['SOURCE_BUCKET']
DESTINATION_BUCKET = os.environ['DESTINATION_BUCKET']
SOURCE_PATH_PREFIX = os.environ['SOURCE_PATH_PREFIX']
SOURCE_FILENAME = os.environ['SOURCE_FILENAME']
DESTINATION_PATH_PREFIX = os.environ['DESTINATION_PATH_PREFIX']

def lambda_handler(event, context):
    try:
        # List existing destination files
        print(f"Listing existing files in s3://{DESTINATION_BUCKET}/{DESTINATION_PATH_PREFIX}/")
        existing_files = list_destination_files()
        existing_months = parse_existing_months(existing_files)

        print(f"Found {len(existing_months)} existing months in destination: {sorted(existing_months)}")

        # List source files
        print(f"Listing source files in s3://{SOURCE_BUCKET}/{SOURCE_PATH_PREFIX}/")
        source_files = list_source_files()

        print(f"Found {len(source_files)} source files")

        # Process each source file
        results = {
            'copied': [],
            'skipped': [],
            'errors': []
        }

        for source_key, billing_period in source_files:
            try:
                # Convert billing period to destination format
                year, month = billing_period.split('-')
                month_int = int(month)
                year_int = int(year)

                destination_filename = f"{month_int:02d}-{year_int}.parquet"
                destination_key = f"{DESTINATION_PATH_PREFIX}/{destination_filename}"

                # Check if destination already exists
                if billing_period in existing_months:
                    print(f"Skipping {billing_period} - already exists as {destination_key}")
                    results['skipped'].append({
                        'billing_period': billing_period,
                        'destination_key': destination_key
                    })
                    continue

                # Copy file
                print(f"Copying {billing_period} to {destination_key}")
                copy_source = {
                    'Bucket': SOURCE_BUCKET,
                    'Key': source_key
                }

                s3_client.copy_object(
                    CopySource=copy_source,
                    Bucket=DESTINATION_BUCKET,
                    Key=destination_key
                )

                results['copied'].append({
                    'billing_period': billing_period,
                    'source_key': source_key,
                    'destination_key': destination_key
                })
                print(f"Successfully copied {billing_period}")

            except Exception as e:
                error_msg = f"Error processing {billing_period}: {str(e)}"
                print(error_msg)
                results['errors'].append({
                    'billing_period': billing_period,
                    'error': error_msg
                })

        summary = {
            'total_source_files': len(source_files),
            'copied': len(results['copied']),
            'skipped': len(results['skipped']),
            'errors': len(results['errors']),
            'details': results
        }

        print(f"Sync complete: {summary['copied']} copied, {summary['skipped']} skipped, {summary['errors']} errors")

        return {
            'statusCode': 200,
            'body': json.dumps(summary)
        }

    except Exception as e:
        error_msg = f"Error in historical sync: {str(e)}"
        print(error_msg)
        return {
            'statusCode': 500,
            'body': json.dumps({'error': error_msg})
        }

def list_destination_files():
    """List all files in the destination path"""
    files = []
    paginator = s3_client.get_paginator('list_objects_v2')

    for page in paginator.paginate(Bucket=DESTINATION_BUCKET, Prefix=DESTINATION_PATH_PREFIX + '/'):
        if 'Contents' in page:
            for obj in page['Contents']:
                files.append(obj['Key'])

    return files

def parse_existing_months(files):
    """Parse existing destination files to extract billing periods"""
    months = set()
    pattern = re.compile(r'(\d{2})-(\d{4})\.parquet$')

    for file_key in files:
        filename = os.path.basename(file_key)
        match = pattern.search(filename)
        if match:
            month = match.group(1)
            year = match.group(2)
            billing_period = f"{year}-{month}"
            months.add(billing_period)

    return months

def list_source_files():
    """List all source files matching the billing period pattern"""
    files = []
    paginator = s3_client.get_paginator('list_objects_v2')
    pattern = re.compile(r'BILLING_PERIOD=(\d{4}-\d{2})/')

    prefix = f"{SOURCE_PATH_PREFIX}/BILLING_PERIOD="

    for page in paginator.paginate(Bucket=SOURCE_BUCKET, Prefix=prefix):
        if 'Contents' in page:
            for obj in page['Contents']:
                key = obj['Key']
                # Check if this is the expected filename
                if key.endswith(f'/{SOURCE_FILENAME}'):
                    match = pattern.search(key)
                    if match:
                        billing_period = match.group(1)
                        files.append((key, billing_period))

    return files

