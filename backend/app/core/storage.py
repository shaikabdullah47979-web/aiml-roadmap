import os
import uuid
import shutil
from typing import Tuple
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

class StorageService:
    def __init__(self):
        self.firebase_initialized = False
        self._init_firebase()

    def _init_firebase(self):
        if settings.FIREBASE_CREDENTIALS_PATH and settings.FIREBASE_STORAGE_BUCKET:
            try:
                import firebase_admin
                from firebase_admin import credentials, storage
                
                if not firebase_admin._apps:
                    cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
                    firebase_admin.initialize_app(cred, {
                        'storageBucket': settings.FIREBASE_STORAGE_BUCKET
                    })
                self.bucket = storage.bucket()
                self.firebase_initialized = True
                print("Firebase Storage initialized successfully.")
            except Exception as e:
                print(f"Firebase initialization skipped or failed: {e}. Falling back to local storage.")
                self.firebase_initialized = False

    async def save_file(self, file: UploadFile) -> Tuple[str, str, int]:
        """
        Validates and saves the uploaded file.
        Returns: (file_url_or_path, safe_file_name, file_size_bytes)
        """
        original_filename = file.filename or "unnamed_document"
        _, ext = os.path.splitext(original_filename)
        ext = ext.lower()

        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File extension '{ext}' is not permitted. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )

        # Generate unique safe file name
        unique_id = str(uuid.uuid4())
        safe_filename = f"{unique_id}{ext}"
        local_dest_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

        # Write file contents and check size limit
        file_size = 0
        chunk_size = 1024 * 1024  # 1MB chunks

        with open(local_dest_path, "wb") as buffer:
            while chunk := await file.read(chunk_size):
                file_size += len(chunk)
                if file_size > settings.MAX_FILE_SIZE_BYTES:
                    buffer.close()
                    if os.path.exists(local_dest_path):
                        os.remove(local_dest_path)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File size exceeds the 50MB limit ({file_size} bytes)."
                    )
                buffer.write(chunk)

        # If Firebase is active, upload to cloud bucket
        if self.firebase_initialized:
            try:
                blob = self.bucket.blob(f"materials/{safe_filename}")
                blob.upload_from_filename(local_dest_path)
                blob.make_public()
                cloud_url = blob.public_url
                return cloud_url, safe_filename, file_size
            except Exception as e:
                print(f"Cloud upload error: {e}. Falling back to local storage path.")

        # Local storage relative URL
        local_url = f"/uploads/{safe_filename}"
        return local_url, safe_filename, file_size

    def delete_file(self, file_name: str):
        """Removes the file from disk or cloud storage."""
        if not file_name:
            return
        
        # Local cleanup
        local_path = os.path.join(settings.UPLOAD_DIR, file_name)
        if os.path.exists(local_path):
            try:
                os.remove(local_path)
            except Exception:
                pass

        # Cloud cleanup
        if self.firebase_initialized:
            try:
                blob = self.bucket.blob(f"materials/{file_name}")
                if blob.exists():
                    blob.delete()
            except Exception:
                pass

storage_service = StorageService()

