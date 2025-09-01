# AWS Cost and Usage Report (CUR) Analyzer

<img width="1904" height="923" alt="image" src="https://github.com/user-attachments/assets/9fef0fa1-7c04-4244-bec2-755ed85d431f" />




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
  - [File Structure](#file-structure)
    - [Backend Storage](#backend-storage)
  - [API Endpoints](#api-endpoints)
  - [What's Next](#whats-next)
  - [License](#license)

</details>


## Overview

The CUR Analyzer consists of a FastAPI backend that processes Parquet files and a Next.js frontend that presents the data in an interactive dashboard. The application automatically processes uploaded CUR files and provides various views of cost data including flat tables and hierarchical service breakdowns.


<img width="1904" height="865" alt="image" src="https://github.com/user-attachments/assets/9eed24a6-8725-40ca-b8ff-0f51d37de03a" />

<img width="1919" height="901" alt="image" src="https://github.com/user-attachments/assets/d52bb266-090f-4b21-b014-4a4cfcedfeab" />


### About This Project Version

This version is based on the original [AWS CUR Analyzer](https://github.com/cybernuki/aws-cur-analyzer) by [cybernuki](https://github.com/cybernuki). We have implementation with the following major changes:

- **Language Localization**: Converted all Spanish text to English for broader accessibility
- **Cost Analysis**: Added comprehensive cost tracking including total cost before and after credits, cost breakdown by service and resource, and savings calculation
- **Enhanced Data Processing**: Increased maximum record limit from 100,000 to 500,000 and added support for cost-related columns
- **Advanced Architecture**: Added file management system with persistent storage, file upload/delete operations, and storage statistics
- **Improved UI/UX**: Modern gradient-based design with interactive data visualizations and enhanced navigation
- **Technical Enhancements**: Added comprehensive API endpoints for file management and enhanced data sanitization



## Architecture

### Backend
- **Framework**: FastAPI with Python
- **Data Processing**: Pandas and PyArrow for Parquet file handling
- **File Management**: Built-in file manager for uploads and processing
- **API**: RESTful endpoints for data retrieval and file operations

### Frontend
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS
- **Visualization**: Chart.js with React Chart.js 2
- **Language**: TypeScript

## Features

- **Parquet File Upload**: Secure upload and validation of AWS CUR Parquet files
- **Data Visualization**: Interactive charts and tables for cost analysis
- **Hierarchical View**: Organized breakdown of costs by service and resource
- **File Management**: Upload, process, and delete CUR files
- **Storage Statistics**: Monitor storage usage and cleanup old files
- **Responsive Design**: Modern, gradient-based UI optimized for data exploration

## Getting Started

### Prerequisites
- Docker and Docker Compose
- AWS Cost and Usage Reports in Parquet format

### Running with Docker Compose

1. Clone the repository
2. Place your AWS CUR Parquet files in the `sample/` directory.
3. Run the application:
   ```bash
   docker-compose up
   ```
4. Access the application at `http://localhost:3000`
5. To copy sample files to the running backend container:
   ```bash
   docker cp sample/. cur_analyzer_backend:/app/storage/uploads/
   ```

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

## File Structure

- `/backend/` - FastAPI application with data processing logic
- `/frontend/` - Next.js application with React components
- `/sample/` - Sample Parquet files for testing
- `docker-compose.yml` - Container orchestration configuration

### Backend Storage

The backend container stores uploaded files at `/app/storage/uploads/` inside the container.

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

## Important: Tax Information Handling

### UI Cost Display (Pre-Tax Only)

**The application displays costs WITHOUT tax information included.** The UI processes and displays only these AWS CUR fields:

- **Cost Before Credit**: `line_item_unblended_cost` - Raw usage costs before any discounts or credits
- **Cost After Credit**: `line_item_net_unblended_cost` - Costs after discounts and credits are applied

Both cost fields exclude tax amounts. If your AWS account is subject to taxes (such as VAT), the totals shown in the application will be **pre-tax amounts only**.

### Hourly to Monthly Conversion Script Behavior

The `convert_hourly_to_monthly.py` script **removes tax information entirely** during the conversion process:

- **Tax records excluded**: Line items with `line_item_line_item_type = "Tax"` are filtered out
- **Tax column dropped**: The `line_item_tax_type` column is not included in the monthly aggregation
- **Verification limitation**: The cost verification logic only validates "Usage" type records, ignoring tax line items

## What's Next

Features we plan to implement:

- **Tax information support**: Add the ability to display and analyze tax charges from AWS CUR reports, including both pre-tax and tax-inclusive cost views.


- **S3 bucket integration**: Add instructions and Terraform configurations for mounting S3 buckets with proper IAM permissions to backend service.

- **Web-based file upload**: Add upload functionality to the frontend.

- **File deletion interface**: Implement delete buttons in the UI for easier file management.

- **Better file validation**: Improve error messages for invalid parquet files.

- **Show CUR annotation tags**: Let users optionally include existing resource tags from the CUR report (e.g., EC2 "Name") as extra columns in the UI tables for easier cost and usage analysis.

## License


See the LICENSE file for licensing information.

