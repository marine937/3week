import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import SearchFilter from '../components/SearchFilter';
import ExportButtons from '../components/ExportButtons';
import FileUpload from '../components/FileUpload';
import { capitalize, formatDate, statusBadgeClass } from '../utils/format';
import { getFieldErrors, validateRequired } from '../utils/validation';

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
];

const EXPORT_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'description', label: 'Description' },
  { key: 'created_at', label: 'Created' },
];

const emptyForm = { name: '', description: '', status: 'planning' };

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [filesProjectId, setFilesProjectId] = useState(null);
  const [files, setFiles] = useState([]);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/projects', { params });
      setProjects(res.data.data);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(fetchProjects, 300);
    return () => clearTimeout(t);
  }, [fetchProjects]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setServerError('');
    setModalOpen(true);
  };

  const openEdit = (project) => {
    setEditing(project);
    setForm({
      name: project.name,
      description: project.description || '',
      status: project.status,
    });
    setErrors({});
    setServerError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = getFieldErrors(form, {
      name: (v) => validateRequired(v, 'Name'),
    });
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      return;
    }

    try {
      if (editing) {
        await api.put(`/projects/${editing.id}`, form);
      } else {
        await api.post('/projects', form);
      }
      setModalOpen(false);
      fetchProjects();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Save failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    }
  };

  const loadFiles = async (projectId) => {
    setFilesProjectId(projectId);
    const res = await api.get('/files', { params: { resourceType: 'project', resourceId: projectId } });
    setFiles(res.data.data);
  };

  const exportRows = projects.map((p) => ({
    ...p,
    status: capitalize(p.status),
    created_at: formatDate(p.created_at),
  }));

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <div className="flex flex-wrap gap-2">
          <ExportButtons title="Projects" columns={EXPORT_COLUMNS} rows={exportRows} />
          <button type="button" onClick={openCreate} className="btn-primary">
            + New Project
          </button>
        </div>
      </div>

      <SearchFilter
        search={search}
        onSearchChange={setSearch}
        filters={[{ key: 'status', label: 'Status', options: STATUS_OPTIONS }]}
        filterValues={{ status: statusFilter }}
        onFilterChange={(_, val) => setStatusFilter(val)}
      />

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="py-10 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 pr-4 font-medium">Created</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{p.name}</div>
                    {p.description && (
                      <div className="text-xs text-gray-500 line-clamp-1">{p.description}</div>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(p.status)}`}>
                      {capitalize(p.status)}
                    </span>
                  </td>
                  <td className="py-3 pr-4">{formatDate(p.created_at)}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => openEdit(p)} className="text-brand-600 hover:underline dark:text-brand-400">
                        Edit
                      </button>
                      <button type="button" onClick={() => loadFiles(p.id)} className="text-gray-600 hover:underline dark:text-gray-400">
                        Files
                      </button>
                      <button type="button" onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!projects.length && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">No projects found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} title={editing ? 'Edit Project' : 'New Project'} onClose={() => setModalOpen(false)}>
        {serverError && <p className="error-text mb-3">{serverError}</p>}
        <form onSubmit={handleSubmit}>
          <FormInput label="Name" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} required />
          <FormInput label="Description" name="description" as="textarea" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <FormInput label="Status" name="status" as="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </FormInput>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="btn-primary">Save</button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!filesProjectId} title="Project Files" onClose={() => setFilesProjectId(null)}>
        <FileUpload resourceType="project" resourceId={filesProjectId} onUploaded={(f) => setFiles((prev) => [f, ...prev])} />
        <ul className="mt-4 space-y-2">
          {files.map((f) => (
            <li key={f.id} className="flex items-center justify-between text-sm">
              <a href={f.url} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline dark:text-brand-400">
                {f.original_name}
              </a>
              <span className="text-gray-500">{(f.size / 1024).toFixed(1)} KB</span>
            </li>
          ))}
          {!files.length && <li className="text-sm text-gray-500">No files uploaded.</li>}
        </ul>
      </Modal>
    </div>
  );
}
