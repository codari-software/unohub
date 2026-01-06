
import { useNavigate } from 'react-router-dom';
import {
    Wallet,
    Timer,
    Zap,
    ArrowRight,
    Utensils,
    BookOpen,
    Link,
    Check
} from 'lucide-react';


export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0f1115] text-white selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-[#0f1115]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                            U
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            UnoHub
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                        <a href="#features" className="hover:text-white transition-colors">Funcionalidades</a>
                        <a href="#about" className="hover:text-white transition-colors">Sobre</a>
                        <a href="#pricing" className="hover:text-white transition-colors">Preços</a>
                    </div>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-2 rounded-full font-medium transition-all hover:scale-105 active:scale-95 text-sm"
                    >
                        Entrar
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6">
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-8 animate-fade-in">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        Novo: Dashboard Financeiro 2.0 disponível
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent max-w-4xl mx-auto leading-[1.1]">
                        Gerencie sua vida tudo <br className="hidden md:block" /> em <span className="text-indigo-500">um só lugar</span>.
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                        UnoHub integra suas finanças, ferramentas de produtividade e dados pessoais em um único painel bonito. Pare de trocar de aplicativos e comece a viver.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 group"
                        >
                            Começar Grátis
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button className="w-full md:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-bold text-lg transition-all hover:-translate-y-1 backdrop-blur-sm">
                            Ver Demo
                        </button>
                    </div>
                </div>

                {/* Background Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10 pointer-events-none">
                    <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse delay-75"></div>
                    <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
                </div>
            </section>

            {/* Dashboard Preview */}
            <section className="px-6 pb-32">
                <div className="max-w-6xl mx-auto">
                    <div className="relative rounded-3xl bg-[#1e232d]/40 border border-white/10 p-2 backdrop-blur-sm shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl pointer-events-none"></div>
                        <img
                            src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2874&auto=format&fit=crop"
                            alt="Dashboard Preview"
                            className="rounded-2xl w-full h-auto opacity-90 border border-white/5"
                        />

                        {/* Floating Cards Mockup */}
                        <div className="absolute -bottom-10 -left-10 md:bottom-10 md:-left-12 p-6 bg-[#1e232d] border border-white/10 rounded-2xl shadow-2xl animate-float hidden md:block">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="p-3 bg-emerald-500/10 rounded-xl">
                                    <Wallet className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">Economia Mensal</p>
                                    <p className="text-xl font-bold text-white">R$ 2.450,00</p>
                                </div>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full w-[70%] bg-emerald-500 rounded-full"></div>
                            </div>
                        </div>

                        <div className="absolute -top-10 -right-10 md:top-10 md:-right-12 p-6 bg-[#1e232d] border border-white/10 rounded-2xl shadow-2xl animate-float-delayed hidden md:block">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-rose-500/10 rounded-xl">
                                    <Timer className="w-6 h-6 text-rose-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">Tempo de Foco</p>
                                    <p className="text-xl font-bold text-white">4h 25m</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features (The Solution) */}
            <section id="features" className="py-24 px-6 bg-[#0f1115]">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FeatureCard
                            icon={Wallet}
                            title="Financeiro"
                            description="Saiba exatamente para onde vai seu dinheiro."
                            color="emerald"
                        />
                        <FeatureCard
                            icon={Timer}
                            title="Pomodoro"
                            description="Foco profundo e ininterrupto com um clique."
                            color="rose"
                        />
                        <FeatureCard
                            icon={Utensils}
                            title="Dieta"
                            description="Nutrição planejada baseada na sua rotina."
                            color="orange"
                        />
                        <FeatureCard
                            icon={BookOpen}
                            title="Estudos"
                            description="Seu segundo cérebro, agora organizado."
                            color="cyan"
                        />
                    </div>
                </div>
            </section>

            {/* Integration Magic */}
            <section className="py-24 px-6 bg-[#161b22]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
                    <div className="flex-1 space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium">
                            <Zap size={16} /> A Magia da Integração
                        </div>
                        <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            Tudo conectado automaticamente.
                        </h2>
                        <p className="text-lg text-slate-400 leading-relaxed">
                            Quando você marca um jantar no Calendário, nós ajustamos sua meta de calorias na Dieta e reservamos o orçamento no Financeiro. Sem planilhas, sem esforço manual.
                        </p>
                        <ul className="space-y-4 text-slate-300">
                            <li className="flex items-center gap-3">
                                <div className="p-1 rounded-full bg-green-500/20 text-green-400"><Check size={14} /></div>
                                Sincronização em tempo real
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="p-1 rounded-full bg-green-500/20 text-green-400"><Check size={14} /></div>
                                Automações inteligentes
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="p-1 rounded-full bg-green-500/20 text-green-400"><Check size={14} /></div>
                                Economize +5 horas por semana
                            </li>
                        </ul>
                    </div>
                    <div className="flex-1 relative">
                        {/* Mockup visual representation */}
                        <div className="relative z-10 p-2 bg-gradient-to-b from-white/10 to-transparent rounded-3xl border border-white/10 backdrop-blur-xl">
                            <div className="bg-[#0f1115] rounded-2xl p-6 space-y-4">
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1e232d] border border-white/5">
                                    <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-400"><Link size={20} /></div>
                                    <div>
                                        <p className="font-semibold text-white">Nova reunião criada</p>
                                        <p className="text-xs text-slate-500">Google Calendar • 18:00</p>
                                    </div>
                                </div>
                                <div className="w-0.5 h-6 bg-white/10 mx-auto"></div>
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1e232d] border border-white/5 opacity-80">
                                    <div className="p-3 bg-red-500/20 rounded-lg text-red-400"><Timer size={20} /></div>
                                    <div>
                                        <p className="font-semibold text-white">Modo Foco pausado</p>
                                        <p className="text-xs text-slate-500">Pomodoro • Automático</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof & Trust */}
            <section className="py-24 px-6 bg-[#0f1115] border-t border-white/5">
                <div className="max-w-4xl mx-auto text-center space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
                        <div>
                            <p className="text-3xl font-bold text-white mb-1">+2k</p>
                            <p className="text-sm text-slate-500">Usuários Ativos</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white mb-1">100%</p>
                            <p className="text-sm text-slate-500">Criptografado</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white mb-1">4.9/5</p>
                            <p className="text-sm text-slate-500">Avaliação Média</p>
                        </div>
                    </div>
                    <div className="bg-[#1e232d]/40 p-8 rounded-2xl border border-white/5 max-w-2xl mx-auto">
                        <div className="flex gap-1 text-yellow-500 justify-center mb-4">
                            {[1, 2, 3, 4, 5].map(i => <div key={i}>★</div>)}
                        </div>
                        <p className="text-lg text-slate-300 italic mb-6">"Finalmente parei de usar 7 apps diferentes. O Financeiro integrado com minhas metas pessoais mudou meu jogo."</p>
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-700"></div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-white">Carlos M.</p>
                                <p className="text-xs text-slate-500">Beta Tester</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-24 px-6 bg-[#161b22]">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-white mb-12">Dúvidas Comuns</h2>
                    <div className="space-y-6">
                        <FaqItem question="É realmente grátis?" answer="Sim, o plano básico é gratuito para sempre. Você tem acesso a todos os módulos essenciais sem pagar nada." />
                        <FaqItem question="Posso importar meus dados?" answer="Sim! Temos importação fácil de planilhas CSV e Excel para você não começar do zero." />
                        <FaqItem question="Meus dados estão seguros?" answer="Absolutamente. Usamos criptografia de ponta a ponta e não vendemos seus dados para terceiros." />
                        <FaqItem question="Tem aplicativo para celular?" answer="Sim, o UnoHub é um PWA (Web App Progressivo) que funciona perfeitamente no seu Android ou iOS." />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6">
                <div className="max-w-5xl mx-auto bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-3xl p-8 md:p-16 text-center border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>

                    <div className="max-w-5xl mx-auto bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-3xl p-8 md:p-16 text-center border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>

                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 relative z-10">
                            Pronto para organizar sua vida?
                        </h2>
                        <p className="text-indigo-200 text-lg mb-10 max-w-2xl mx-auto relative z-10">
                            Leve apenas 2 minutos para configurar sua nova rotina.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-10 py-5 bg-white text-indigo-900 rounded-full font-bold text-xl hover:bg-indigo-50 transition-all hover:scale-105 shadow-xl relative z-10"
                        >
                            Criar Conta Grátis
                        </button>
                        <p className="text-xs text-indigo-300/60 mt-4 relative z-10">Sem cartão de crédito necessário.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 opacity-50">
                        <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center font-bold text-xs">U</div>
                        <span className="font-semibold">UnoHub</span>
                    </div>
                    <div className="text-slate-500 text-sm">
                        © 2026 UnoHub Inc. Todos os direitos reservados.
                    </div>
                    <div className="flex gap-6 text-slate-500">
                        <a href="#" className="hover:text-slate-300">Privacidade</a>
                        <a href="#" className="hover:text-slate-300">Termos</a>
                        <a href="#" className="hover:text-slate-300">Twitter</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, description, color = 'indigo' }: any) {
    const colors: any = {
        emerald: 'text-emerald-400 bg-emerald-500/10',
        rose: 'text-rose-400 bg-rose-500/10',
        orange: 'text-orange-400 bg-orange-500/10',
        cyan: 'text-cyan-400 bg-cyan-500/10',
        indigo: 'text-indigo-400 bg-indigo-500/10'
    };

    return (
        <div className="p-8 rounded-3xl bg-[#1e232d]/40 border border-white/5 hover:border-white/10 transition-all hover:bg-[#1e232d]/60 group text-left">
            <div className={`w-14 h-14 rounded-2xl ${colors[color]} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-slate-400 leading-relaxed font-light">
                {description}
            </p>
        </div>
    );
}

function FaqItem({ question, answer }: any) {
    return (
        <div className="bg-[#1e232d]/40 border border-white/5 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">{question}</h3>
            <p className="text-slate-400">{answer}</p>
        </div>
    );
}
