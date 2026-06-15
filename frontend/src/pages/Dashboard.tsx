import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import apiClient from '../api/client';
import type { DashboardData, DashboardStats, TypeProgress } from '../types';
import {
  BookOpen, PenTool, TrendingUp, Flame, Zap, Target, ArrowRight,
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/user/dashboard').then((r) => {
      setData(r.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-slate-200 rounded-card" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-card" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="h-72 bg-slate-200 rounded-card" />
          <div className="h-72 bg-slate-200 rounded-card" />
        </div>
      </div>
    );
  }

  const stats: DashboardStats = data?.stats ?? { practiceCount: 0, examCount: 0, avgScore: 0, streakDays: 0 };
  const typeProgress: TypeProgress[] = data?.typeProgress ?? [];

  // 雷达图数据
  const radarData = typeProgress.map((t) => ({
    subject: t.type.length > 4 ? t.type.slice(0, 4) : t.type,
    full: t.type,
    score: t.avgScore ?? 0,
    rate: t.percentage,
  }));

  // 柱状图数据（近 7 天趋势 - 目前用模拟数据）
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      day: `${d.getMonth() + 1}/${d.getDate()}`,
      答题量: Math.floor(Math.random() * 15) + 1,
      正确率: Math.floor(Math.random() * 30) + 50,
    };
  });

  const statCards = [
    { label: '累计答题', value: stats.practiceCount, icon: BookOpen, color: 'bg-primary-50 text-primary-400' },
    { label: '模拟考试', value: stats.examCount, icon: PenTool, color: 'bg-sage-50 text-sage-400' },
    { label: '平均得分', value: `${stats.avgScore}分`, icon: TrendingUp, color: 'bg-lavender-50 text-lavender-400' },
    { label: '连续打卡', value: `${stats.streakDays}天`, icon: Flame, color: 'bg-accent-50 text-accent-400' },
  ];

  const weakestTypes = typeProgress
    .filter((t) => t.completed > 0)
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* 欢迎横幅 */}
      <div className="card bg-notion-light border-notion-line">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-notion-text">欢迎回来，{user?.nickname ?? '同学'}</h2>
            <p className="text-notion-gray mt-0.5 text-sm">
              {weakestTypes.length > 0
                ? `今日学习建议：重点练习「${weakestTypes[0].type}」类题目`
                : '开始今天的练习吧！'}
            </p>
          </div>
          <Link to="/exam" className="flex items-center gap-2 bg-primary-400 hover:bg-primary-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
            开始练习 <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* 数据概览卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-xl font-bold text-slate-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 图表区 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 近 7 天趋势 */}
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4">📈 近 7 天学习趋势</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="答题量" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="正确率" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 能力雷达图 */}
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-2">🎯 能力雷达图</h3>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#cbd5e1" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="得分率 (%)" dataKey="rate" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-slate-400 text-sm">
              还没有足够的练习数据
            </div>
          )}
        </div>
      </div>

      {/* 薄弱板块 + 推荐训练 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 薄弱板块 TOP3 */}
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Target size={18} className="text-red-500" /> 薄弱板块 TOP3
          </h3>
          {weakestTypes.length > 0 ? (
            <div className="space-y-3">
              {weakestTypes.map((t, i) => (
                <div key={t.type} className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${i === 0 ? 'bg-red-100 text-red-600' : i === 1 ? 'bg-orange-100 text-orange-600' : 'bg-yellow-100 text-yellow-700'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{t.type}</span>
                      <span className="text-slate-500">正确率 {t.percentage}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${t.percentage < 40 ? 'bg-red-400' : t.percentage < 60 ? 'bg-orange-400' : 'bg-yellow-400'}`}
                        style={{ width: `${t.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Link to="/questions" className="btn-primary w-full text-center block mt-4 text-sm">
                立即强化训练
              </Link>
            </div>
          ) : (
            <p className="text-slate-400 text-sm text-center py-6">完成更多练习后显示薄弱分析</p>
          )}
        </div>

        {/* 各题型进度条 */}
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Zap size={18} className="text-amber-500" /> 各题型掌握度
          </h3>
          {typeProgress.length > 0 ? (
            <div className="space-y-4">
              {typeProgress.map((t) => (
                <div key={t.type}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span>{t.type}</span>
                    <span className={t.percentage < 40 ? 'text-red-500' : t.percentage < 70 ? 'text-amber-500' : 'text-green-500'}>
                      {t.completed} 题 / {t.percentage}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${t.percentage < 40 ? 'bg-red-400' : t.percentage < 70 ? 'bg-amber-400' : 'bg-green-400'}`}
                      style={{ width: `${Math.min(100, t.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm text-center py-6">暂无练习数据</p>
          )}
        </div>
      </div>
    </div>
  );
}
