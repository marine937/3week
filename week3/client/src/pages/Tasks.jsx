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
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const EXPORT_COLUMNS = [
  { key: 'title', label: 'Title' },
  { key: 'project_name', label: 'Project' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'due_date', label: 'Due Date' },
];

const emptyForm = {
  projectId: '',
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [filesTaskId, setFilesTaskId] = useState(null);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    api.get('/projects').then((res) => setProjects(res.data.data)).catch(() => {});
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (projectFilter) params.projectId = projectFilter;
      const res = await api.get('/tasks', { params });
      setTasks(res.data.data);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, projectFilter]);

  useEffect(() => {
    const t = setTimeout(fetchTasks, 300);
    return () => clearTimeout(t);
  }, [fetchTasks]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, projectId: projects[0]?.id || '' });
    setErrors({});
    setServerError('');
    setModalOpen(true);
  };

  const openEdit = (task) => {
    setEditing(task);
    setForm({
      projectId: task.project_id,
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date ? task.due_date.slice(0, 10) : '',
    });
    setErrors({});
    setServerError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = getFieldErrors(form, {
      title: (v) => validateRequired(v, 'Title'),
      projectId: (v) => (!v ? 'Project is required.' : ''),
    });
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      return;
    }

    const payload = {
      projectId: Number(form.projectId),
      title: form.title,
      description: form.description,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || null,
    };

    try {
      if (editing) {
        await api.put(`/tasks/${editing.id}`, payload);
      } else {
        await api.post('/tasks', payload);
      }
      setModalOpen(false);
      fetchTasks();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Save failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    }
  };

  const loadFiles = async (taskId) => {
    setFilesTaskId(taskId);
    const res = await api.get('/files', { params: { resourceType: 'task', resourceId: taskId } });
    setFiles(res.data.data);
  };

  const projectOptions = projects.map((p) => ({ value: String(p.id), label: p.name }));

  const exportRows = tasks.map((t) => ({
    ...t,
    status: capitalize(t.status),
    priority: capitalize(t.priority),
    due_date: formatDate(t.due_date),
  }));

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <div className="flex flex-wrap gap-2">
          <ExportButtons title="Tasks" columns={EXPORT_COLUMNS} rows={exportRows} />
          <button type="button" onClick={openCreate} className="btn-primary" disabled={!projects.length}>
            + New Task
          </button>
        </div>
      </div>

      {!projects.length && (
        <p className="mb-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          Create a project first before adding tasks.
        </p>
      )}

      <SearchFilter
        search={search}
        onSearchChange={setSearch}
        filters={[
          { key: 'status', label: 'Status', options: STATUS_OPTIONS },
          { key: 'priority', label: 'Priority', options: PRIORITY_OPTIONS },
          { key: 'projectId', label: 'Project', options: projectOptions },
        ]}
        filterValues={{ status: statusFilter, priority: priorityFilter, projectId: projectFilter }}
        onFilterChange={(key, val) => {
          if (key === 'status') setStatusFilter(val);
          if (key === 'priority') setPriorityFilter(val);
          if (key === 'projectId') setProjectFilter(val);
        }}
      />

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="py-10 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2 pr-4 font-medium">Title</th>
                <th className="pb-2 pr-4 font-medium">Project</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 pr-4 font-medium">Priority</th>
                <th className="pb-2 pr-4 font-medium">Due</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 pr-4 font-medium">{t.title}</td>
                  <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{t.project_name}</td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(t.status)}`}>
                      {capitalize(t.status)}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(t.priority)}`}>
                      {capitalize(t.priority)}
                    </span>
                  </td>
                  <td className="py-3 pr-4">{formatDate(t.due_date)}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => openEdit(t)} className="text-brand-600 hover:underline dark:text-brand-400">Edit</button>
                      <button type="button" onClick={() => loadFiles(t.id)} className="text-gray-600 hover:underline dark:text-gray-400">Files</button>
                      <button type="button" onClick={() => handleDelete(t.id)} className="text-red-600 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!tasks.length && (
                <tr><td colSpan={6} className="py-8 text-center text-gray-500">No tasks found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} title={editing ? 'Edit Task' : 'New Task'} onClose={() => setModalOpen(false)}>
        {serverError && <p className="error-text mb-3">{serverError}</p>}
        <form onSubmit={handleSubmit}>
          <FormInput label="Project" name="projectId" as="select" value={String(form.projectId)} onChange={(e) => setForm({ ...form, projectId: e.target.value })} error={errors.projectId} required>
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </FormInput>
          <FormInput label="Title" name="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={errors.title} required />
          <FormInput label="Description" name="description" as="textarea" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput label="Status" name="status" as="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </FormInput>
            <FormInput label="Priority" name="priority" as="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </FormInput>
          </div>
          <FormInput label="Due date" name="dueDate" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <div className="mt-4 flex gap-2">
            <button type="submit" className="btn-primary">Save</button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!filesTaskId} title="Task Files" onClose={() => setFilesTaskId(null)}>
        <FileUpload resourceType="task" resourceId={filesTaskId} onUploaded={(f) => setFiles((prev) => [f, ...prev])} />
        <ul className="mt-4 space-y-2">
          {files.map((f) => (
            <li key={f.id} className="flex items-center justify-between text-sm">
              <a href={f.url} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline dark:text-brand-400">{f.original_name}</a>
              <span className="text-gray-500">{(f.size / 1024).toFixed(1)} KB</span>
            </li>
          ))}
          {!files.length && <li className="text-sm text-gray-500">No files uploaded.</li>}
        </ul>
      </Modal>
    </div>
  );
}
