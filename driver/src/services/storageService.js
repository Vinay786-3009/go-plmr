import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

export const storageService = {
  /**
   * Upload a driver document or profile image
   * @param {string} uid - Driver Auth UID
   * @param {File|Blob} file - The file to upload
   * @param {string} category - 'profile' | 'license' | 'rc' | 'insurance' | 'aadhar'
   * @param {function} onProgress - Optional callback for upload progress (0-100)
   * @returns {Promise<string>} Download URL
   */
  async uploadDriverDocument(uid, file, category = 'document', onProgress = null) {
    if (!uid) throw new Error("Driver UID is required for upload.");
    if (!file) throw new Error("No file selected for upload.");

    // Validate size (max 5MB)
    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      throw new Error(`File size exceeds ${MAX_SIZE_MB}MB limit. Please choose a smaller image or PDF.`);
    }

    const timestamp = Date.now();
    const cleanFileName = file.name ? file.name.replace(/[^a-zA-Z0-9._-]/g, '') : 'upload';
    const filePath = `drivers/${uid}/${category}/${timestamp}_${cleanFileName}`;
    const storageRef = ref(storage, filePath);

    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type || 'application/octet-stream',
      customMetadata: {
        driverUid: uid,
        category: category,
        uploadedAt: new Date().toISOString()
      }
    });

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(Math.round(progress));
        },
        (error) => {
          console.error(`Storage upload error for ${category}:`, error);
          reject(error);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  }
};
