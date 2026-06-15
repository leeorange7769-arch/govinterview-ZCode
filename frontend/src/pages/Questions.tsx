import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import type { Question } from '../types';
import { useAuthStore } from '../stores/authStore';
import {
  Search, Grid3X3, List, Star, ChevronRight,
  Plus, Edit, Trash2, Save, X,
} from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  综合分析: 'bg-primary-50 text-primary-500',
  人际关系: 'bg-sage-50 text-sage-500',
  组织策划: 'bg-accent-50 text-accent-500',
  应急应变: 'bg-warm-50 text-warm-500',
  自我认知: 'bg-lavender-50 text-lavender-500',
  行政实务: 'bg-amber-50 text-amber-600',
  情景模拟: 'bg-rose-50 text-rose-500',
  即时表达: 'bg-cyan-50 text-cyan-600',
  无领导小组: 'bg-indigo-50 text-indigo-500',
};

const TYPES = ['综合分析', '人际关系', '组织策划', '应急应变', '自我认知', '行政实务', '情景模拟', '即时表达', '无领导小组'];

const SUBTYPES: Record<string, string[]> = {
  综合分析: [
    '态度观点-单观点', '态度观点-双观点', '态度观点-多观点',
    '社会现象-正面', '社会现象-负面', '社会现象-辩证',
    '寓言故事', '漫画分析',
  ],
  人际关系: [
    '与群众的关系', '与领导的关系', '与同事的关系',
    '与下属的关系', '与其他单位的关系', '与亲友的关系',
  ],
  组织策划: [
    '调研类', '活动培训类', '宣传类', '会议类', '评选类',
  ],
  应急应变: [
    '一般性突发事件', '公共安全突发事件',
  ],
  自我认知: [
    '岗位匹配', '职业态度', '压力应对',
  ],
  行政实务: [
    '公务接待', '协调解决', '文书起草', '事务安排',
  ],
  情景模拟: [
    '咨询服务模拟', '矛盾调解模拟', '劝说沟通模拟',
  ],
  即时表达: [
    '模拟演讲', '串词造句', '会议发言',
  ],
  无领导小组: [
    '开放式问题', '两难问题', '多项选择题', '排序题', '资源争夺题',
  ],
};

