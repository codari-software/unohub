import { useState, useEffect, useRef } from 'react';
import { LogOut, User, Settings, ChevronDown, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import Finance from '../components/Finance';
import Pomodoro from '../components/Pomodoro';
import Placeholder from '../components/Placeholder';

function DashboardLayout() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [user, setUser] = useState<any>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setIsLoadingUser(false);
        };
        getUser();

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
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
            case 'pomodoro': return <Pomodoro />;
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
        <div id="root-container" className="flex h-full w-full bg-[#0f1115] text-white overflow-hidden">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="flex-1 h-full overflow-y-auto overflow-x-hidden p-5 relative scroll-smooth pr-2 w-full max-w-full">
                <div className="max-w-7xl mx-auto h-full flex flex-col w-full">
                    <header className="mb-6 flex justify-between items-center py-3 bg-[#0f1115]/80 backdrop-blur-sm -mx-4 px-4 sticky top-0 z-40">
                        {isLoadingUser ? (
                            <div className="flex flex-col gap-2">
                                <div className="h-8 w-48 bg-white/5 rounded animate-pulse"></div>
                                <div className="h-4 w-32 bg-white/5 rounded animate-pulse"></div>
                            </div>
                        ) : (
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight">
                                    {activeTab === 'dashboard' ? 'Visão Geral' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                                </h1>
                                <p className="text-slate-400 text-sm mt-1">Bem-vindo de volta, {getUserName()}</p>
                            </div>
                        )}

                        <div className="flex gap-4 items-center">
                            {/* Notifications Placeholder */}
                            <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors relative">
                                <Bell size={20} />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#0f1115]"></span>
                            </button>

                            {/* User Profile Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                {isLoadingUser ? (
                                    <div className="flex items-center gap-3 bg-[#1e232d] p-1.5 pr-4 pl-2 rounded-full border border-white/5 animate-pulse">
                                        <div className="w-9 h-9 rounded-full bg-white/5"></div>
                                        <div className="h-4 w-24 bg-white/5 rounded hidden sm:block"></div>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                                            className="flex items-center gap-3 bg-[#1e232d] hover:bg-[#252b36] p-1.5 pr-4 pl-2 rounded-full border border-white/5 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 group"
                                        >
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 text-xs tracking-wider">
                                                {getInitials(getUserName())}
                                            </div>
                                            <div className="flex flex-col items-start hidden sm:flex">
                                                <span className="text-slate-200 font-medium text-sm leading-tight group-hover:text-white transition-colors">
                                                    {getUserName()}
                                                </span>
                                            </div>
                                            <ChevronDown size={14} className={`text-slate-500 ml-1 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isProfileOpen && (
                                            <div className="absolute right-0 top-full mt-2 w-64 bg-[#1e232d] border border-white/10 rounded-2xl shadow-2xl py-2 animate-fade-in z-50 backdrop-blur-xl ring-1 ring-black/5">
                                                <div className="px-5 py-4 border-b border-white/5 mb-2">
                                                    <p className="text-sm font-medium text-white">Logado como</p>
                                                    <p className="text-xs text-slate-400 truncate mt-1">{user?.email}</p>
                                                </div>

                                                <div className="px-2 space-y-1">
                                                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left">
                                                        <User size={16} className="text-indigo-400" /> Meu Perfil
                                                    </button>
                                                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left">
                                                        <Settings size={16} className="text-slate-400" /> Configurações
                                                    </button>
                                                </div>

                                                <div className="h-px bg-white/5 my-2 mx-2"></div>

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
