import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import apiClient from '../api/client';
import type { Question } from '../types';
import {
  Plus, Edit, Trash2, Save, X, BookOpen, Users, BarChart3,
  Search, Shield, UserX, UserCheck, TrendingUp, FileText, Target,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';

const TYPES = ['综合分析', '人际关系', '组织策划', '应急应变', '自我认知', '行政实务', '情景模拟', '即时表达', '无领导小组'];

const SUBTYPES: Record<string, string[]> = {
  综合分析: ['态度观点-单观点', '态度观点-双观点', '态度观点-多观点', '社会现象-正面', '社会现象-负面', '社会现象-辩证', '寓言故事', '漫画分析'],
  人际关系: ['与群众的关系', '与领导的关系', '与同事的关系', '与下属的关系', '与其他单位的关系', '与亲友的关系'],
  组织策划: ['调研类', '活动培训类', '宣传类', '会议类', '评选类'],
  应急应变: ['一般性突发事件', '公共安全突发事件'],
  自我认知: ['岗位匹配', '职业态度', '压力应对'],
  行政实务: ['公务接待', '协调解决', '文书起草', '事务安排'],
  情景模拟: ['咨询服务模拟', '矛盾调解模拟', '劝说沟通模拟'],
  即时表达: ['模拟演讲', '串词造句', '会议发言'],
  无领导小组: ['开放式问题', '两难问题', '多项选择题', '排序题', '资源争夺题'],
};
const TABS = [
  { key: 'questions', label: '题库管理', icon: BookOpen },
  { key: 'users', label: '用户管理', icon: Users },
  { key: 'stats', label: '数据统计', icon: BarChart3 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Admin() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState('questions');

  // 权限检查
  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/dashboard');
  }, [user, navigate]);

  if (user?.role !== 'admin') return null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">👨‍💼 管理后台</h2>

      {/* Tab 导航 */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
              tab === key
                ? 'bg-white dark:bg-slate-700 text-primary-700 dark:text-primary-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      {tab === 'questions' && <QuestionManager />}
      {tab === 'users' && <UserManager />}
      {tab === 'stats' && <StatsDashboard />}
    </div>
  );
}

