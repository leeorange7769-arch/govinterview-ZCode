import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  LayoutDashboard, BookOpen, GraduationCap, BrainCircuit,
  BarChart3, Settings, LogOut, Menu, X, User, ChevronDown, Sun, Moon, UserCog,
} from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';
import ProfileSettings from './ProfileSettings';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: '首页仪表盘' },
  { to: '/questions', icon: BookOpen, label: '题库中心' },
  { to: '/exam', icon: GraduationCap, label: '模拟考试' },
  { to: '/progress', icon: BarChart3, label: '学习进度' },
  { to: '/ai-analysis', icon: BrainCircuit, label: 'AI 分析' },
];

const adminItems = [
  { to: '/admin', icon: Settings, label: '管理后台' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { user, logout } = useAuthStore();
  const { dark, toggle: toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ====== 移动端遮罩 ====== */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ====== 侧边栏 ====== */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-60 bg-sidebar dark:bg-slate-900 text-notion-text dark:text-slate-300 flex flex-col border-r border-notion-line dark:border-slate-700
          transform transition-transform duration-200 lg:translate-x-0 lg:static
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="w-8 h-8 rounded-lg bg-primary-400 flex items-center justify-center text-white font-bold text-base">
            公
          </div>
          <div>
            <h1 className="font-semibold text-sm text-notion-text">公务员面试训练</h1>
            <p className="text-xs text-notion-gray">备考平台</p>
          </div>
        </div>

        {/* 导航链接 */}
        <nav className="flex-1 py-2 space-y-0.5 px-3 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-sidebar-active dark:bg-slate-700 text-notion-text dark:text-white font-medium'
                    : 'text-notion-gray dark:text-slate-400 hover:bg-sidebar-hover dark:hover:bg-slate-800 hover:text-notion-text dark:hover:text-slate-200'
                }`
              }
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <>
              <div className="pt-4 pb-1.5 px-3 text-[11px] text-notion-gray/60 uppercase tracking-wider font-medium">
                管理
              </div>
              {adminItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-sidebar-active text-notion-text font-medium'
                        : 'text-notion-gray hover:bg-sidebar-hover hover:text-notion-text'
                    }`
                  }
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* 底部用户 */}
        <div className="border-t border-notion-line p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-notion-light flex items-center justify-center text-sm font-medium text-notion-gray">
              {(user?.nickname ?? 'U')[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-notion-text">{user?.nickname ?? '用户'}</p>
              <p className="text-xs text-notion-gray truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="text-notion-gray hover:text-notion-text p-1" title="退出登录">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ====== 主内容区 ====== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部栏 */}
        <header className="h-12 bg-white dark:bg-slate-900 border-b border-notion-line dark:border-slate-700 flex items-center justify-between px-4 lg:px-6">
          <button
            className="lg:hidden p-2 -ml-2 rounded-md hover:bg-notion-hover"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} />
          </button>

          <div className="flex-1" />

          {/* 暗黑模式切换 */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-notion-hover text-notion-gray"
            title={dark ? '切换亮色模式' : '切换暗黑模式'}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* 用户下拉菜单 */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-notion-hover"
            >
              <div className="w-7 h-7 rounded-full bg-notion-light flex items-center justify-center text-xs font-semibold text-notion-gray">
                {(user?.nickname ?? 'U')[0]}
              </div>
              <span className="text-sm font-medium hidden sm:block">{user?.nickname ?? '用户'}</span>
              <ChevronDown size={14} />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-notion-line py-1.5 z-50">
                  <div className="px-4 py-2.5 border-b border-notion-line">
                    <p className="text-sm font-medium text-notion-text">{user?.nickname}</p>
                    <p className="text-xs text-notion-gray">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { setUserMenuOpen(false); setShowSettings(true); }}
                    className="w-full text-left px-4 py-2 text-sm text-notion-text hover:bg-notion-hover flex items-center gap-2"
                  >
                    <UserCog size={14} /> 个人设置
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut size={14} /> 退出登录
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* 个人设置弹窗 */}
      {showSettings && <ProfileSettings onClose={() => setShowSettings(false)} />}
    </div>
  );
}
