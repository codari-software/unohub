import { Construction } from 'lucide-react';

export default function Placeholder({ title }: { title: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-[70vh] gap-6 text-slate-400 animate-fade-in">
            <div className="p-8 bg-indigo-500/10 rounded-full border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
                <Construction size={64} className="text-indigo-400" />
            </div>
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-white">{title} Em Desenvolvimento</h2>
                <p className="text-lg text-slate-500 max-w-md mx-auto">
                    Estamos construindo algo incrível aqui. Este módulo estará disponível na versão 1.1 do UnoHub.
                </p>
            </div>
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent rounded-full mt-4"></div>
        </div>
    );
}
