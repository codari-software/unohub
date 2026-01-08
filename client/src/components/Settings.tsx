import { useState } from 'react';
import { Bell, Globe, Monitor, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
    const [emailNotif, setEmailNotif] = useState(true);
    const [pushNotif, setPushNotif] = useState(true);
    const [marketingNotif, setMarketingNotif] = useState(false);
    const [language, setLanguage] = useState('pt-BR');
    const { theme, setTheme } = useTheme();

    const handleSave = () => {
        toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
            loading: 'Salvando preferências...',
            success: 'Configurações salvas com sucesso!',
            error: 'Erro ao salvar configurações'
        });
    };

    return (
        <div className="space-y-6 max-w-4xl animate-fade-in pb-10">
            {/* Appearance Section */}
            <div className="bg-[var(--color-card)] backdrop-blur-sm border border-[var(--color-border)] rounded-2xl p-6 overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                        <Monitor size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Aparência</h2>
                        <p className="text-sm text-[var(--color-text-secondary)]">Personalize como o UnoHub se parece para você</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-sm font-medium text-[var(--color-text-primary)] mb-3 block">Tema da Interface</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <button
                                onClick={() => setTheme('light')}
                                className={`group relative p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-3 ${theme === 'light' ? 'border-indigo-500 bg-[var(--color-bg)]' : 'border-[var(--color-border)] hover:border-[var(--color-text-secondary)] bg-[var(--color-sidebar)]'}`}
                            >
                                <div className="w-full h-24 bg-[#f0f2f5] rounded-lg border border-slate-200 shadow-sm overflow-hidden relative">
                                    <div className="absolute top-0 left-0 w-8 h-full bg-white border-r border-slate-200"></div>
                                    <div className="absolute top-3 left-10 w-20 h-4 bg-white rounded-md shadow-sm"></div>
                                </div>
                                <span className={`text-sm font-medium group-hover:text-[var(--color-text-primary)] ${theme === 'light' ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>Claro</span>
                                {theme === 'light' && <div className="absolute top-3 right-3 text-indigo-500"><Check size={16} /></div>}
                            </button>

                            <button
                                onClick={() => setTheme('dark')}
                                className={`group relative p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-3 ${theme === 'dark' ? 'border-indigo-500 bg-[var(--color-bg)]' : 'border-[var(--color-border)] hover:border-[var(--color-text-secondary)] bg-[var(--color-sidebar)]'}`}
                            >
                                <div className="w-full h-24 bg-[#0f1115] rounded-lg border border-white/10 shadow-sm overflow-hidden relative">
                                    <div className="absolute top-0 left-0 w-8 h-full bg-[#161b22] border-r border-white/5"></div>
                                    <div className="absolute top-3 left-10 w-20 h-4 bg-[#1e232d] rounded-md shadow-sm border border-white/5"></div>
                                </div>
                                <span className={`text-sm font-medium group-hover:text-[var(--color-text-primary)] ${theme === 'dark' ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>Escuro</span>
                                {theme === 'dark' && <div className="absolute top-3 right-3 text-indigo-500"><Check size={16} /></div>}
                            </button>

                            <button
                                onClick={() => setTheme('system')}
                                className={`group relative p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-3 ${theme === 'system' ? 'border-indigo-500 bg-[var(--color-bg)]' : 'border-[var(--color-border)] hover:border-[var(--color-text-secondary)] bg-[var(--color-sidebar)]'}`}
                            >
                                <div className="w-full h-24 bg-gradient-to-br from-[#0f1115] to-[#f0f2f5] rounded-lg border border-[var(--color-border)] shadow-sm overflow-hidden relative flex items-center justify-center">
                                    <Monitor size={24} className="text-slate-500" />
                                </div>
                                <span className={`text-sm font-medium group-hover:text-[var(--color-text-primary)] ${theme === 'system' ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>Sistema</span>
                                {theme === 'system' && <div className="absolute top-3 right-3 text-indigo-500"><Check size={16} /></div>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notifications Section */}
            <div className="bg-[var(--color-card)] backdrop-blur-sm border border-[var(--color-border)] rounded-2xl p-6 overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                        <Bell size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Notificações</h2>
                        <p className="text-sm text-[var(--color-text-secondary)]">Escolha como você quer ser notificado</p>
                    </div>
                </div>

                <div className="space-y-4 divide-y divide-[var(--color-border)]">
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">Alertas por Email</p>
                            <p className="text-xs text-[var(--color-text-secondary)]">Receba atualizações importantes via email</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={emailNotif} onChange={(e) => setEmailNotif(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-[var(--color-secondary)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between py-2 pt-4">
                        <div>
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">Notificações Push</p>
                            <p className="text-xs text-[var(--color-text-secondary)]">Receba notificações no seu navegador</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={pushNotif} onChange={(e) => setPushNotif(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-[var(--color-secondary)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between py-2 pt-4">
                        <div>
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">Emails de Marketing</p>
                            <p className="text-xs text-[var(--color-text-secondary)]">Receba novidades e ofertas especiais</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={marketingNotif} onChange={(e) => setMarketingNotif(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-[var(--color-secondary)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* General Settings */}
            <div className="bg-[var(--color-card)] backdrop-blur-sm border border-[var(--color-border)] rounded-2xl p-6 overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                        <Globe size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Geral</h2>
                        <p className="text-sm text-[var(--color-text-secondary)]">Idioma e região</p>
                    </div>
                </div>

                <div className="max-w-xs">
                    <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">Idioma</label>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl p-3 text-[var(--color-text-primary)] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all cursor-pointer"
                    >
                        <option value="pt-BR" className="bg-[#161b22] dark:bg-[#161b22] text-white">Português (Brasil)</option>
                        <option value="en-US" className="bg-[#161b22] dark:bg-[#161b22] text-white">English (US)</option>
                        <option value="es" className="bg-[#161b22] dark:bg-[#161b22] text-white">Español</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSave}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95"
                >
                    Salvar Preferências
                </button>
            </div>
        </div>
    );
}
