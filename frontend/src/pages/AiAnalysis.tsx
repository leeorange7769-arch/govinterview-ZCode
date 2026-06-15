import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import type { WeaknessArea, AiAnalysisData } from '../types';
import { BrainCircuit, RefreshCw, AlertCircle, Target, ArrowRight } from 'lucide-react';

export default function AiAnalysis() {
  const [analysis, setAnalysis] = useState<AiAnalysisData | null>(null);
  const [recommendations, setRecommendations] = useState<{ weakTypes: string[]; recommendations: { id: number; type: string; content: string; difficulty: number | null }[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get('/ai/analysis'),
      apiClient.get('/ai/recommendations'),
    ]).then(([ar, rr]) => {
      setAnalysis(ar.data.data);
      setRecommendations(rr.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleTriggerAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { data } = await apiClient.post('/ai/analysis');
      setAnalysis(data.data);
      // 刷新推荐
      const rr = await apiClient.get('/ai/recommendations');
      setRecommendations(rr.data.data);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      alert(msg ?? '分析失败，请确保已练习足够题目');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <div className="space-y-6 animate-pulse"><div className="h-64 bg-slate-200 rounded-card" /><div className="h-48 bg-slate-200 rounded-card" /></div>;
  }

  const hasAnalysis = analysis && analysis.weaknessAreas && analysis.weaknessAreas.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <BrainCircuit size={22} className="text-primary-600" /> AI 智能分析
        </h2>
        <button
          onClick={handleTriggerAnalysis}
          disabled={analyzing}
          className="btn-primary text-sm flex items-center gap-2"
        >
          <RefreshCw size={15} className={analyzing ? 'animate-spin' : ''} />
          {analyzing ? '分析中...' : '生成分析报告'}
        </button>
      </div>

      {!hasAnalysis ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <BrainCircuit size={28} className="text-primary-400" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-2">尚未生成 AI 分析报告</h3>
          <p className="text-sm text-slate-500 mb-4">完成一定数量的练习后，点击"生成分析报告"获取 AI 智能分析</p>
        </div>
      ) : (
        <>
          {/* 薄弱板块 */}
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-red-500" /> 薄弱板块分析
            </h3>
            <div className="space-y-4">
              {(analysis.weaknessAreas as WeaknessArea[])?.map((w, i) => (
                <div key={w.type} className="border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-slate-800">
                      <span className="text-red-500 mr-1">#{i + 1}</span>
                      {w.type} · 正确率 {w.accuracy}%
                    </h4>
                  </div>
                  {w.commonIssues && w.commonIssues.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-slate-500 mb-1">问题诊断：</p>
                      <ul className="list-disc list-inside text-sm text-slate-600 space-y-0.5">
                        {w.commonIssues.map((issue, j) => (
                          <li key={j}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {w.suggestion && (
                    <p className="text-sm text-primary-700 bg-primary-50 rounded-lg px-3 py-2 mt-2">
                      💡 {w.suggestion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 总体评估 */}
          {analysis.overallAssessment && (
            <div className="card bg-gradient-to-r from-primary-50 to-white">
              <p className="text-sm text-slate-700 leading-relaxed">{analysis.overallAssessment}</p>
            </div>
          )}
        </>
      )}

      {/* 推荐题目 */}
      {recommendations && recommendations.recommendations?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Target size={18} className="text-amber-500" /> 推荐练习
          </h3>
          <div className="space-y-3">
            {recommendations.recommendations.map((rec) => (
              <Link key={rec.id} to={`/questions/${rec.id}`} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group">
                <div className="flex-1 min-w-0 mr-3">
                  <span className="text-xs text-primary-600 font-medium">{rec.type}</span>
                  <p className="text-sm text-slate-700 truncate">{rec.content}</p>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-primary-500 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
