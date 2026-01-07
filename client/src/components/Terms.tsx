import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Terms() {
    const navigate = useNavigate();

    return (
        <div className="h-screen w-full bg-[#0f1115] text-slate-300 p-8 md:p-16 overflow-y-auto">
            <div className="max-w-4xl mx-auto animate-fade-in">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-8 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Voltar para o início
                </button>

                <h1 className="text-4xl font-bold text-white mb-8">Termos de Uso</h1>

                <div className="space-y-6 leading-relaxed bg-[#1e232d]/40 p-8 rounded-3xl border border-white/5">
                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">1. Aceitação dos Termos</h2>
                        <p>
                            Ao acessar e usar o UnoHub, você concorda em cumprir e ficar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, você não deve usar nossos serviços.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">2. Uso do Serviço</h2>
                        <p>
                            Você é responsável por manter a confidencialidade de sua conta e senha. O UnoHub não se responsabiliza por qualquer perda ou dano decorrente do não cumprimento desta obrigação de segurança.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">3. Conduta do Usuário</h2>
                        <p>
                            Você concorda em não usar o serviço para qualquer finalidade ilegal ou não autorizada. O uso indevido da plataforma pode resultar no encerramento imediato da sua conta.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">4. Propriedade Intelectual</h2>
                        <p>
                            O serviço e todo o seu conteúdo original, recursos e funcionalidades são e permanecerão de propriedade exclusiva do UnoHub e de seus licenciadores.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">5. Limitação de Responsabilidade</h2>
                        <p>
                            Em nenhum caso o UnoHub será responsável por quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos decorrentes do seu uso ou incapacidade de usar o serviço.
                        </p>
                    </section>
                </div>

                <p className="mt-8 text-sm text-slate-500">Última atualização: Janeiro de 2026</p>
            </div>
        </div>
    );
}
