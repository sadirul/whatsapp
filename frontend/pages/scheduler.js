import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../services/useAuth';
import { scheduleAPI, contactAPI, templateAPI } from '../services/api';
import { formatDate, toISTInputValue, fromISTInputValue } from '../utils/date';

const statusColors = {
  pending: 'bg-amber-100 text-amber-800',
  running: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

export default function SchedulerPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [groups, setGroups] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleAt, setRescheduleAt] = useState('');
  const [form, setForm] = useState({ group_id: '', template_id: '', scheduled_at: '' });
  const [history, setHistory] = useState([]);
  const [historySchedule, setHistorySchedule] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    fetchSchedules();
    fetchGroups();
    fetchTemplates();
  }, [user]);

  const fetchSchedules = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await scheduleAPI.getSchedules();
      if (res.data.success) setSchedules(res.data.schedules || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await contactAPI.getGroups();
      if (res.data.success) setGroups(res.data.groups || []);
    } catch (_) {}
  };

  const fetchTemplates = async () => {
    try {
      const res = await templateAPI.getTemplates();
      if (res.data.success) setTemplates(res.data.templates || []);
    } catch (_) {}
  };

  const handleCreate = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    setForm({
      group_id: '',
      template_id: '',
      scheduled_at: toISTInputValue(now),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.group_id || !form.template_id || !form.scheduled_at) {
      setError('Select group, template and date/time');
      return;
    }
    setError('');
    try {
      await scheduleAPI.createSchedule({
        group_id: Number(form.group_id),
        template_id: Number(form.template_id),
        scheduled_at: fromISTInputValue(form.scheduled_at),
      });
      setSuccess('Schedule created. Run the worker to process: npm run worker');
      setShowModal(false);
      fetchSchedules();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create schedule');
    }
  };

  const handleCancel = async (s) => {
    if (!confirm(`Cancel schedule for ${s.Group?.name}?`)) return;
    setError('');
    try {
      await scheduleAPI.cancelSchedule(s.id);
      setSuccess('Schedule cancelled');
      fetchSchedules();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const handleDelete = async (s) => {
    if (!confirm(`Delete this schedule?`)) return;
    setError('');
    try {
      await scheduleAPI.deleteSchedule(s.id);
      setSuccess('Schedule deleted');
      fetchSchedules();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleReschedule = (s) => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    setRescheduleTarget(s);
    setRescheduleAt(toISTInputValue(now));
    setShowRescheduleModal(true);
  };

  const handleRescheduleSubmit = async (e) => {
    e?.preventDefault();
    if (!rescheduleTarget || !rescheduleAt) return;
    setError('');
    try {
      await scheduleAPI.rescheduleSchedule(rescheduleTarget.id, {
        scheduled_at: fromISTInputValue(rescheduleAt),
      });
      setSuccess('Schedule rescheduled and re-queued');
      setShowRescheduleModal(false);
      fetchSchedules();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reschedule');
    }
  };

  const handleViewHistory = async (s) => {    setHistorySchedule(s);
    try {
      const res = await scheduleAPI.getScheduleHistory(s.id);
      if (res.data.success) setHistory(res.data.history || []);
      setShowHistoryModal(true);
    } catch (err) {
      setError('Failed to load history');
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Scheduler | WPAnyWhere</title>
      </Head>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Scheduler</h2>
            <p className="text-gray-600 mt-1">Schedule messages to contact groups. Run the worker: <code className="bg-gray-100 px-1 rounded">npm run worker</code></p>
          </div>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Schedule
          </button>
        </div>

        {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}
        {success && <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg">{success}</div>}

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto"></div>
              </div>
            ) : schedules.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No schedules yet. Create one to send messages to a contact group.</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Group</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Template</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Scheduled</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Sent / Total</th>
                    <th className="w-32 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s) => (
                    <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{s.Group?.name || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{s.Template?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(s.scheduled_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[s.status] || 'bg-gray-100'}`}>
                          {s.status}
                        </span>
                        {s.status === 'failed' && s.error_message && (
                          <p className="text-xs text-red-500 mt-1 max-w-[160px] truncate" title={s.error_message}>{s.error_message}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {s.status === 'completed' || s.status === 'running' ? (
                          <span className="text-emerald-600 font-medium">{s.sent_count}</span>
                        ) : null}
                        {s.total_contacts > 0 && ` / ${s.total_contacts}`}
                        {s.failed_count > 0 && <span className="text-red-600 ml-1">({s.failed_count} failed)</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {(s.status === 'completed' || s.status === 'running' || s.status === 'failed') && (
                            <button
                              onClick={() => handleViewHistory(s)}
                              className="p-2 rounded-lg hover:bg-blue-100 text-blue-600"
                              title="View history"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          )}
                          {(s.status === 'failed' || s.status === 'cancelled') && (
                            <button
                              onClick={() => handleReschedule(s)}
                              className="p-2 rounded-lg hover:bg-emerald-100 text-emerald-600"
                              title="Reschedule"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          )}
                          {s.status === 'pending' && (
                            <button
                              onClick={() => handleCancel(s)}
                              className="p-2 rounded-lg hover:bg-amber-100 text-amber-600"
                              title="Cancel"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                          {s.status !== 'running' && (
                            <button
                              onClick={() => handleDelete(s)}
                              className="p-2 rounded-lg hover:bg-red-100 text-red-600"
                              title="Delete"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Create Schedule</h3>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Group</label>
                    <select
                      value={form.group_id}
                      onChange={(e) => setForm({ ...form, group_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      <option value="">Select group</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name} ({g.contact_count || 0} contacts)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                    <select
                      value={form.template_id}
                      onChange={(e) => setForm({ ...form, template_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      <option value="">Select template</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                    <input
                      type="datetime-local"
                      value={form.scheduled_at}
                      onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium">Create</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && rescheduleTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowRescheduleModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Reschedule</h3>
              <p className="text-sm text-gray-500 mb-4">
                {rescheduleTarget.Group?.name} → {rescheduleTarget.Template?.name}
              </p>
              <form onSubmit={handleRescheduleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Date & Time</label>
                  <input
                    type="datetime-local"
                    value={rescheduleAt}
                    onChange={(e) => setRescheduleAt(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div className="flex gap-2 mt-6">
                  <button type="button" onClick={() => setShowRescheduleModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium">Reschedule</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowHistoryModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Send History</h3>
              <p className="text-sm text-gray-500">{historySchedule?.Group?.name} • {historySchedule?.Template?.name}</p>
              <p className="text-sm text-gray-500">Sent: {historySchedule?.sent_count} / {historySchedule?.total_contacts} • Failed: {historySchedule?.failed_count}</p>
            </div>
            <div className="overflow-y-auto flex-1">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Mobile</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} className="border-b border-gray-100">
                      <td className="px-4 py-2 font-medium text-gray-800">{h.contact_name || '-'}</td>
                      <td className="px-4 py-2 text-gray-600 font-mono text-sm">{h.mobile}</td>
                      <td className="px-4 py-2">
                        <span className={h.status === 'sent' ? 'text-emerald-600' : 'text-red-600'}>{h.status}</span>
                        {h.error_message && <span className="block text-xs text-red-500 truncate max-w-xs" title={h.error_message}>{h.error_message}</span>}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">{formatDate(h.sent_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t">
              <button onClick={() => setShowHistoryModal(false)} className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
