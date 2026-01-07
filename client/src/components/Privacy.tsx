import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Privacy() {
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

                <h1 className="text-4xl font-bold text-white mb-8">Política de Privacidade</h1>

                <div className="space-y-6 leading-relaxed bg-[#1e232d]/40 p-8 rounded-3xl border border-white/5">
                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">1. Coleta de Dados</h2>
                        <p>
                            Nós levamos sua privacidade a sério. Coletamos apenas os dados estritamente necessários para o funcionamento da plataforma, como seu nome, e-mail e as informações que você insere nos módulos de produtividade (finanças, tarefas, etc).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">2. Uso das Informações</h2>
                        <p>
                            Suas informações são utilizadas exclusivamente para fornecer e melhorar nossos serviços. Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">3. Segurança</h2>
                        <p>
                            Implementamos medidas de segurança robustas, incluindo criptografia de ponta a ponta, para proteger seus dados contra acesso não autorizado, alteração ou destruição.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">4. Seus Direitos</h2>
                        <p>
                            Você tem o direito de acessar, corrigir ou excluir seus dados pessoais a qualquer momento. Basta entrar em contato com nosso suporte ou utilizar as ferramentas disponíveis no painel de configurações.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">5. Alterações</h2>
                        <p>
                            Podemos atualizar esta política periodicamente. Notificaremos você sobre quaisquer mudanças significativas através do nosso site ou por e-mail.
                        </p>
                    </section>
                </div>

                <p className="mt-8 text-sm text-slate-500">Última atualização: Janeiro de 2026</p>
            </div>
        </div>
    );
}
