import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { GraduationCap, Target, FileText, Settings } from 'lucide-react';

const MODES = [
  { key: 'smart', title: '智能组卷', desc: 'AI 根据你的薄弱点自动组卷', icon: Target, color: 'bg-primary-50 text-primary-600 border-primary-200' },
  { key: 'specialty', title: '专项训练', desc: '选择特定题型集中练习', icon: FileText, color: 'bg-green-50 text-green-600 border-green-200' },
  { key: 'mock', title: '真题模拟', desc: '历年真题套卷模拟', icon: GraduationCap, color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { key: 'custom', title: '自定义练习', desc: '自由选择题目数量', icon: Settings, color: 'bg-orange-50 text-orange-600 border-orange-200' },
];

const TYPES = ['综合分析', '组织管理', '应急应变', '人际沟通', '自我认知', '时政热点'];

export default function ExamStart() {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStart = async () => {
    if (!selectedMode) return;
    setLoading(true);
    try {
      const { data } = await apiClient.post('/exams/start', {
        examType: selectedMode,
        count: questionCount,
        type: selectedType || undefined,
      });
      navigate(`/exam/${data.data.id}`);
    } catch {
      alert('创建考试失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-xl font-bold text-slate-900">🎓 模拟考试</h2>

      {/* 考试模式选择 */}
      <div>
        <h3 className="text-sm font-medium text-slate-500 mb-3">选择考试模式</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MODES.map(({ key, title, desc, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setSelectedMode(key)}
              className={`card text-left border-2 transition-all ${selectedMode === key ? `border-primary-400 shadow-md ${color}` : 'border-transparent hover:border-slate-200'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">{title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 题型选择（专项训练时显示） */}
      {selectedMode === 'specialty' && (
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-3">选择专项题型</h3>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedType === t ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 题目数量 */}
      <div className="card">
        <h3 className="font-semibold text-slate-900 mb-3">题目数量</h3>
        <div className="flex items-center gap-3">
          {[5, 10, 15, 20].map((n) => (
            <button
              key={n}
              onClick={() => setQuestionCount(n)}
              className={`w-14 h-14 rounded-xl text-lg font-bold transition-colors ${questionCount === n ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* 开始按钮 */}
      <button
        onClick={handleStart}
        disabled={!selectedMode || loading}
        className="btn-primary w-full text-center py-3 text-lg"
      >
        {loading ? '正在组卷...' : '开始考试'}
      </button>
    </div>
  );
}
