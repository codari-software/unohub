import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Mail, Lock, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileProps {
    onProfileUpdate?: () => void;
}

export default function Profile({ onProfileUpdate }: ProfileProps) {
    const [loading, setLoading] = useState(false);
    const [updatingPassword, setUpdatingPassword] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');

    // Password states
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setEmail(user.email || '');
                setFullName(user.user_metadata?.full_name || '');
            }
        };
        getUser();
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            });

            if (error) throw error;
            toast.success('Perfil atualizado com sucesso!');
            if (onProfileUpdate) onProfileUpdate();
        } catch (error: any) {
            console.error(error);
            toast.error('Erro ao atualizar perfil.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('As senhas não coincidem.');
            return;
        }

        if (password.length < 6) {
            toast.error('A senha deve ter no mínimo 6 caracteres.');
            return;
        }

        setUpdatingPassword(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            toast.success('Senha atualizada com sucesso!');
            setPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error(error);
            toast.error('Erro ao atualizar senha.');
        } finally {
            setUpdatingPassword(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl animate-fade-in">
            {/* Header section similar to other dashboard pages usually handled by layout but good to have structure */}

            {/* Personal Information Card */}
            <div className="bg-[var(--color-card)] backdrop-blur-sm border border-[var(--color-border)] rounded-2xl p-6 overflow-hidden relative">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <User size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Informações Pessoais</h2>
                        <p className="text-sm text-[var(--color-text-secondary)]">Gerencie suas informações básicas de identificação</p>
                    </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--color-text-secondary)] ml-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-3.5 text-[var(--color-text-secondary)]" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    disabled
                                    className="w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl p-3 pl-11 text-[var(--color-text-secondary)] cursor-not-allowed outline-none"
                                />
                            </div>
                            <p className="text-xs text-[var(--color-text-secondary)] ml-1">O email não pode ser alterado.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--color-text-secondary)] ml-1">Nome Completo</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-3.5 text-[var(--color-text-secondary)] group-focus-within:text-indigo-400 transition-colors" size={18} />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Seu nome completo"
                                    className="w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl p-3 pl-11 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-5 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>

            {/* Security Section */}
            <div className="bg-[var(--color-card)] backdrop-blur-sm border border-[var(--color-border)] rounded-2xl p-6 overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
                        <Lock size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Segurança</h2>
                        <p className="text-sm text-[var(--color-text-secondary)]">Atualize sua senha de acesso</p>
                    </div>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-5 max-w-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--color-text-secondary)] ml-1">Nova Senha</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-3.5 text-[var(--color-text-secondary)] group-focus-within:text-indigo-400 transition-colors" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl p-3 pl-11 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--color-text-secondary)] ml-1">Confirmar Senha</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-3.5 text-[var(--color-text-secondary)] group-focus-within:text-indigo-400 transition-colors" size={18} />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl p-3 pl-11 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={updatingPassword || (!password && !confirmPassword)}
                            className="bg-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/80 text-white font-medium py-2.5 px-5 rounded-xl transition-all hover:shadow-lg hover:shadow-slate-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {updatingPassword ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            Atualizar Senha
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
