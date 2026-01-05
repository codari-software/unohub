import { Wallet, Timer, CheckSquare, TrendingUp } from 'lucide-react';

export default function Dashboard() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                icon={Wallet}
                title="Saldo Atual"
                value="R$ 12.450,00"
                change="+15%"
                colorClass="text-emerald-400 bg-emerald-400/10"
                iconColor="#34d399"
            />
            <StatCard
                icon={Timer}
                title="Foco Hoje"
                value="4h 12m"
                change="Target: 6h"
                colorClass="text-indigo-400 bg-indigo-400/10"
                iconColor="#818cf8"
            />
            <StatCard
                icon={CheckSquare}
                title="Tarefas"
                value="8 / 12"
                change="66% Done"
                colorClass="text-pink-400 bg-pink-400/10"
                iconColor="#f472b6"
            />
            <StatCard
                icon={TrendingUp}
                title="Produtividade"
                value="Top 5%"
                change="Level up!"
                colorClass="text-amber-400 bg-amber-400/10"
                iconColor="#fbbf24"
            />

            <div className="col-span-1 lg:col-span-2 bg-[#1e232d]/70 border border-white/5 rounded-2xl p-6 backdrop-blur-xl hover:border-white/10 transition-colors">
                <h3 className="text-lg font-semibold mb-6 text-white">Atividades Recentes</h3>
                <div className="flex flex-col gap-4 text-sm">
                    <ActivityItem text="Completou Sessão Pomodoro (25m)" time="10 min atrás" />
                    <ActivityItem text="Pagou Conta de Luz" time="2h atrás" />
                    <ActivityItem text="Novo Flashcard Criado: React Hooks" time="5h atrás" />
                </div>
            </div>

            <div className="col-span-1 bg-[#1e232d]/70 border border-white/5 rounded-2xl p-6 backdrop-blur-xl hover:border-white/10 transition-colors">
                <h3 className="text-lg font-semibold mb-6 text-white">Próximos Eventos</h3>
                <div className="flex flex-col gap-4 text-sm">
                    <EventItem title="Reunião de Equipe" time="14:00" />
                    <EventItem title="Academia" time="18:30" />
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, title, value, change, colorClass, iconColor }: any) {
    return (
        <div className="bg-[#1e232d]/70 border border-white/5 rounded-2xl p-6 backdrop-blur-xl hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl hover:border-white/10 flex flex-col gap-3 group">
            <div className="flex justify-between items-start">
                <div className={`p-3 rounded-xl transition-colors duration-300 ${colorClass.split(' ')[1] || ''} group-hover:bg-opacity-20`}>
                    <Icon size={24} color={iconColor} />
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-md font-medium border border-transparent ${colorClass}`}>
                    {change}
                </span>
            </div>
            <div className="mt-2">
                <span className="text-slate-400 text-sm font-medium tracking-wide">{title}</span>
                <h2 className="text-2xl font-bold text-white mt-1 tracking-tight">{value}</h2>
            </div>
        </div>
    );
}

function ActivityItem({ text, time }: any) {
    return (
        <div className="flex justify-between items-center pb-3 border-b border-white/5 last:border-0 last:pb-0 hover:bg-white/5 p-2 rounded-lg transition-colors -mx-2">
            <span className="text-slate-200 font-medium">{text}</span>
            <span className="text-slate-500 text-xs">{time}</span>
        </div>
    )
}

function EventItem({ title, time }: any) {
    return (
        <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all group cursor-pointer">
            <div className="w-1 h-8 bg-indigo-500 rounded-full group-hover:h-10 transition-all duration-300"></div>
            <div>
                <h4 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">{title}</h4>
                <span className="text-slate-400 text-xs">{time}</span>
            </div>
        </div>
    )
}
