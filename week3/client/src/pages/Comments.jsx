import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import SearchFilter from '../components/SearchFilter';
import ExportButtons from '../components/ExportButtons';
import { formatDateTime } from '../utils/format';
import { getFieldErrors, validateRequired } from '../utils/validation';

const EXPORT_COLUMNS = [
  { key: 'body', label: 'Comment' },
  { key: 'task_title', label: 'Task' },
  { key: 'created_at', label: 'Created' },
];

const emptyForm = { taskId: '', body: '' };

export default function Comments() {
  const [comments, setComments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [taskFilter, setTaskFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    api.get('/tasks').then((res) => setTasks(res.data.data)).catch(() => {});
  }, []);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (taskFilter) params.taskId = taskFilter;
      const res = await api.get('/comments', { params });
      setComments(res.data.data);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [search, taskFilter]);

  useEffect(() => {
    const t = setTimeout(fetchComments, 300);
    return () => clearTimeout(t);
  }, [fetchComments]);

  const openCreate = () => {
    setEditing(null);
    setForm({ taskId: tasks[0]?.id || '', body: '' });
    setErrors({});
    setServerError('');
    setModalOpen(true);
  };

  const openEdit = (comment) => {
    setEditing(comment);
    setForm({ taskId: comment.task_id, body: comment.body });
    setErrors({});
    setServerError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = getFieldErrors(form, {
      body: (v) => validateRequired(v, 'Comment'),
      taskId: (v) => (!v && !editing ? 'Task is required.' : ''),
    });
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      return;
    }

    try {
      if (editing) {
        await api.put(`/comments/${editing.id}`, { body: form.body });
      } else {
        await api.post('/comments', { taskId: Number(form.taskId), body: form.body });
      }
      setModalOpen(false);
      fetchComments();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Save failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/comments/${id}`);
      fetchComments();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    }
  };

  const taskOptions = tasks.map((t) => ({ value: String(t.id), label: t.title }));
  const exportRows = comments.map((c) => ({
    ...c,
    created_at: formatDateTime(c.created_at),
  }));

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Comments</h1>
        <div className="flex flex-wrap gap-2">
          <ExportButtons title="Comments" columns={EXPORT_COLUMNS} rows={exportRows} />
          <button type="button" onClick={openCreate} className="btn-primary" disabled={!tasks.length}>
            + New Comment
          </button>
        </div>
      </div>

      {!tasks.length && (
        <p className="mb-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          Create a task first before adding comments.
        </p>
      )}

      <SearchFilter
        search={search}
        onSearchChange={setSearch}
        filters={[{ key: 'taskId', label: 'Task', options: taskOptions }]}
        filterValues={{ taskId: taskFilter }}
        onFilterChange={(_, val) => setTaskFilter(val)}
      />

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="py-10 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full min-w-[500px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2 pr-4 font-medium">Comment</th>
                <th className="pb-2 pr-4 font-medium">Task</th>
                <th className="pb-2 pr-4 font-medium">Created</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {comments.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="max-w-xs py-3 pr-4">{c.body}</td>
                  <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{c.task_title}</td>
                  <td className="py-3 pr-4">{formatDateTime(c.created_at)}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEdit(c)} className="text-brand-600 hover:underline dark:text-brand-400">Edit</button>
                      <button type="button" onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!comments.length && (
                <tr><td colSpan={4} className="py-8 text-center text-gray-500">No comments found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} title={editing ? 'Edit Comment' : 'New Comment'} onClose={() => setModalOpen(false)}>
        {serverError && <p className="error-text mb-3">{serverError}</p>}
        <form onSubmit={handleSubmit}>
          {!editing && (
            <FormInput label="Task" name="taskId" as="select" value={String(form.taskId)} onChange={(e) => setForm({ ...form, taskId: e.target.value })} error={errors.taskId} required>
              <option value="">Select task</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </FormInput>
          )}
          <FormInput label="Comment" name="body" as="textarea" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} error={errors.body} required />
          <div className="mt-4 flex gap-2">
            <button type="submit" className="btn-primary">Save</button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
