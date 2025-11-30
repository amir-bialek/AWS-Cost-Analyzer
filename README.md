# AWS Cost and Usage Report (CUR) Analyzer

<img width="1904" height="923" alt="image" src="https://github.com/user-attachments/assets/48071634-f8e5-4e87-bf9b-50337f8d242e" />





A full-stack web application for analyzing AWS Cost and Usage Reports (CUR) stored in Parquet format. This tool provides an intuitive interface for visualizing and exploring AWS cost data with hierarchical organization and detailed breakdowns.

<details>
  <summary>📑 Table of Contents</summary>

  - [AWS Cost and Usage Report (CUR) Analyzer](#aws-cost-and-usage-report-cur-analyzer)
  - [Overview](#overview)
    - [About This Project Version](#about-this-project-version)
  - [Architecture](#architecture)
    - [Backend](#backend)
    - [Frontend](#frontend)
  - [Features](#features)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Running with Docker Compose](#running-with-docker-compose)
    - [Development Setup](#development-setup)
      - [Backend](#backend-1)
      - [Frontend](#frontend-1)
      - [Terraform](#terraform)
  - [File Structure](#file-structure)
    - [Backend Storage](#backend-storage)
  - [API Endpoints](#api-endpoints)
  - [What's Next](#whats-next)
  - [License](#license)

</details>


## Overview

The CUR Analyzer consists of a FastAPI backend that processes Parquet files and a Next.js frontend that presents the data in an interactive dashboard. The application automatically processes uploaded CUR files and provides various views of cost data including flat tables and hierarchical service breakdowns.


<img width="1904" height="865" alt="image" src="https://github.com/user-attachments/assets/2219a59b-b5b7-4f25-a7fc-dad07ed97d4f" />


<img width="1919" height="901" alt="image" src="https://github.com/user-attachments/assets/3a78629c-3bf6-4926-8af0-822e59d12d71" />



### About This Project Version

This version is based on the original [AWS CUR Analyzer](https://github.com/cybernuki/aws-cur-analyzer) by [cybernuki](https://github.com/cybernuki). We have implementation with the following major changes:

- **Language Localization**: Converted all Spanish text to English for broader accessibility
- **Cost Analysis**: Added comprehensive cost tracking including total cost before and after credits, cost breakdown by service and resource, and savings calculation
- **Enhanced Data Processing**: Increased maximum record limit from 100,000 to 500,000 and added support for cost-related columns
- **Advanced Architecture**: Added file management system with persistent storage for helmcharts.
- **Improved UI/UX**: Modern gradient-based design with interactive data visualizations and enhanced navigation
- **Technical Enhancements**: Added comprehensive API endpoints for file management and enhanced data sanitization
- **Automated CUR Processing**: Added AWS Lambda functions to automatically process and transfer CUR files from AWS-generated locations to the application's expected format



## Architecture

### Backend
- **Framework**: FastAPI with Python
- **Data Processing**: Pandas and PyArrow for Parquet file handling
- **API**: RESTful endpoints for data retrieval and file operations

### Frontend
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS
- **Visualization**: Chart.js with React Chart.js 2
- **Language**: TypeScript

## Features

- **Comprehensive Tax Support**: Full tax analysis including service-level tax breakdown and tax-inclusive cost calculations
- **Complete Cost Progression**: View costs at every stage - before credits, after credits, and after tax
- **Data Visualization**: Interactive charts and tables for cost analysis with tax information
- **Hierarchical View**: Organized breakdown of costs by service and resource, including tax allocation
- **Storage Statistics**: Monitor storage usage and cleanup old files
- **Responsive Design**: Modern, gradient-based UI optimized for data exploration

## Getting Started

### Prerequisites
- Docker and Docker Compose
- AWS Cost and Usage Reports in Parquet format

### Running with Docker Compose

1. Clone the repository
2. Place your AWS CUR Parquet files in the `report-files/` directory (this folder is automatically mounted to the backend container)
3. Run the application:
   ```bash
   docker-compose up
   ```
4. Access the application at `http://localhost:3000`

The `report-files/` directory is automatically mounted as a volume to `/app/storage/uploads/` inside the backend container, so any files you place there will be immediately available to the application.

### Development Setup

#### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Terraform

The repository includes Terraform code in the `terraform/` directory to deploy AWS Lambda functions that automatically process CUR files from AWS-generated locations to the format expected by the application. The Terraform configuration includes:

- **cur-monthly-processor**: Automatically processes the previous month's CUR report on the 3rd of every month via EventBridge Scheduler. Copies files from the AWS-generated location to the application's expected format and sends Slack notifications.

- **cur-historical-sync**: Manually triggered function to backfill historical CUR files. Only copies files that don't already exist in the destination, making it safe to run multiple times.

Review and update variables in `terraform/variables.tf` as needed before deployment.

## File Structure

- `/backend/` - FastAPI application with data processing logic
- `/frontend/` - Next.js application with React components
- `/report-files/` - Directory for AWS CUR Parquet files (mounted as volume to backend)
- `docker-compose.yml` - Container orchestration configuration

### Backend Storage

The `report-files/` directory is mounted as a volume to `/app/storage/uploads/` inside the backend container. Files placed in the local `report-files/` directory are automatically available to the backend service.

## API Endpoints

- `GET /api/files` - List available Parquet files
- `GET /api/data/{file_id}` - Get processed data for a specific file
- `DELETE /api/files/{file_id}` - Delete a file
- `GET /api/storage/stats` - Get storage statistics
- `POST /api/maintenance/cleanup` - Clean up old files


## Hourly to Monthly Conversion Script

The `convert_hourly_to_monthly.py` script converts hourly AWS Cost and Usage Reports to monthly aggregations, reducing file size while preserving cost accuracy.

### Why This Script is Needed

AWS CUR files generated with "Time granularity = Hourly" contain too much detail for the web application to display efficiently. These files can have hundreds of thousands of records, causing performance issues and timeouts. The script aggregates hourly data into monthly summaries, reducing record count by ~99% while maintaining exact cost totals.

### Usage

```bash
INPUT_FILE="path/to/hourly.parquet" OUTPUT_FILE="path/to/monthly.parquet" python3 convert_hourly_to_monthly.py
```

### Features

- **Automated Verification**: Validates that EC2, S3, EBS, and total AWS costs are preserved during conversion
- **Data Integrity**: Ensures no cost data is lost during the aggregation process
- **Performance**: Reduces file size and record count significantly for better application performance
- **Error Handling**: Exits with appropriate status codes for automation and scripting

## Tax Information Support

### Complete Tax Analysis

**The application provides comprehensive tax analysis and reporting.** The UI processes and displays these AWS CUR cost fields with full tax integration:

- **Cost Before Credit**: `line_item_unblended_cost` - Raw usage costs before any discounts or credits
- **Cost After Credit**: `line_item_net_unblended_cost` - Costs after discounts and credits are applied  
- **Cost After Tax**: Calculated total including proportionally distributed tax amounts
- **Tax Amount**: Service-level and resource-level tax breakdown from `line_item_line_item_type = 'Tax'`

### Tax Features

- **Service-Level Tax Breakdown**: See exactly how much tax you paid for each AWS service (EC2, S3, EBS, etc.)
- **Resource-Level Tax Allocation**: Tax amounts are proportionally distributed to individual resources based on their usage
- **Complete Cost Progression**: View the full cost journey from initial cost → after credits → after tax
- **Tax-Inclusive Visualizations**: All charts, tables, and summaries show final costs including tax
- **Consistent Tax Display**: Purple color coding throughout the UI indicates tax-inclusive amounts


## What's Next

Features we plan to implement:

- **S3 bucket integration**: Add instructions and Terraform configurations for mounting S3 buckets with proper IAM permissions to backend service.

- **Web-based file upload**: Add upload functionality to the frontend.

- **File deletion interface**: Implement delete buttons in the UI for easier file management.

- **Better file validation**: Improve error messages for invalid parquet files.

- **Show CUR annotation tags**: Let users optionally include existing resource tags from the CUR report (e.g., EC2 "Name") as extra columns in the UI tables for easier cost and usage analysis.

## License


See the LICENSE file for licensing information.


