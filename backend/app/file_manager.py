import os
import json
import uuid
import shutil
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from pathlib import Path

class FileManager:
    
    def __init__(self, storage_root: str = "/app/storage"):
        self.storage_root = Path(storage_root)
        self.uploads_dir = self.storage_root / "uploads"
        self.processed_dir = self.storage_root / "processed"
        self.metadata_file = self.storage_root / "metadata.json"
        
        self.storage_root.mkdir(exist_ok=True)
        self.uploads_dir.mkdir(exist_ok=True)
        self.processed_dir.mkdir(exist_ok=True)
        
        if not self.metadata_file.exists():
            self._save_metadata([])
    
    def _load_metadata(self) -> List[Dict[str, Any]]:
        try:
            with open(self.metadata_file, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []
    
    def _save_metadata(self, metadata: List[Dict[str, Any]]) -> None:
        with open(self.metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2, default=str)
    
    def save_file(self, file_contents: bytes, original_filename: str, processed_data: Dict[str, Any]) -> str:
        file_id = str(uuid.uuid4())
        
        upload_path = self.uploads_dir / f"{file_id}.parquet"
        processed_path = self.processed_dir / f"{file_id}.json"
        
        with open(upload_path, 'wb') as f:
            f.write(file_contents)
        
        with open(processed_path, 'w') as f:
            json.dump(processed_data, f, indent=2, default=str)
        
        metadata = self._load_metadata()
        file_info = {
            'id': file_id,
            'original_filename': original_filename,
            'upload_date': datetime.now().isoformat(),
            'file_size': len(file_contents),
            'processed': True
        }
        metadata.append(file_info)
        self._save_metadata(metadata)
        
        return file_id
    
    def process_existing_file(self, file_id: str, processed_data: Dict[str, Any]) -> bool:
        upload_path = self.uploads_dir / f"{file_id}.parquet"
        
        if not upload_path.exists():
            return False
        
        processed_path = self.processed_dir / f"{file_id}.json"
        
        with open(processed_path, 'w') as f:
            json.dump(processed_data, f, indent=2, default=str)
        
        metadata = self._load_metadata()
        file_stats = upload_path.stat()
        
        file_info = None
        for i, item in enumerate(metadata):
            if item['id'] == file_id:
                file_info = item
                break
        
        if file_info is None:
            file_info = {
                'id': file_id,
                'original_filename': upload_path.name,
                'upload_date': datetime.fromtimestamp(file_stats.st_mtime).isoformat(),
                'file_size': file_stats.st_size,
            }
            metadata.append(file_info)
        
        file_info['processed'] = True
        file_info['last_processed'] = datetime.now().isoformat()
        self._save_metadata(metadata)
        
        return True
    
    def get_file_list(self) -> List[Dict[str, Any]]:
        parquet_files = list(self.uploads_dir.glob("*.parquet"))
        
        existing_metadata = {item['id']: item for item in self._load_metadata()}
        
        file_list = []
        
        for parquet_file in parquet_files:
            file_id = parquet_file.stem
            file_stats = parquet_file.stat()
            
            if file_id in existing_metadata:
                file_info = existing_metadata[file_id].copy()
            else:
                file_info = {
                    'id': file_id,
                    'original_filename': parquet_file.name,
                    'upload_date': datetime.fromtimestamp(file_stats.st_mtime).isoformat(),
                    'file_size': file_stats.st_size,
                    'processed': False
                }
            
            file_info['file_size'] = file_stats.st_size
            file_info['last_modified'] = datetime.fromtimestamp(file_stats.st_mtime).isoformat()
            
            file_list.append(file_info)
        
        return sorted(file_list, key=lambda x: x.get('last_modified', x.get('upload_date', '')), reverse=True)
    
    def get_processed_data(self, file_id: str) -> Optional[Dict[str, Any]]:
        processed_path = self.processed_dir / f"{file_id}.json"
        
        if not processed_path.exists():
            return None
        
        try:
            with open(processed_path, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return None
    
    def delete_file(self, file_id: str) -> bool:
        upload_path = self.uploads_dir / f"{file_id}.parquet"
        processed_path = self.processed_dir / f"{file_id}.json"
        
        success = True
        if upload_path.exists():
            upload_path.unlink()
        if processed_path.exists():
            processed_path.unlink()
        
        metadata = self._load_metadata()
        metadata = [f for f in metadata if f['id'] != file_id]
        self._save_metadata(metadata)
        
        return success
    
    def cleanup_old_files(self, max_age_months: int = 6) -> int:
        cutoff_date = datetime.now() - timedelta(days=max_age_months * 30)
        metadata = self._load_metadata()
        
        files_to_delete = []
        for file_info in metadata:
            upload_date = datetime.fromisoformat(file_info['upload_date'])
            if upload_date < cutoff_date:
                files_to_delete.append(file_info['id'])
        
        deleted_count = 0
        for file_id in files_to_delete:
            if self.delete_file(file_id):
                deleted_count += 1
        
        return deleted_count
    
    def get_storage_stats(self) -> Dict[str, Any]:
        metadata = self._load_metadata()
        
        total_files = len(metadata)
        total_size = sum(f.get('file_size', 0) for f in metadata)
        
        return {
            'total_files': total_files,
            'total_size_bytes': total_size,
            'total_size_mb': round(total_size / (1024 * 1024), 2),
            'oldest_file': min((f['upload_date'] for f in metadata), default=None),
            'newest_file': max((f['upload_date'] for f in metadata), default=None)
        }