export default function Questions() {
  const { user } = useAuthStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [types, setTypes] = useState<{ name: string; children: { name: string; count: number }[] }[]>([]);
  const [filters, setFilters] = useState({ type: '', subtype: '', difficulty: '', search: '', page: 1 });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 管理员新建/编辑
  const [showForm, setShowForm] = useState(false);
  const [editQ, setEditQ] = useState<Question | null>(null);
  const [form, setForm] = useState({ type: '综合分析', subtype: '', content: '', modelAnswer: '', difficulty: 3, status: 'published' as string });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.get('/questions/types').then((r) => setTypes(r.data.data)).catch(() => {});
  }, []);

  const fetchQuestions = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.subtype) params.set('subtype', filters.subtype);
    if (filters.difficulty) params.set('difficulty', filters.difficulty);
    if (filters.search) params.set('search', filters.search);
    params.set('page', String(filters.page));
    params.set('limit', '12');
    apiClient.get(`/questions?${params}`).then((r) => {
      setQuestions(r.data.data.list);
      setTotal(r.data.data.total);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchQuestions(); }, [filters]);

  // ---- 管理员操作 ----
  const openNewForm = () => {
    setEditQ(null);
    setForm({ type: '综合分析', subtype: '', content: '', modelAnswer: '', difficulty: 3, status: 'published' });
    setShowForm(true);
  };

  const openEditForm = (q: Question) => {
    setEditQ(q);
    setForm({
      type: q.type,
      subtype: q.subtype ?? '',
      content: q.content,
      modelAnswer: q.modelAnswer ?? '',
      difficulty: q.difficulty ?? 3,
      status: q.status ?? 'published',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.content.trim()) return;
    setSaving(true);
    try {
      if (editQ) {
        await apiClient.put(`/admin/questions/${editQ.id}`, form);
      } else {
        await apiClient.post('/admin/questions', form);
      }
      setShowForm(false);
      fetchQuestions();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      alert(msg ?? '保存失败');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这道题目吗？')) return;
    try {
      await apiClient.delete(`/admin/questions/${id}`);
      fetchQuestions();
    } catch (err: unknown) {
      alert('删除失败');
    }
  };

  const difficultyStars = (level: number | null) => {
    if (!level) return null;
    return '★'.repeat(level) + '☆'.repeat(5 - level);
  };

  const totalAll = types.reduce((sum, t) => sum + t.children.reduce((s, c) => s + c.count, 0), 0);

  return (
    <div className="space-y-6">
      {/* 标题行 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-notion-text">📚 题库中心</h2>
        {user?.role === 'admin' && (
          <button onClick={openNewForm} className="btn-primary text-sm flex items-center gap-1.5">
            <Plus size={16} /> 新增题目
          </button>
        )}
      </div>

      {/* 搜索栏 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-notion-gray" />
          <input type="text" className="input-field pl-10" placeholder="搜索题目内容或标签..."
            value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} />
        </div>
        <div className="flex items-center rounded-lg border border-notion-line overflow-hidden">
          <button onClick={() => setViewMode('grid')} title="网格视图"
            className={`flex items-center gap-1.5 px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-primary-400 text-white' : 'bg-white text-notion-gray hover:bg-notion-hover'}`}>
            <Grid3X3 size={16} /> 网格</button>
          <button onClick={() => setViewMode('list')} title="列表视图"
            className={`flex items-center gap-1.5 px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-primary-400 text-white' : 'bg-white text-notion-gray hover:bg-notion-hover'}`}>
            <List size={16} /> 列表</button>
        </div>
      </div>

      {/* 管理员新建/编辑表单弹窗 */}
      {showForm && (
        <div className="card border-2 border-primary-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-notion-text">{editQ ? '编辑题目' : '新增题目'}</h3>
            <button onClick={() => setShowForm(false)} className="p-1 text-notion-gray hover:text-notion-text"><X size={18} /></button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, subtype: '' })} className="input-field">
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={form.subtype} onChange={(e) => setForm({ ...form, subtype: e.target.value })} className="input-field lg:col-span-2">
                <option value="">子分类（可选）</option>
                {(SUBTYPES[form.type] ?? []).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) })} className="input-field">
                {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{'★'.repeat(d)}</option>)}
              </select>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
                <option value="published">发布</option>
                <option value="draft">草稿</option>
                <option value="archived">归档</option>
              </select>
            </div>
            <textarea className="input-field min-h-[80px]" placeholder="题目内容 *" value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })} />
            <textarea className="input-field min-h-[100px]" placeholder="参考答案"
              value={form.modelAnswer} onChange={(e) => setForm({ ...form, modelAnswer: e.target.value })} />
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
              <Save size={15} /> {saving ? '保存中...' : (editQ ? '保存修改' : '创建题目')}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* 左侧分类 */}
        <aside className="lg:w-56 shrink-0">
          <div className="card space-y-1">
            <button
              onClick={() => setFilters({ ...filters, type: '', subtype: '', page: 1 })}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${!filters.type ? 'bg-sidebar-active font-medium text-notion-text' : 'text-notion-gray hover:bg-notion-hover'}`}
            >
              全部类型 ({totalAll})
            </button>
            {types.map((t) => (
              <div key={t.name}>
                <button
                  onClick={() => setFilters({ ...filters, type: t.name, subtype: '', page: 1 })}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors font-medium ${filters.type === t.name ? 'bg-sidebar-active text-notion-text' : 'text-notion-gray hover:bg-notion-hover'}`}
                >
                  {t.name} ({t.children.reduce((s, c) => s + c.count, 0)})
                </button>
                {filters.type === t.name && t.children.map((c) => (
                  <button key={c.name}
                    onClick={() => setFilters({ ...filters, subtype: c.name, page: 1 })}
                    className={`w-full text-left pl-8 pr-3 py-1.5 rounded-md text-xs transition-colors ${filters.subtype === c.name ? 'bg-primary-50 text-primary-500' : 'text-notion-gray hover:bg-notion-hover'}`}
                  >
                    {c.name} ({c.count})
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        {/* 右侧题目列表 */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-5 bg-slate-100 rounded w-16 mb-2" />
                  <div className="h-12 bg-slate-100 rounded mb-3" />
                  <div className="h-4 bg-slate-100 rounded w-32" />
                </div>
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="card text-center py-12 text-notion-gray">没有找到匹配的题目</div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-2'}>
              {questions.map((q) =>
                viewMode === 'grid' ? (
                  <div key={q.id} className="card relative group">
                    <Link to={`/questions/${q.id}`} className="block">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[q.type] ?? 'bg-slate-100 text-slate-600'}`}>{q.type}</span>
                        {q.difficulty && <span className="text-xs text-amber-500">{difficultyStars(q.difficulty)}</span>}
                      </div>
                      <p className="text-sm text-notion-text leading-relaxed line-clamp-3 mb-3">{q.content}</p>
                      <div className="flex items-center gap-3 text-xs text-notion-gray">
                        <span>👁 {q.viewCount}</span>
                        <span>✏️ {q.practiceCount}次</span>
                        {q.sourceYear && <span className="ml-auto">{q.sourceYear}</span>}
                        <ChevronRight size={14} className="text-notion-gray/50 group-hover:text-primary-400" />
                      </div>
                    </Link>
                    {user?.role === 'admin' && (
                      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.preventDefault(); openEditForm(q); }}
                          className="p-1.5 rounded-md bg-white border border-notion-line text-notion-gray hover:text-primary-400 shadow-sm" title="编辑">
                          <Edit size={14} /></button>
                        <button onClick={(e) => { e.preventDefault(); handleDelete(q.id); }}
                          className="p-1.5 rounded-md bg-white border border-notion-line text-notion-gray hover:text-red-500 shadow-sm" title="删除">
                          <Trash2 size={14} /></button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div key={q.id} className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-md border border-notion-line hover:border-primary-200 hover:bg-notion-hover/50 transition-colors group">
                    <Link to={`/questions/${q.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${TYPE_COLORS[q.type] ?? 'bg-slate-100 text-slate-600'}`}>{q.type}</span>
                      <p className="text-sm text-notion-text flex-1 truncate">{q.content}</p>
                      {q.difficulty && <span className="text-xs text-amber-500 shrink-0 hidden sm:inline">{difficultyStars(q.difficulty)}</span>}
                      <ChevronRight size={14} className="text-notion-gray/50 group-hover:text-primary-400 shrink-0" />
                    </Link>
                    {user?.role === 'admin' && (
                      <div className="flex gap-1 shrink-0">
                        <button onClick={(e) => { e.preventDefault(); openEditForm(q); }}
                          className="p-1 rounded text-notion-gray hover:text-primary-400" title="编辑"><Edit size={13} /></button>
                        <button onClick={(e) => { e.preventDefault(); handleDelete(q.id); }}
                          className="p-1 rounded text-notion-gray hover:text-red-500" title="删除"><Trash2 size={13} /></button>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}

          {total > 12 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: Math.ceil(total / 12) }, (_, i) => (
                <button key={i} onClick={() => setFilters({ ...filters, page: i + 1 })}
                  className={`w-8 h-8 rounded-md text-sm ${filters.page === i + 1 ? 'bg-primary-400 text-white' : 'hover:bg-notion-hover text-notion-gray'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