// ==================== 题库管理 ====================
function QuestionManager() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);
  const [filters, setFilters] = useState({ type: '', search: '', page: 1, status: '' });

  const fetchQuestions = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.search) params.set('search', filters.search);
    if (filters.status) params.set('status', filters.status);
    params.set('page', String(filters.page));
    params.set('limit', '15');
    apiClient.get(`/admin/questions?${params}`).then((r) => {
      setQuestions(r.data.data.list);
      setTotal(r.data.data.total);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchQuestions(); }, [filters]);

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除？')) return;
    await apiClient.delete(`/admin/questions/${id}`);
    fetchQuestions();
  };

  return (
    <div className="space-y-4">
      {/* 筛选 + 新增 */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
          className="input-field dark:bg-slate-800 dark:border-slate-600 w-auto">
          <option value="">全部题型</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          className="input-field dark:bg-slate-800 dark:border-slate-600 w-auto">
          <option value="">全部状态</option>
          <option value="published">已发布</option>
          <option value="draft">草稿</option>
          <option value="archived">已归档</option>
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" className="input-field dark:bg-slate-800 dark:border-slate-600 pl-9"
            placeholder="搜索题目..." value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} />
        </div>
        <button onClick={() => { setShowForm(true); setEditQuestion(null); }}
          className="btn-primary text-sm flex items-center gap-2">
          <Plus size={16} /> 新增题目
        </button>
      </div>

      {/* 新建/编辑表单 */}
      {showForm && (
        <QuestionForm
          question={editQuestion}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchQuestions(); }}
        />
      )}

      {/* 表格 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
        {loading ? (
          <div className="animate-pulse p-6 space-y-3"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded" /><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded" /></div>
        ) : questions.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-10">暂无题目</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                <th className="py-3 px-3 font-medium text-slate-500 w-14">ID</th>
                <th className="py-3 px-3 font-medium text-slate-500">题型</th>
                <th className="py-3 px-3 font-medium text-slate-500">题目摘要</th>
                <th className="py-3 px-3 font-medium text-slate-500 w-16">难度</th>
                <th className="py-3 px-3 font-medium text-slate-500 w-20">状态</th>
                <th className="py-3 px-3 font-medium text-slate-500 w-28 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="py-2.5 px-3 text-slate-400">{q.id}</td>
                  <td className="py-2.5 px-3"><span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700">{q.type}</span></td>
                  <td className="py-2.5 px-3 truncate max-w-48">{q.content}</td>
                  <td className="py-2.5 px-3">{q.difficulty ? '★'.repeat(q.difficulty) : '—'}</td>
                  <td className="py-2.5 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      q.status === 'published' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                      q.status === 'draft' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                      {q.status === 'published' ? '发布' : q.status === 'draft' ? '草稿' : '归档'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button onClick={() => { setEditQuestion(q); setShowForm(true); }}
                      className="p-1.5 text-slate-400 hover:text-primary-600"><Edit size={15} /></button>
                    <button onClick={() => handleDelete(q.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {total > 15 && (
          <div className="flex justify-center gap-2 p-4">
            {Array.from({ length: Math.ceil(total / 15) }, (_, i) => (
              <button key={i} onClick={() => setFilters({ ...filters, page: i + 1 })}
                className={`w-8 h-8 rounded-lg text-sm ${filters.page === i + 1 ? 'bg-primary-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== 题目表单 ====================
function QuestionForm({ question, onClose, onSaved }: {
  question: Question | null; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    type: question?.type ?? '综合分析',
    subtype: question?.subtype ?? '',
    content: question?.content ?? '',
    modelAnswer: question?.modelAnswer ?? '',
    difficulty: question?.difficulty ?? 3,
    status: question?.status ?? 'published',
    sourceYear: question?.sourceYear ?? new Date().getFullYear(),
    sourceRegion: question?.sourceRegion ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim()) return;
    setSaving(true);
    try {
      if (question) {
        await apiClient.put(`/admin/questions/${question.id}`, form);
      } else {
        await apiClient.post('/admin/questions', form);
      }
      onSaved();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      alert(msg ?? '保存失败');
    } finally { setSaving(false); }
  };

  return (
    <div className="card dark:bg-slate-800 dark:border-slate-700 border-2 border-primary-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{question ? '编辑题目' : '新增题目'}</h3>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700"><X size={18} /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, subtype: '' })}
            className="input-field dark:bg-slate-700 dark:border-slate-600">
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={form.subtype} onChange={(e) => setForm({ ...form, subtype: e.target.value })}
            className="input-field dark:bg-slate-700 dark:border-slate-600 lg:col-span-2">
            <option value="">子分类（可选）</option>
            {(SUBTYPES[form.type] ?? []).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) })}
            className="input-field dark:bg-slate-700 dark:border-slate-600">
            {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{'★'.repeat(d)}</option>)}
          </select>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="input-field dark:bg-slate-700 dark:border-slate-600">
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
            <option value="archived">已归档</option>
          </select>
        </div>
        <textarea className="input-field dark:bg-slate-700 dark:border-slate-600 min-h-[80px]" placeholder="题目内容 *"
          value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
        <textarea className="input-field dark:bg-slate-700 dark:border-slate-600 min-h-[100px]" placeholder="参考答案"
          value={form.modelAnswer} onChange={(e) => setForm({ ...form, modelAnswer: e.target.value })} />
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
            <Save size={15} /> {saving ? '保存中...' : '保存'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary text-sm">取消</button>
        </div>
      </form>
    </div>
  );
}

// ==================== 用户管理 ====================
function UserManager() {
  const [users, setUsers] = useState<unknown[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', role: '', status: '', page: 1 });

  const fetchUsers = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.role && filters.role !== 'all') params.set('role', filters.role);
    if (filters.status && filters.status !== 'all') params.set('status', filters.status);
    params.set('page', String(filters.page));
    params.set('limit', '20');
    apiClient.get(`/admin/users?${params}`).then((r) => {
      setUsers(r.data.data.list);
      setTotal(r.data.data.total);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [filters]);

  const handleStatusChange = async (id: number, status: string) => {
    await apiClient.put(`/admin/users/${id}`, { status });
    fetchUsers();
  };

  const statusLabel = (s: string) => s === 'active' ? '正常' : s === 'banned' ? '封禁' : '停用';
  const statusColor = (s: string) => s === 'active' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
    s === 'banned' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
    'bg-slate-100 text-slate-500';

  return (
    <div className="space-y-4">
      {/* 筛选 */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" className="input-field dark:bg-slate-800 dark:border-slate-600 pl-9"
            placeholder="搜索邮箱或昵称..." value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} />
        </div>
        <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}
          className="input-field dark:bg-slate-800 dark:border-slate-600 w-auto">
          <option value="">全部角色</option>
          <option value="admin">管理员</option>
          <option value="user">普通用户</option>
        </select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          className="input-field dark:bg-slate-800 dark:border-slate-600 w-auto">
          <option value="">全部状态</option>
          <option value="active">正常</option>
          <option value="banned">封禁</option>
          <option value="inactive">停用</option>
        </select>
      </div>

      {/* 用户表格 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
        {loading ? (
          <div className="animate-pulse p-6 space-y-3"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded" /><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                <th className="py-3 px-3 font-medium text-slate-500">ID</th>
                <th className="py-3 px-3 font-medium text-slate-500">昵称</th>
                <th className="py-3 px-3 font-medium text-slate-500">邮箱</th>
                <th className="py-3 px-3 font-medium text-slate-500">角色</th>
                <th className="py-3 px-3 font-medium text-slate-500">状态</th>
                <th className="py-3 px-3 font-medium text-slate-500">练习/考试</th>
                <th className="py-3 px-3 font-medium text-slate-500">注册时间</th>
                <th className="py-3 px-3 font-medium text-slate-500 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {(users as { id: number; nickname: string; email: string; role: string; status: string;
                _count: { practiceRecords: number; examRecords: number }; createdAt: string; lastLoginAt: string }[]).map((u) => (
                <tr key={u.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="py-2.5 px-3 text-slate-400">{u.id}</td>
                  <td className="py-2.5 px-3 font-medium">{u.nickname ?? '—'}</td>
                  <td className="py-2.5 px-3 text-slate-500 text-xs">{u.email}</td>
                  <td className="py-2.5 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-slate-100 dark:bg-slate-700'}`}>
                      {u.role === 'admin' ? '管理员' : '用户'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(u.status)}`}>
                      {statusLabel(u.status)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-slate-500">
                    {u._count.practiceRecords} / {u._count.examRecords}
                  </td>
                  <td className="py-2.5 px-3 text-xs text-slate-400">{u.createdAt?.slice(0, 10)}</td>
                  <td className="py-2.5 px-3 text-right">
                    {u.status !== 'banned' ? (
                      <button onClick={() => handleStatusChange(u.id, 'banned')}
                        className="p-1.5 text-slate-400 hover:text-red-600" title="封禁">
                        <UserX size={15} />
                      </button>
                    ) : (
                      <button onClick={() => handleStatusChange(u.id, 'active')}
                        className="p-1.5 text-slate-400 hover:text-green-600" title="解封">
                        <UserCheck size={15} />
                      </button>
                    )}
                    <button onClick={() => handleStatusChange(u.id, u.status === 'active' ? 'inactive' : 'active')}
                      className="p-1.5 text-slate-400 hover:text-amber-600" title="切换停用">
                      <Shield size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {total > 20 && (
          <div className="flex justify-center gap-2 p-4">
            {Array.from({ length: Math.ceil(total / 20) }, (_, i) => (
              <button key={i} onClick={() => setFilters({ ...filters, page: i + 1 })}
                className={`w-8 h-8 rounded-lg text-sm ${filters.page === i + 1 ? 'bg-primary-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== 数据统计 ====================
function StatsDashboard() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/admin/stats').then((r) => {
      setStats(r.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="card dark:bg-slate-800 animate-pulse"><div className="h-64 bg-slate-200 dark:bg-slate-700 rounded" /></div>;
  if (!stats) return <p className="text-slate-500 text-center py-10">加载失败</p>;

  const overview = stats.overview as Record<string, number>;
  const questionTypes = (stats.questionTypes as { type: string; count: number }[]) || [];
  const userGrowth = (stats.userGrowth as { month: string; count: number }[]) || [];
  const hotQuestions = (stats.hotQuestions as { id: number; type: string; content: string; practiceCount: number; avgScore: number | null }[]) || [];

  const statCards = [
    { label: '总用户', value: overview.totalUsers, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: '活跃用户(30天)', value: (stats.activeUserCount as number) ?? 0, icon: Target, color: 'bg-green-100 text-green-600' },
    { label: '题目总数', value: overview.totalQuestions, icon: BookOpen, color: 'bg-purple-100 text-purple-600' },
    { label: '考试次数', value: overview.totalExams, icon: FileText, color: 'bg-amber-100 text-amber-600' },
    { label: '练习次数', value: overview.totalPractices, icon: TrendingUp, color: 'bg-cyan-100 text-cyan-600' },
  ];

  return (
    <div className="space-y-6">
      {/* 概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card dark:bg-slate-800 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 图表区 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 题型分布 */}
        <div className="card dark:bg-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">📊 各题型题目分布</h3>
          {questionTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={questionTypes} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={90} label={({ type, count }) => `${type} (${count})`}>
                  {questionTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-400 text-sm text-center py-20">暂无数据</p>}
        </div>

        {/* 用户增长趋势 */}
        <div className="card dark:bg-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">📈 用户增长趋势</h3>
          {userGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="新增用户" />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-400 text-sm text-center py-20">暂无数据</p>}
        </div>
      </div>

      {/* 热门题目 TOP10 */}
      <div className="card dark:bg-slate-800">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">🔥 热门题目 TOP10</h3>
        {hotQuestions.length > 0 ? (
          <div className="space-y-2">
            {hotQuestions.map((q, i) => (
              <div key={q.id} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                  {i + 1}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700">{q.type}</span>
                <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate">{q.content}</span>
                <span className="text-xs text-slate-400">练习 {q.practiceCount} 次</span>
                {q.avgScore != null && <span className="text-xs text-primary-500">均分 {q.avgScore}</span>}
              </div>
            ))}
          </div>
        ) : <p className="text-slate-400 text-sm text-center py-10">暂无数据</p>}
      </div>
    </div>
  );
}
