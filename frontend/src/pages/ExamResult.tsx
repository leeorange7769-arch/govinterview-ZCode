import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/client';

export default function ExamResult() {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiClient.get(`/exams/${id}/result`).then((r) => {
      setResult(r.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="card animate-pulse"><div className="h-64 bg-slate-200 rounded" /></div>;
  if (!result) return <div className="card text-center py-12 text-slate-400">结果不存在</div>;

  return (
    <div className="max-w-3xl space-y-6">
      {/* 总分卡片 */}
      <div className="card text-center border-2 border-primary-200 bg-gradient-to-b from-primary-50 to-white">
        <div className="text-5xl font-bold text-primary-600 mb-2">{result.totalScore as number}/{result.maxScore as number}</div>
        <p className="text-slate-500">得分率 {result.percentage as number}%</p>
        <p className="text-sm text-slate-400 mt-1">{result.title as string}</p>
      </div>

      {/* 题型分析 */}
      {(result.typeAnalysis as unknown[])?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-3">📊 各题型得分率</h3>
          <div className="space-y-2">
            {(result.typeAnalysis as { type: string; rate: number; count: number }[]).map((t) => (
              <div key={t.type} className="flex items-center gap-3">
                <span className="text-sm w-20">{t.type}</span>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${t.rate < 50 ? 'bg-red-400' : t.rate < 75 ? 'bg-amber-400' : 'bg-green-400'}`}
                    style={{ width: `${t.rate}%` }}
                  />
                </div>
                <span className="text-sm text-slate-500 w-12 text-right">{t.rate}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 逐题详情 */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-900">📝 逐题详情</h3>
        {(result.details as { detailId: number; questionId: number; type: string; content: string; userAnswer: string; score: number; maxScore: number; modelAnswer?: string }[])?.map((d, i) => (
          <div key={d.detailId} className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-500">第 {i + 1} 题 · {d.type}</span>
              <span className={`text-sm font-bold ${(d.score ?? 0) >= 6 ? 'text-green-600' : 'text-red-500'}`}>
                {d.score ?? 0}/{d.maxScore ?? 10} 分
              </span>
            </div>
            <p className="text-sm text-slate-700 mb-3">{d.content}</p>
            <div className="bg-slate-50 rounded-lg p-3 mb-2">
              <p className="text-xs text-slate-400 mb-1">我的回答：</p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{d.userAnswer ?? '(未作答)'}</p>
            </div>
            {d.modelAnswer && (
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-green-600 mb-1">参考答案：</p>
                <p className="text-sm text-green-800 whitespace-pre-wrap">{d.modelAnswer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 操作 */}
      <div className="flex gap-3">
        <Link to="/exam" className="btn-primary text-sm">再来一套</Link>
        <Link to="/dashboard" className="btn-secondary text-sm">返回首页</Link>
      </div>
    </div>
  );
}
