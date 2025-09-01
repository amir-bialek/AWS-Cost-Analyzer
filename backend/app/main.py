from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .processor import process_parquet_file
from .file_manager import FileManager
import os
from pathlib import Path
from typing import List, Dict, Any

app = FastAPI()

file_manager = FileManager()

MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 100 * 1024 * 1024))
ALLOWED_EXTENSIONS = {'.parquet'}

def validate_file(file_contents: bytes, filename: str) -> None:
    if len(file_contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size allowed: {MAX_FILE_SIZE // (1024*1024)}MB"
        )

    file_extension = Path(filename).suffix.lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Only {', '.join(ALLOWED_EXTENSIONS)} files are allowed"
        )

    if len(file_contents) < 100:
        raise HTTPException(
            status_code=400,
            detail="File appears to be empty or corrupted"
        )

    if not file_contents.endswith(b'PAR1'):
        raise HTTPException(
            status_code=400,
            detail="Invalid parquet file format"
        )

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)

@app.get("/api/files")
async def get_file_list() -> List[Dict[str, Any]]:
    try:
        files = file_manager.get_file_list()
        return files
    except Exception as e:
        print(f"Error getting file list: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving file list")

@app.get("/api/data/{file_id}")
async def get_processed_data(file_id: str) -> Dict[str, Any]:
    try:
        data = file_manager.get_processed_data(file_id)
        
        if data is None:
            upload_path = file_manager.uploads_dir / f"{file_id}.parquet"
            if not upload_path.exists():
                raise HTTPException(status_code=404, detail="File not found")
            
            try:
                with open(upload_path, 'rb') as f:
                    file_contents = f.read()
                
                validate_file(file_contents, upload_path.name)
                
                report_data = process_parquet_file(file_contents)
                
                if isinstance(report_data, dict) and "error" in report_data:
                    raise HTTPException(status_code=422, detail=f"Invalid parquet file: {report_data['error']}")
                
                success = file_manager.process_existing_file(file_id, report_data)
                if not success:
                    raise HTTPException(status_code=500, detail="Failed to save processed data")
                
                return report_data
                
            except HTTPException:
                raise
            except Exception as e:
                print(f"Error processing existing file {file_id}: {str(e)}")
                raise HTTPException(status_code=422, detail=f"Invalid parquet file: {str(e)}")
        
        return data
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting processed data: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving processed data")

@app.delete("/api/files/{file_id}")
async def delete_file(file_id: str) -> Dict[str, str]:
    try:
        success = file_manager.delete_file(file_id)
        if success:
            return {"message": "File deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="File not found")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting file: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting file")

@app.get("/api/storage/stats")
async def get_storage_stats() -> Dict[str, Any]:
    try:
        stats = file_manager.get_storage_stats()
        return stats
    except Exception as e:
        print(f"Error getting storage stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving storage statistics")

@app.post("/api/maintenance/cleanup")
async def cleanup_old_files() -> Dict[str, Any]:
    try:
        deleted_count = file_manager.cleanup_old_files(6)
        return {
            "message": f"Cleanup completed",
            "deleted_files": deleted_count
        }
    except Exception as e:
        print(f"Error during cleanup: {str(e)}")
        raise HTTPException(status_code=500, detail="Error during cleanup")

@app.get("/")
def read_root():
    return {"message": "AWS CUR Analyzer Backend is running."}