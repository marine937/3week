import { useState } from 'react';
import api from '../api/client';

export default function FileUpload({ resourceType, resourceId, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('resourceType', resourceType);
    formData.append('resourceId', String(resourceId));

    try {
      const res = await api.post('/files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploaded?.(res.data.data);
      e.target.value = '';
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="label">Upload file</label>
      <input
        type="file"
        onChange={handleChange}
        disabled={uploading}
        className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:text-sm file:text-white hover:file:bg-brand-700 dark:text-gray-400"
      />
      {uploading && <p className="mt-1 text-xs text-gray-500">Uploading...</p>}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
