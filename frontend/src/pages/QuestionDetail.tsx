import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import type { Question } from '../types';
import { useAuthStore } from '../stores/authStore';
import { ArrowLeft, Star, Bookmark, Send, Edit, Trash2, Save, X } from 'lucide-react';

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

export default function QuestionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [notes, setNotes] = useState('');
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ type: '', content: '', modelAnswer: '', difficulty: 3 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      apiClient.get(`/questions/${id}`),
      apiClient.get(`/questions/${id}/notes`).catch(() => ({ data: { data: { userNotes: '' } } })),
    ]).then(([qr, nr]) => {
      const q = qr.data.data;
      setQuestion(q);
      setEditForm({ type: q.type, content: q.content, modelAnswer: q.modelAnswer ?? '', difficulty: q.difficulty ?? 3 });
      setNotes(nr.data.data?.userNotes ?? '');
      setNotesLoaded(true);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const handlePractice = async () => {
    if (!answer.trim()) return;
    try {
      const { data: practiceRes } = await apiClient.post(`/questions/${id}/practice`, {
        userAnswer: answer,
      });
      const practiceId = practiceRes.data.id;
      // 请求 AI 评分
      const { data: aiRes } = await apiClient.post(`/ai/score/${practiceId}`);
      alert(`AI 评分：${aiRes.data.score} / 10\n${aiRes.data.overallFeedback}`);
    } catch {
      alert('提交失败，请重试');
    }
  };

  const handleFavorite = async () => {
    try {
      const { data } = await apiClient.post(`/questions/${id}/favorite`);
      setFavorited(data.data.favorited);
    } catch { /* ignore */ }
  };

  const handleDelete = async () => {
    if (!confirm('确定删除这道题目吗？此操作不可撤销！')) return;
    await apiClient.delete(`/admin/questions/${id}`);
    navigate('/questions');
  };

  const handleSaveEdit = async () => {
    if (!editForm.content.trim()) return;
    setSaving(true);
    try {
      const { data } = await apiClient.put(`/admin/questions/${id}`, editForm);
      setQuestion(data.data);
      setEditing(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      alert(msg ?? '保存失败');
    } finally { setSaving(false); }
  };

  // 笔记失焦自动保存
  const saveNotes = async (value: string) => {
    setNotes(value);
    try {
      await apiClient.put(`/questions/${id}/notes`, { notes: value });
    } catch { /* 静默失败 */ }
  };

  if (loading) {
    return <div className="card animate-pulse"><div className="h-6 bg-slate-200 rounded w-1/3 mb-3" /><div className="h-24 bg-slate-200 rounded" /></div>;
  }

  if (!question) {
    return <div className="card text-center py-12 text-slate-400">题目不存在</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 返回 */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> 返回题库
      </button>

      {/* 题目信息 */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${TYPE_COLORS[question.type] ?? 'bg-slate-100 text-slate-600'}`}>
            {question.type}
          </span>
          {question.subtype && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">{question.subtype}</span>
          )}
          {question.difficulty && (
            <span className="text-xs text-amber-500">{'★'.repeat(question.difficulty)}{'☆'.repeat(5 - question.difficulty)}</span>
          )}
          {question.sourceYear && (
            <span className="text-xs text-slate-400 ml-auto">{question.sourceYear}年 · {question.sourceRegion}</span>
          )}
        </div>

        <h3 className="text-lg font-semibold text-slate-900 leading-relaxed mb-4">{question.content}</h3>

        <div className="flex gap-2">
          <button onClick={handleFavorite} className={`btn-secondary text-sm flex items-center gap-1.5 ${favorited ? 'text-amber-500 border-amber-300' : ''}`}>
            <Bookmark size={15} fill={favorited ? 'currentColor' : 'none'} /> {favorited ? '已收藏' : '收藏'}
          </button>
          {user?.role === 'admin' && (
            <>
              <button onClick={() => setEditing(!editing)} className="btn-secondary text-sm flex items-center gap-1.5">
                <Edit size={15} /> 编辑
              </button>
              <button onClick={handleDelete} className="btn-secondary text-sm flex items-center gap-1.5 text-red-500 border-red-200 hover:bg-red-50">
                <Trash2 size={15} /> 删除
              </button>
            </>
          )}
        </div>
      </div>

      {/* 管理员编辑表单 */}
      {editing && (
        <div className="card border-2 border-primary-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">编辑题目</h4>
            <button onClick={() => setEditing(false)} className="p-1 text-slate-400 hover:text-slate-700"><X size={18} /></button>
          </div>
          <div className="space-y-3">
            <div className="flex gap-3">
              <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                className="input-field w-auto">
                {['综合分析', '组织管理', '应急应变', '人际沟通', '自我认知', '时政热点'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select value={editForm.difficulty} onChange={(e) => setEditForm({ ...editForm, difficulty: Number(e.target.value) })}
                className="input-field w-auto">
                {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{'★'.repeat(d)}</option>)}
              </select>
            </div>
            <textarea className="input-field min-h-[80px]" value={editForm.content}
              onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} />
            <textarea className="input-field min-h-[100px]" placeholder="参考答案" value={editForm.modelAnswer}
              onChange={(e) => setEditForm({ ...editForm, modelAnswer: e.target.value })} />
            <button onClick={handleSaveEdit} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
              <Save size={15} /> {saving ? '保存中...' : '保存修改'}
            </button>
          </div>
        </div>
      )}

      {/* 答题思路 */}
      {question.thinkingProcess && Array.isArray(question.thinkingProcess) && question.thinkingProcess.length > 0 && (
        <div className="card">
          <h4 className="font-semibold text-slate-900 mb-3">💡 答题思路</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600">
            {(question.thinkingProcess as string[]).map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* 参考答案 */}
      {question.modelAnswer && (
        <div className="card">
          <h4 className="font-semibold text-slate-900 mb-3">📝 参考答案</h4>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{question.modelAnswer}</p>
        </div>
      )}

      {/* 评分要点 */}
      {question.scoringPoints && Array.isArray(question.scoringPoints) && (question.scoringPoints as unknown[]).length > 0 && (
        <div className="card">
          <h4 className="font-semibold text-slate-900 mb-3">🎯 评分要点</h4>
          <div className="space-y-2">
            {(question.scoringPoints as { point: string; weight: number; description: string }[]).map((sp, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="w-2 h-2 rounded-full bg-primary-400 mt-2 shrink-0" />
                <div>
                  <span className="font-medium text-slate-700">{sp.point}</span>
                  <span className="text-xs text-slate-400 ml-2">({sp.weight} 分)</span>
                  <p className="text-slate-500 text-xs mt-0.5">{sp.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 个人笔记（自动保存） */}
      <div className="card">
        <h4 className="font-semibold text-notion-text mb-3">📒 我的笔记</h4>
        <textarea
          className="input-field min-h-[120px] resize-y text-sm"
          placeholder="在这里记录你的答题心得、要点总结、错题反思...（失焦自动保存）"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={(e) => saveNotes(e.target.value)}
        />
        <p className="text-[11px] text-notion-gray mt-2">离开输入框自动保存</p>
      </div>

      {/* 练习答题区 */}
      <div className="card">
        <h4 className="font-semibold text-notion-text mb-3">✏️ 我的练习</h4>
        <textarea
          className="input-field min-h-[160px] resize-y"
          placeholder="请在此输入你的回答..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
        <button onClick={handlePractice} disabled={!answer.trim()} className="btn-primary mt-3 flex items-center gap-2 text-sm">
          <Send size={15} /> 提交答案并获取 AI 评分
        </button>
      </div>
    </div>
  );
}
