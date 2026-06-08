import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import FileUpload from '../components/FileUpload';
import { formatDateTime } from '../utils/format';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    api
      .get('/files', { params: { resourceType: 'user', resourceId: user.id } })
      .then((res) => setFiles(res.data.data))
      .catch(() => {});
  }, [user?.id]);

  const handleAvatarUpload = async (fileData) => {
    setFiles((prev) => [fileData, ...prev]);
    const res = await api.get('/auth/me');
    setUser(res.data.data);
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Profile</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center gap-4">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="h-20 w-20 rounded-full object-cover ring-2 ring-brand-500"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Member since {formatDateTime(user?.created_at)}
          </p>
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold">Profile picture</h2>
          <FileUpload
            resourceType="user"
            resourceId={user?.id}
            onUploaded={handleAvatarUpload}
          />
          <ul className="mt-4 space-y-2">
            {files.map((f) => (
              <li key={f.id} className="text-sm text-gray-600 dark:text-gray-400">
                {f.original_name} ({(f.size / 1024).toFixed(1)} KB)
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
