import json
import boto3
import os
import re
from datetime import datetime, timedelta
from urllib import request, error
import time

s3_client = boto3.client('s3')

SOURCE_BUCKET = os.environ['SOURCE_BUCKET']
DESTINATION_BUCKET = os.environ['DESTINATION_BUCKET']
SOURCE_PATH_PREFIX = os.environ['SOURCE_PATH_PREFIX']
SOURCE_FILENAME = os.environ['SOURCE_FILENAME']
DESTINATION_PATH_PREFIX = os.environ['DESTINATION_PATH_PREFIX']
SLACK_WEBHOOK_URL = os.environ.get('SLACK_WEBHOOK_URL', '')

def lambda_handler(event, context):
    try:
        # Determine previous month (since this runs on the 3rd)
        now = datetime.now()
        if now.day >= 3:
            # If we're on or after the 3rd, process previous month
            target_date = now.replace(day=1) - timedelta(days=1)
        else:
            # Edge case: if somehow running before 3rd, process month before previous
            target_date = (now.replace(day=1) - timedelta(days=1)).replace(day=1) - timedelta(days=1)

        year = target_date.year
        month = target_date.month

        # Construct source path
        billing_period = f"{year:04d}-{month:02d}"
        source_key = f"{SOURCE_PATH_PREFIX}/BILLING_PERIOD={billing_period}/{SOURCE_FILENAME}"

        # Construct destination path
        destination_filename = f"{month:02d}-{year}.parquet"
        destination_key = f"{DESTINATION_PATH_PREFIX}/{destination_filename}"

        print(f"Processing CUR file for {billing_period}")
        print(f"Source: s3://{SOURCE_BUCKET}/{source_key}")
        print(f"Destination: s3://{DESTINATION_BUCKET}/{destination_key}")

        # Check if source file exists
        try:
            s3_client.head_object(Bucket=SOURCE_BUCKET, Key=source_key)
        except s3_client.exceptions.ClientError as e:
            if e.response['Error']['Code'] == '404':
                error_msg = f"Source file not found: {source_key}"
                print(error_msg)
                send_slack_notification(False, billing_period, error_msg)
                return {
                    'statusCode': 404,
                    'body': json.dumps({'error': error_msg})
                }
            else:
                raise

        # Copy file from source to destination
        copy_source = {
            'Bucket': SOURCE_BUCKET,
            'Key': source_key
        }

        s3_client.copy_object(
            CopySource=copy_source,
            Bucket=DESTINATION_BUCKET,
            Key=destination_key
        )

        success_msg = f"Successfully copied CUR file for {billing_period} to {destination_key}"
        print(success_msg)

        send_slack_notification(True, billing_period, destination_key)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': success_msg,
                'billing_period': billing_period,
                'destination_key': destination_key
            })
        }

    except Exception as e:
        error_msg = f"Error processing CUR file: {str(e)}"
        print(error_msg)

        billing_period = f"{year:04d}-{month:02d}" if 'year' in locals() and 'month' in locals() else "unknown"
        send_slack_notification(False, billing_period, error_msg)

        return {
            'statusCode': 500,
            'body': json.dumps({'error': error_msg})
        }

def send_slack_notification(success, billing_period, message):
    if not SLACK_WEBHOOK_URL:
        print("SLACK_WEBHOOK_URL not configured, skipping notification")
        return False

    if success:
        text = f"CUR Monthly Processor Success\n\nBilling Period: {billing_period}\nDestination: {message}"
    else:
        text = f"CUR Monthly Processor Failure\n\nBilling Period: {billing_period}\nError: {message}"

    payload = {
        'text': text
    }

    for attempt in range(3):
        try:
            req = request.Request(
                SLACK_WEBHOOK_URL,
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )

            with request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    print(f"Slack notification sent successfully on attempt {attempt + 1}")
                    return True
                else:
                    print(f"Slack webhook returned status {response.status} on attempt {attempt + 1}")

        except error.URLError as e:
            print(f"Slack webhook error on attempt {attempt + 1}: {str(e)}")

        except Exception as e:
            print(f"Unexpected error sending to Slack on attempt {attempt + 1}: {str(e)}")

        if attempt < 2:
            wait_time = 2 ** (attempt + 1)
            print(f"Retrying in {wait_time}s...")
            time.sleep(wait_time)

    print("Failed to send Slack notification after 3 attempts")
    return False

