import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight, User, CheckCircle } from 'lucide-react';

export default function Auth() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);

    // Auth Step: 'auth' | 'link-sent'
    const [step, setStep] = useState<'auth' | 'link-sent'>('auth');

    // Form States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    // Cooldown state
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Effect to auto-detect verification (e.g. from another tab)
    useEffect(() => {
        let interval: any;

        if (step === 'link-sent') {
            const handleVerificationSuccess = async () => {
                // Prevent duplicate firing
                if (!step || step !== 'link-sent') return;

                // Force sign out so the user has to log in manually as requested
                await supabase.auth.signOut();

                setMessage({ type: 'success', text: 'Conta verificada com sucesso. Agora você pode logar.' });
                setStep('auth');
                setIsLogin(true);
            };

            // 1. Polling: Check session every 3 seconds
            // This catches if the user verified in a new tab/window
            interval = setInterval(async () => {
                const { data } = await supabase.auth.getSession();
                if (data.session) {
                    clearInterval(interval);
                    handleVerificationSuccess();
                }
            }, 3000);

            // 2. Listener: Real-time update (if supported by browser storage sync)
            const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN' || session) {
                    handleVerificationSuccess();
                }
            });

            return () => {
                if (interval) clearInterval(interval);
                authListener.subscription.unsubscribe();
            };
        }
    }, [step, navigate]);

    const translateError = (errorMsg: string) => {
        const msg = errorMsg.toLowerCase();
        if (msg.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
        if (msg.includes('user already registered')) return 'Este e-mail já está em uso. Tente fazer login.';
        if (msg.includes('password should be at least')) return 'A senha deve ter no mínimo 6 caracteres.';
        if (msg.includes('email not confirmed')) return 'E-mail não confirmado. Verifique sua caixa de entrada.';
        if (msg.includes('rate limit')) return 'Muitas tentativas. Aguarde um momento.';
        if (msg.includes('captcha')) return 'Erro de verificação. Tente novamente.';
        return 'Ocorreu um erro. Tente novamente.';
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            // Ensure we start with a clean state to prevent stale session detection
            await supabase.auth.signOut();

            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email: email.trim().toLowerCase(),
                    password,
                });

                if (error) throw error;
                navigate('/dashboard');
            } else {
                // Validation for Signup
                if (password !== confirmPassword) {
                    throw new Error('As senhas não coincidem.');
                }

                const { data, error } = await supabase.auth.signUp({
                    email: email.trim().toLowerCase(),
                    password,
                    options: {
                        data: {
                            full_name: name.trim(),
                        },
                        emailRedirectTo: window.location.origin + '/verify-success'
                    }
                });
                if (error) throw error;

                // Check for existing user (when "Email Enumeration Protection" is ENABLED in Supabase)
                // Supabase returns a fake user with empty identities array if user exists.
                if (data.user && data.user.identities && data.user.identities.length === 0) {
                    throw new Error('User already registered');
                }

                // Check if session exists (Auto-confirm enabled or Magic Link login)
                if (data.session) {
                    navigate('/dashboard');
                    return;
                }

                // Move to verification step
                setMessage({ type: 'success', text: 'Link de confirmação enviado para seu e-mail!' });
                setStep('link-sent');
                setResendCooldown(60);
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: translateError(error.message || error.toString()) });
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setMessage(null);
        try {
            // Re-sending signup confirmation link usually works by just trying to sign up again 
            // OR using the resend API. The resend API is cleaner.
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email.trim().toLowerCase(),
                options: {
                    emailRedirectTo: window.location.origin + '/dashboard'
                }
            });
            if (error) throw error;
            setMessage({ type: 'success', text: 'Novo link enviado! Verifique sua caixa de entrada.' });
            setResendCooldown(60);
        } catch (error: any) {
            setMessage({ type: 'error', text: translateError(error.message || error.toString()) });
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
                redirectTo: window.location.origin + '/update-password',
            });

            if (error) throw error;
            setMessage({ type: 'success', text: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.' });
        } catch (error: any) {
            setMessage({ type: 'error', text: translateError(error.message || error.toString()) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#0f1115] flex items-center justify-center p-4 relative overflow-x-hidden overflow-y-auto">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse delay-75"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
            </div>

            <div className="w-full max-w-lg animate-fade-in relative z-10 py-10">
                {/* Header */}
                <div className="text-center mb-6">
                    <img
                        onClick={() => navigate('/')}
                        src="/logo.png"
                        alt="UnoHub"
                        className="w-12 h-12 rounded-xl mx-auto shadow-xl shadow-indigo-500/20 mb-3 cursor-pointer hover:scale-105 transition-transform object-cover"
                    />
                    <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
                        {step === 'link-sent' ? 'Verifique seu e-mail' :
                            isForgotPassword ? 'Redefinir Senha' :
                                (isLogin ? 'Bem-vindo de volta' : 'Crie sua conta')}
                    </h1>
                    <p className="text-sm text-slate-400 max-w-sm mx-auto">
                        {step === 'link-sent'
                            ? `Enviamos um link de confirmação para ${email}`
                            : isForgotPassword ? 'Digite seu e-mail para receber um link de redefinição.'
                                : (isLogin ? 'Digite suas credenciais para acessar o painel.' : 'Preencha os dados abaixo para começar.')}
                    </p>
                </div>

                {/* Card */}
                <div className="bg-[#1e232d]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                    {step === 'link-sent' ? (
                        <div className="text-center space-y-6 animate-fade-in">
                            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mx-auto w-fit">
                                <Mail className="text-indigo-400 w-12 h-12" />
                            </div>

                            <div className="space-y-2">
                                <p className="text-slate-300">
                                    Para ativar sua conta, clique no link que acabamos de enviar para:
                                </p>
                                <p className="text-white font-medium bg-white/5 py-2 px-4 rounded-lg inline-block">
                                    {email}
                                </p>
                            </div>

                            <p className="text-xs text-slate-500 max-w-xs mx-auto">
                                Não encontrou? Verifique sua pasta de spam ou lixo eletrônico.
                            </p>

                            <div className="pt-4 flex flex-col gap-3">
                                <button
                                    onClick={handleResend}
                                    disabled={resendCooldown > 0}
                                    className="w-full bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-600/50 text-indigo-300 font-semibold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {resendCooldown > 0 ? `Reenviar link e-mail em ${resendCooldown}s` : 'Reenviar E-mail de Confirmação'}
                                </button>

                                <button
                                    onClick={() => { setStep('auth'); setIsLogin(true); setMessage(null); }}
                                    className="text-slate-400 hover:text-white text-sm transition-colors py-2"
                                >
                                    Voltar para Login
                                </button>
                            </div>

                            {message && (
                                <div className={`mt-4 p-3 rounded-xl text-xs font-medium ${message.type === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                    {message.text}
                                </div>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={isForgotPassword ? handleForgotPassword : handleAuth} className="space-y-5">
                            {/* Message Alert */}
                            {message && (
                                <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-center ${message.type === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                    {message.text}
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Name Field - Only for Signup */}
                                {!isLogin && !isForgotPassword && (
                                    <div className="relative group animate-fade-in">
                                        <User className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Seu nome completo"
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-3.5 pl-12 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-base"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required={!isLogin}
                                        />
                                    </div>
                                )}

                                <div className="relative group">
                                    <Mail className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                                    <input
                                        type="email"
                                        placeholder="seu@email.com"
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-3.5 pl-12 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-base"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                {!isForgotPassword && (
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                                        <input
                                            type="password"
                                            placeholder="Sua senha"
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-3.5 pl-12 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-base"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                )}

                                {/* Confirm Password Field - Only for Signup */}
                                {!isLogin && !isForgotPassword && (
                                    <div className="relative group animate-fade-in">
                                        <CheckCircle className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                                        <input
                                            type="password"
                                            placeholder="Confirme sua senha"
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-3.5 pl-12 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-base"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required={!isLogin}
                                            minLength={6}
                                        />
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-base"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        {isForgotPassword ? 'Enviar Link' : (isLogin ? 'Entrar' : 'Criar Conta')}
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {!isLogin && !isForgotPassword && step !== 'link-sent' && (
                        <div className="mt-6 text-center">
                            <p className="text-slate-400 text-sm">
                                Já tem uma conta?
                                <button
                                    onClick={() => { setIsLogin(true); setMessage(null); }}
                                    className="ml-2 text-indigo-400 hover:text-indigo-300 font-bold hover:underline transition-all"
                                >
                                    Fazer Login
                                </button>
                            </p>
                        </div>
                    )}

                    {isLogin && !isForgotPassword && step !== 'link-sent' && (
                        <div className="mt-6 text-center">
                            <p className="text-slate-400 text-sm">
                                Não tem uma conta?
                                <button
                                    onClick={() => { setIsLogin(false); setMessage(null); }}
                                    className="ml-2 text-indigo-400 hover:text-indigo-300 font-bold hover:underline transition-all"
                                >
                                    Cadastre-se
                                </button>
                            </p>
                            <button
                                onClick={() => { setIsForgotPassword(true); setMessage(null); }}
                                className="block mx-auto mt-6 text-slate-500 hover:text-slate-300 cursor-pointer transition-colors text-sm font-medium"
                            >
                                Esqueceu sua senha?
                            </button>
                        </div>
                    )}

                    {isForgotPassword && (
                        <div className="mt-6 text-center">
                            <button
                                onClick={() => { setIsForgotPassword(false); setMessage(null); }}
                                className="text-slate-400 hover:text-white text-sm transition-colors"
                            >
                                Voltar para Login
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

