import {
    LayoutDashboard,
    Wallet,
    Timer,
    Apple,
    Calendar,
    BookOpen,
    CheckSquare,
    Clock,
    GraduationCap
} from 'lucide-react';

const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'finance', label: 'Financeiro', icon: Wallet },
    { id: 'pomodoro', label: 'Pomodoro', icon: Timer },
    { id: 'diet', label: 'Dieta', icon: Apple },
    { id: 'events', label: 'Eventos', icon: Calendar },
    { id: 'notes', label: 'Anotações', icon: BookOpen },
    { id: 'todo', label: 'To-Do', icon: CheckSquare },
    { id: 'routine', label: 'Rotina', icon: Clock },
    { id: 'flashcards', label: 'Flashcards', icon: GraduationCap },
];

export default function Sidebar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (id: string) => void }) {
    return (
        <aside className="w-[260px] bg-[#161b22]/95 border-r border-white/5 p-6 flex flex-col backdrop-blur-md z-10 transition-all duration-300">
            <div className="pb-8 flex items-center gap-3">
                <div className="w-10 h-10 shadow-lg shadow-indigo-500/20 rounded-lg overflow-hidden shrink-0">
                    <img src="/logo.png" alt="UnoHub" className="w-full h-full object-cover" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-wide">UnoHub</h2>
            </div>

            <nav className="flex flex-col gap-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-[0.95rem] text-left w-full
                ${isActive
                                    ? 'bg-indigo-500/15 text-white font-semibold shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white font-medium'}
              `}
                        >
                            <Icon size={20} className={isActive ? 'text-indigo-400' : 'currentColor'} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}
