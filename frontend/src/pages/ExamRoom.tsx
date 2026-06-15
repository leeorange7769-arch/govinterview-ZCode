import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import type { ExamDetail } from '../types';
import { Clock, ChevronLeft, ChevronRight, Save, Flag, Send } from 'lucide-react';

interface ExamData {
  id: number;
  title: string;
  totalQuestions: number;
  maxScore: number;
  remainingSeconds: number;
  questions: ExamDetail[];
  isCompleted?: boolean;
}

export default function ExamRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<ExamData | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(1800);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiClient.get(`/exams/${id}`).then((r) => {
      const e = r.data.data as ExamData;
      setExam(e);
      if (e.isCompleted) {
        navigate(`/exam/${id}/result`, { replace: true });
        return;
      }
      setTimeLeft(e.remainingSeconds ?? 1800);
      setLoading(false);
    }).catch(() => {
      navigate('/exam');
    });
  }, [id, navigate]);

  // 倒计时
  useEffect(() => {
    if (loading || !exam) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, exam]);

  const handleSaveAnswer = async (detailId: number, userAnswer: string) => {
    setAnswers((prev) => ({ ...prev, [detailId]: userAnswer }));
    try {
      await apiClient.post(`/exams/${id}/details/${detailId}/answer`, { userAnswer });
    } catch { /* ignore save errors */ }
  };

  const handleSubmit = async () => {
    if (submitting || !id) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/exams/${id}/submit`, { timeSpent: (exam?.remainingSeconds ?? 1800) - timeLeft });
      navigate(`/exam/${id}/result`);
    } catch {
      alert('交卷失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !exam) {
    return <div className="card animate-pulse"><div className="h-96 bg-slate-200 rounded" /></div>;
  }

  const q = exam.questions[currentIdx];
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="max-w-4xl space-y-4">
      {/* 顶部信息栏 */}
      <div className="card flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">{exam.title}</h3>
          <p className="text-xs text-slate-500">进度：{currentIdx + 1}/{exam.totalQuestions} 题</p>
        </div>
        <div className={`flex items-center gap-2 text-lg font-mono font-bold ${timeLeft < 300 ? 'text-red-500' : 'text-slate-700'}`}>
          <Clock size={18} /> {formatTime(timeLeft)}
        </div>
      </div>

      {/* 题目区 */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4 text-xs text-slate-400">
          <span>第 {currentIdx + 1} 题</span>
          <span>·</span>
          <span>{q.type}</span>
          {q.difficulty && <span className="text-amber-500">{'★'.repeat(q.difficulty)}</span>}
        </div>

        <p className="text-base text-slate-800 leading-relaxed mb-6">{q.content}</p>

        <textarea
          className="input-field min-h-[200px] resize-y"
          placeholder="请在此输入你的回答..."
          value={answers[q.detailId!] ?? ''}
          onChange={(e) => handleSaveAnswer(q.detailId!, e.target.value)}
        />
      </div>

      {/* 底部操作栏 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button
          onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
          disabled={currentIdx === 0}
          className="btn-secondary text-sm flex items-center gap-1"
        >
          <ChevronLeft size={16} /> 上一题
        </button>

        <div className="flex gap-2">
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary text-sm flex items-center gap-1.5">
            <Send size={15} /> {submitting ? '交卷中...' : '交卷'}
          </button>
        </div>

        <button
          onClick={() => setCurrentIdx(Math.min(exam.totalQuestions - 1, currentIdx + 1))}
          disabled={currentIdx === exam.totalQuestions - 1}
          className="btn-secondary text-sm flex items-center gap-1"
        >
          下一题 <ChevronRight size={16} />
        </button>
      </div>

      {/* 题号导航 */}
      <div className="card">
        <div className="flex flex-wrap gap-2">
          {exam.questions.map((eq, i) => (
            <button
              key={eq.detailId}
              onClick={() => setCurrentIdx(i)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                i === currentIdx ? 'bg-primary-600 text-white' :
                answers[eq.detailId!] ? 'bg-green-100 text-green-700 border border-green-300' :
                'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-slate-400">
          <span>🟢 已答</span>
          <span>⚪ 未答</span>
          <span>🔵 当前</span>
        </div>
      </div>
    </div>
  );
}
