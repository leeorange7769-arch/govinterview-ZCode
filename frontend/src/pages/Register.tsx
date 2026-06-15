import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const { register, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('密码至少 6 位'); return; }
    try {
      await register(email, password, nickname || undefined);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg ?? '注册失败，请重试');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-notion-light p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-400 text-white mb-3 text-lg font-bold">公</div>
          <h1 className="text-xl font-bold text-notion-text">创建新账号</h1>
          <p className="text-sm text-notion-gray mt-1">开始你的公务员面试备考之旅</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-card border border-notion-line p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-500 text-sm px-4 py-2.5 rounded-md">{error}</div>}

          <div>
            <label className="block text-sm text-notion-text mb-1.5">昵称</label>
            <input type="text" className="input-field" placeholder="给自己取个名字"
              value={nickname} onChange={(e) => setNickname(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-notion-text mb-1.5">邮箱 *</label>
            <input type="email" className="input-field" placeholder="your@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm text-notion-text mb-1.5">密码 *</label>
            <input type="password" className="input-field" placeholder="至少 6 位密码"
              value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full text-center text-sm">
            {loading ? '注册中...' : '注册'}
          </button>

          <p className="text-center text-sm text-notion-gray">
            已有账号？<Link to="/login" className="text-primary-400 font-medium hover:underline">去登录</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
