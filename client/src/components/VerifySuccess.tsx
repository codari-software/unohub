import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

export default function VerifySuccess() {
    useEffect(() => {
        // Attempt to close the window after a short delay
        const timer = setTimeout(() => {
            window.close();
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen w-full bg-[#0f1115] flex items-center justify-center p-4">
            <div className="bg-[#1e232d]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center max-w-sm w-full">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                    <CheckCircle className="text-emerald-400 w-8 h-8" />
                </div>
                <h1 className="text-xl font-bold text-white mb-2">Conta Verificada!</h1>
                <p className="text-slate-400 text-sm mb-6">
                    Sua conta foi ativada com sucesso. Você pode fechar esta aba e retornar para a tela de login.
                </p>
                <button
                    onClick={() => window.close()}
                    className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold hover:underline"
                >
                    Fechar Agora
                </button>
            </div>
        </div>
    );
}
