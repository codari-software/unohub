import { useState, useEffect, useRef } from 'react';
import { LogOut, User, Settings as SettingsIcon, ChevronDown, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import Finance from '../components/Finance';
import Diet from '../components/Diet';
import Pomodoro from '../components/Pomodoro';
import Events from '../components/Events';
import Notes from '../components/Notes';
import Placeholder from '../components/Placeholder';

import Profile from '../components/Profile';
import Settings from '../components/Settings';

function DashboardLayout() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [user, setUser] = useState<any>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notifDropdownRef = useRef<HTMLDivElement>(null);

    const getUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setIsLoadingUser(false);
    };

    useEffect(() => {
        getUser();

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
            if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const getInitials = (nameOrEmail: string) => {
        if (!nameOrEmail) return 'U';
        return nameOrEmail.slice(0, 2).toUpperCase();
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <Dashboard />;
            case 'finance': return <Finance />;
            case 'diet': return <Diet />;
            case 'pomodoro': return <Pomodoro />;
            case 'profile': return <Profile onProfileUpdate={getUser} />;
            case 'settings': return <Settings />;
            case 'events': return <Events />;
            case 'notes': return <Notes />;
            default: return <Placeholder title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} />;
        }
    };

    // Helper to get display name
    const getUserName = () => {
        if (user?.user_metadata?.full_name) {
            return user.user_metadata.full_name;
        }
        return user?.email?.split('@')[0] || 'Usuário';
    };

    return (
        <div id="root-container" className="flex h-full w-full bg-[var(--color-bg)] text-[var(--color-text-primary)] overflow-hidden">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="flex-1 h-full overflow-y-auto overflow-x-hidden p-5 relative scroll-smooth pr-2 w-full max-w-full">
                <div className="max-w-7xl mx-auto h-full flex flex-col w-full">
                    <header className="mb-6 flex justify-between items-center py-3 bg-[var(--color-bg)]/80 backdrop-blur-sm -mx-4 px-4 sticky top-0 z-40">
                        {isLoadingUser ? (
                            <div className="flex flex-col gap-2">
                                <div className="h-8 w-48 bg-[var(--color-glass)] rounded animate-pulse"></div>
                                <div className="h-4 w-32 bg-[var(--color-glass)] rounded animate-pulse"></div>
                            </div>
                        ) : (
                            <div>
                                <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
                                    {activeTab === 'dashboard' ? 'Visão Geral' :
                                        activeTab === 'profile' ? 'Meu Perfil' :
                                            activeTab === 'settings' ? 'Configurações' :
                                                activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                                </h1>
                                <p className="text-[var(--color-text-secondary)] text-sm mt-1">Bem-vindo de volta, {getUserName()}</p>
                            </div>
                        )}

                        <div className="flex gap-4 items-center">
                            {/* Notifications Dropdown */}
                            <div className="relative" ref={notifDropdownRef}>
                                <button
                                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                    className={`p-2 hover:bg-[var(--color-bg)] rounded-full transition-colors relative ${isNotificationsOpen ? 'text-[var(--color-text-primary)] bg-[var(--color-bg)]' : 'text-[var(--color-text-secondary)]'}`}
                                >
                                    <Bell size={20} />
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-[var(--color-bg)]"></span>
                                </button>

                                {isNotificationsOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl shadow-2xl animate-fade-in z-50 ring-1 ring-black/5 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-bg)]">
                                            <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">Notificações</h3>
                                            <button className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Ler todas</button>
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto">
                                            {/* Example Notification */}
                                            <div className="p-4 border-b border-[var(--color-border)] hover:bg-[var(--color-glass)] transition-colors cursor-pointer group">
                                                <div className="flex gap-3">
                                                    <div className="w-2 h-2 mt-1.5 rounded-full bg-rose-500 shrink-0"></div>
                                                    <div>
                                                        <p className="text-sm text-[var(--color-text-primary)] leading-tight mb-1 font-medium group-hover:text-indigo-400 transition-colors">Meta de água atingida!</p>
                                                        <p className="text-xs text-[var(--color-text-secondary)]">Parabéns, você bebeu 2.5L hoje.</p>
                                                        <p className="text-[10px] text-[var(--color-text-secondary)]/70 mt-2">Há 2 horas</p>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Example Notification 2 */}
                                            <div className="p-4 hover:bg-[var(--color-glass)] transition-colors cursor-pointer group">
                                                <div className="flex gap-3">
                                                    <div className="w-2 h-2 mt-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                                                    <div>
                                                        <p className="text-sm text-[var(--color-text-primary)] leading-tight mb-1 font-medium group-hover:text-indigo-400 transition-colors">Nova funcionalidade</p>
                                                        <p className="text-xs text-[var(--color-text-secondary)]">Agora você pode reordenar suas refeições.</p>
                                                        <p className="text-[10px] text-[var(--color-text-secondary)]/70 mt-2">Há 1 dia</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-2 border-t border-[var(--color-border)] bg-[var(--color-glass)] text-center">
                                            <button className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors w-full py-1">
                                                Ver histórico completo
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* User Profile Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                {isLoadingUser ? (
                                    <div className="flex items-center gap-3 bg-[var(--color-card)] p-1.5 pr-4 pl-2 rounded-full border border-[var(--color-border)] animate-pulse">
                                        <div className="w-9 h-9 rounded-full bg-[var(--color-glass)]"></div>
                                        <div className="h-4 w-24 bg-[var(--color-glass)] rounded hidden sm:block"></div>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                                            className="flex items-center gap-3 bg-[var(--color-bg)] hover:bg-[var(--color-bg)] p-1.5 pr-4 pl-2 rounded-full border border-[var(--color-border)] transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 group"
                                        >
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 text-xs tracking-wider">
                                                {getInitials(getUserName())}
                                            </div>
                                            <div className="flex flex-col items-start hidden sm:flex">
                                                <span className="text-[var(--color-text-primary)] font-medium text-sm leading-tight group-hover:text-[var(--color-text-primary)] transition-colors">
                                                    {getUserName()}
                                                </span>
                                            </div>
                                            <ChevronDown size={14} className={`text-[var(--color-text-secondary)] ml-1 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isProfileOpen && (
                                            <div className="absolute right-0 top-full mt-2 w-64 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl shadow-2xl py-2 animate-fade-in z-50 ring-1 ring-black/5">
                                                <div className="px-5 py-4 border-b border-[var(--color-border)] mb-2">
                                                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Logado como</p>
                                                    <p className="text-xs text-[var(--color-text-secondary)] truncate mt-1">{user?.email}</p>
                                                </div>

                                                <div className="px-2 space-y-1">
                                                    <button
                                                        onClick={() => {
                                                            setActiveTab('profile');
                                                            setIsProfileOpen(false);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-glass)] rounded-lg transition-colors text-left"
                                                    >
                                                        <User size={16} className="text-indigo-400" /> Meu Perfil
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setActiveTab('settings');
                                                            setIsProfileOpen(false);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-glass)] rounded-lg transition-colors text-left"
                                                    >
                                                        <SettingsIcon size={16} className="text-[var(--color-text-secondary)]" /> Configurações
                                                    </button>
                                                </div>

                                                <div className="h-px bg-[var(--color-border)] my-2 mx-2"></div>

                                                <div className="px-2">
                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors text-left font-medium"
                                                    >
                                                        <LogOut size={16} /> Sair da conta
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </header>

                    <div className="animate-fade-in flex-1">
                        {renderContent()}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default DashboardLayout;
