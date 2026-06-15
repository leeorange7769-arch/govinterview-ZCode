import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg ?? '登录失败，请重试');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-notion-light p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-400 text-white mb-3">
            <GraduationCap size={24} />
          </div>
          <h1 className="text-xl font-bold text-notion-text">公务员面试训练平台</h1>
          <p className="text-sm text-notion-gray mt-1">登录你的账号，继续备考之旅</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-card border border-notion-line p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-500 text-sm px-4 py-2.5 rounded-md">{error}</div>}

          <div>
            <label className="block text-sm text-notion-text mb-1.5">邮箱</label>
            <input type="email" className="input-field" placeholder="your@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm text-notion-text mb-1.5">密码</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} className="input-field pr-10" placeholder="输入密码"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-notion-gray">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full text-center text-sm">
            {loading ? '登录中...' : '登录'}
          </button>

          <p className="text-center text-sm text-notion-gray">
            还没有账号？<Link to="/register" className="text-primary-400 font-medium hover:underline">立即注册</Link>
          </p>
        </form>

        <p className="mt-4 text-center text-xs text-notion-gray/50">测试账号：admin@example.com / admin123</p>
      </div>
    </div>
  );
}
