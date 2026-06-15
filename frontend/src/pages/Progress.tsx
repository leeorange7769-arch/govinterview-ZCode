import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { TypeProgress, ExamRecord } from '../types';
import { Award, Filter, Calendar } from 'lucide-react';

const ACHIEVEMENTS = [
  { name: '连续7天', icon: '🔥', desc: '连续学习 7 天' },
  { name: '百题斩', icon: '⚔️', desc: '累计完成 100 题' },
  { name: '满分王者', icon: '👑', desc: '获得一次满分' },
  { name: '全能选手', icon: '🌟', desc: '封面六大题型' },
  { name: '速度之星', icon: '⚡', desc: '10分钟内完成10题' },
];

export default function Progress() {
  const [progress, setProgress] = useState<TypeProgress[]>([]);
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [calendarData, setCalendarData] = useState<{ date: string; count: number }[]>([]);
  const [achievements, setAchievements] = useState<{ badges: { name: string; icon: string; desc: string; earned: boolean }[]; earnedCount: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get('/user/progress'),
      apiClient.get('/user/exams?limit=20'),
      apiClient.get('/user/calendar'),
      apiClient.get('/user/achievements'),
    ]).then(([pr, er, cr, ar]) => {
      setProgress(pr.data.data.progress ?? []);
      setExams(er.data.data.list ?? []);
      setCalendarData(cr.data.data ?? []);
      setAchievements(ar.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="space-y-6 animate-pulse"><div className="h-40 bg-slate-200 rounded-card" /><div className="h-64 bg-slate-200 rounded-card" /></div>;
  }

  const totalCompleted = progress.reduce((sum, p) => sum + p.completed, 0);
  const totalTarget = 500;
  const overallPct = Math.min(100, Math.round((totalCompleted / totalTarget) * 100));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">📈 学习进度</h2>

      {/* 总进度 */}
      <div className="card">
        <h3 className="font-semibold text-slate-900 mb-3">📊 总体学习进度</h3>
        <div className="flex justify-between text-sm mb-2">
          <span>总目标：完成 {totalTarget} 题</span>
          <span>已完成：{totalCompleted} 题 · {overallPct}%</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-700 rounded-full transition-all duration-700"
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>

      {/* 学习日历热力图 */}
      <CalendarHeatmap data={calendarData} />

      {/* 各题型进度 */}
      <div className="card">
        <h3 className="font-semibold text-slate-900 mb-4">各题型掌握度</h3>
        {progress.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">暂无练习数据</p>
        ) : (
          <div className="space-y-4">
            {progress.map((p) => (
              <div key={p.type}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium">{p.type}</span>
                  <span className={p.percentage < 40 ? 'text-red-500' : p.percentage < 70 ? 'text-amber-500' : 'text-green-500'}>
                    {p.completed} 题 {p.avgScore != null ? `· 均分 ${p.avgScore}` : ''}
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${p.percentage < 40 ? 'bg-red-400' : p.percentage < 70 ? 'bg-amber-400' : 'bg-green-400'}`}
                    style={{ width: `${Math.min(100, p.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 成就徽章 */}
      <div className="card dark:bg-slate-800">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Award size={18} className="text-amber-500" /> 成就徽章
          {achievements && (
            <span className="text-xs text-slate-400 ml-2">{achievements.earnedCount}/{achievements.total}</span>
          )}
        </h3>
        {achievements ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {achievements.badges.map((a) => (
              <div key={a.name} className={`text-center p-3 rounded-xl border transition-all ${
                a.earned
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                  : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700 opacity-40 grayscale'
              }`}>
                <div className={`text-2xl mb-1 ${a.earned ? '' : 'grayscale'}`}>{a.icon}</div>
                <p className={`text-xs font-medium ${a.earned ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                  {a.name}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{a.desc}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 opacity-30 grayscale">
                <div className="text-2xl mb-1">🏆</div>
                <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-12 mx-auto" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 考试记录 */}
      <div className="card">
        <h3 className="font-semibold text-slate-900 mb-4">📋 考试记录</h3>
        {exams.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">暂无考试记录</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">考试名称</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">题型</th>
                  <th className="text-right py-2 px-3 text-slate-500 font-medium">得分</th>
                  <th className="text-right py-2 px-3 text-slate-500 font-medium">题数</th>
                  <th className="text-right py-2 px-3 text-slate-500 font-medium">日期</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((e) => (
                  <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-medium">{e.title ?? '—'}</td>
                    <td className="py-2.5 px-3 text-slate-500">{e.examType}</td>
                    <td className="py-2.5 px-3 text-right">{e.totalScore != null ? `${e.totalScore}/${e.maxScore}` : '—'}</td>
                    <td className="py-2.5 px-3 text-right">{e.questionCount}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400 text-xs">{e.createdAt?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== 学习日历热力图 ====================
function CalendarHeatmap({ data }: { data: { date: string; count: number }[] }) {
  // 生成最近 365 天的格子
  const today = new Date();
  const countMap = new Map(data.map((d) => [d.date, d.count]));

  const weeks: { date: Date; count: number }[][] = [];
  let currentWeek: { date: Date; count: number }[] = [];

  // 从 52 周前开始
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364);

  // 对齐到周一
  const dayOfWeek = startDate.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startDate.setDate(startDate.getDate() + mondayOffset);

  for (let i = 0; i < 371; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);

    const key = d.toISOString().slice(0, 10);
    currentWeek.push({ date: d, count: countMap.get(key) ?? 0 });

    if (currentWeek.length === 7 || i === 370) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  const getColor = (count: number) => {
    if (count === 0) return 'bg-slate-100 dark:bg-slate-700/50';
    if (count <= 2) return 'bg-green-200 dark:bg-green-900/40';
    if (count <= 5) return 'bg-green-400 dark:bg-green-700';
    if (count <= 10) return 'bg-green-500 dark:bg-green-600';
    return 'bg-green-700 dark:bg-green-500';
  };

  const dayLabels = ['', '一', '', '三', '', '五', ''];

  return (
    <div className="card dark:bg-slate-800">
      <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <Calendar size={18} className="text-primary-500" /> 学习日历
      </h3>
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-0.5 min-w-fit">
          {/* 星期标签 */}
          <div className="flex flex-col gap-0.5 mr-1">
            {dayLabels.map((label, i) => (
              <div key={i} className="h-3.5 w-5 text-[10px] text-slate-400 flex items-center">
                {label}
              </div>
            ))}
          </div>
          {/* 格子 */}
          <div className="flex gap-0.5">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day, di) => (
                  <div
                    key={di}
                    title={`${day.date.toISOString().slice(0, 10)}: ${day.count} 次`}
                    className={`w-3.5 h-3.5 rounded-sm ${getColor(day.count)}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* 图例 */}
      <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
        <span>少</span>
        <div className="w-3.5 h-3.5 rounded-sm bg-slate-100 dark:bg-slate-700/50" />
        <div className="w-3.5 h-3.5 rounded-sm bg-green-200 dark:bg-green-900/40" />
        <div className="w-3.5 h-3.5 rounded-sm bg-green-400 dark:bg-green-700" />
        <div className="w-3.5 h-3.5 rounded-sm bg-green-500 dark:bg-green-600" />
        <div className="w-3.5 h-3.5 rounded-sm bg-green-700 dark:bg-green-500" />
        <span>多</span>
      </div>
    </div>
  );
}
