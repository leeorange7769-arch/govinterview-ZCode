import { useState } from 'react';
import apiClient from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { X, User, Eye, EyeOff } from 'lucide-react';

export default function ProfileSettings({ onClose }: { onClose: () => void }) {
  const { user, fetchUser } = useAuthStore();
  const [tab, setTab] = useState<'nickname' | 'password'>('nickname');

  // 昵称
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [savingNick, setSavingNick] = useState(false);

  // 密码
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveNickname = async () => {
    if (!nickname.trim()) return;
    setSavingNick(true);
    setMsg(null);
    try {
      await apiClient.put('/user/profile', { nickname: nickname.trim() });
      await fetchUser();
      setMsg({ type: 'success', text: '昵称修改成功！' });
    } catch (err: unknown) {
      const text = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? '修改失败';
      setMsg({ type: 'error', text });
    } finally { setSavingNick(false); }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) return;
    setSavingPw(true);
    setMsg(null);
    try {
      await apiClient.put('/user/password', { oldPassword, newPassword });
      setOldPassword('');
      setNewPassword('');
      setMsg({ type: 'success', text: '密码修改成功！下次登录请使用新密码。' });
    } catch (err: unknown) {
      const text = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? '修改失败';
      setMsg({ type: 'error', text });
    } finally { setSavingPw(false); }
  };

  return (
    <>
      {/* 遮罩 */}
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          {/* 标题栏 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">个人设置</h3>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
              <X size={20} />
            </button>
          </div>

          {/* Tab */}
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => { setTab('nickname'); setMsg(null); }}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'nickname' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              修改昵称
            </button>
            <button
              onClick={() => { setTab('password'); setMsg(null); }}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'password' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              修改密码
            </button>
          </div>

          {/* 内容 */}
          <div className="p-6">
            {msg && (
              <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm ${
                msg.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {msg.text}
              </div>
            )}

            {tab === 'nickname' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">新昵称</label>
                  <input
                    type="text"
                    className="input-field dark:bg-slate-700 dark:border-slate-600"
                    placeholder="输入新昵称"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    maxLength={50}
                  />
                </div>
                <button onClick={handleSaveNickname} disabled={savingNick || !nickname.trim()}
                  className="btn-primary w-full text-center">{savingNick ? '保存中...' : '保存昵称'}</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">旧密码</label>
                  <div className="relative">
                    <input type={showOld ? 'text' : 'password'} className="input-field dark:bg-slate-700 dark:border-slate-600 pr-10"
                      placeholder="输入当前密码" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">新密码</label>
                  <div className="relative">
                    <input type={showNew ? 'text' : 'password'} className="input-field dark:bg-slate-700 dark:border-slate-600 pr-10"
                      placeholder="至少 6 位新密码" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button onClick={handleChangePassword} disabled={savingPw || !oldPassword || !newPassword}
                  className="btn-primary w-full text-center">{savingPw ? '修改中...' : '修改密码'}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
