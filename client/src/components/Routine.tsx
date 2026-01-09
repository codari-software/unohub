import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Plus,
    Trash2,
    Check,
    Calendar as CalendarIcon,
    MoreVertical,
    Flame,
    Sun,
    Cloud,
    Moon,
    Clock,
    X,
    Repeat
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { format, addDays, subDays, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Types ---
interface Habit {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    period: 'morning' | 'afternoon' | 'evening' | 'anytime';
    frequency: string[]; // ['mon', 'tue', ...] or 'daily'
    color: string;
    created_at: string;
}

interface HabitLog {
    id: string;
    habit_id: string;
    date: string; // YYYY-MM-DD
    completed_at: string;
}

// --- Constants ---
const PERIODS = {
    morning: { label: 'Manhã', icon: Sun, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    afternoon: { label: 'Tarde', icon: Cloud, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    evening: { label: 'Noite', icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    anytime: { label: 'Qualquer hora', icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/10' }
};

const COLORS = [
    'bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500',
    'bg-sky-500', 'bg-violet-500', 'bg-pink-500', 'bg-slate-500'
];

const WEEKDAYS = [
    { id: 'sun', label: 'D' },
    { id: 'mon', label: 'S' },
    { id: 'tue', label: 'T' },
    { id: 'wed', label: 'Q' },
    { id: 'thu', label: 'Q' },
    { id: 'fri', label: 'S' },
    { id: 'sat', label: 'S' }
];

export default function Routine() {
    // --- State ---
    const [currentDate, setCurrentDate] = useState(new Date());
    const [habits, setHabits] = useState<Habit[]>([]);
    const [logs, setLogs] = useState<HabitLog[]>([]);

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ visible: boolean; id: string | null }>({
        visible: false,
        id: null
    });
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        period: 'anytime' as keyof typeof PERIODS,
        color: 'bg-indigo-500',
        frequency: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] // Default daily
    });

    // --- Effects ---
    useEffect(() => {
        fetchHabits();
    }, []);

    useEffect(() => {
        fetchLogs(currentDate);
    }, [currentDate, habits]); // Re-fetch logs when date/habits change

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (deleteConfirmation.visible) {
                    setDeleteConfirmation({ visible: false, id: null });
                } else if (isModalOpen) {
                    closeModal();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen, deleteConfirmation.visible]);

    // --- Actions ---
    const fetchHabits = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('habits')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setHabits(data || []);
        } catch (error) {
            console.error('Error fetching habits:', error);
        }
    };

    const fetchLogs = async (date: Date) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const dateStr = format(date, 'yyyy-MM-dd');

            const { data, error } = await supabase
                .from('habit_logs')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', dateStr);

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
        }
    };

    const handleCreateOrUpdate = async () => {
        if (!formData.title.trim()) return toast.error("O título é obrigatório.");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const payload = {
                user_id: user.id,
                title: formData.title,
                description: formData.description,
                period: formData.period,
                color: formData.color,
                frequency: formData.frequency
            };

            if (editingHabit) {
                const { error } = await supabase
                    .from('habits')
                    .update(payload)
                    .eq('id', editingHabit.id);

                if (error) throw error;
                setHabits(prev => prev.map(h => h.id === editingHabit.id ? { ...h, ...payload } : h));
                toast.success("Hábito atualizado!");
            } else {
                const { data, error } = await supabase
                    .from('habits')
                    .insert([payload])
                    .select()
                    .single();

                if (error) throw error;
                setHabits(prev => [...prev, data]);
                toast.success("Novo hábito criado!");
            }
            closeModal();
        } catch (error) {
            console.error('Error saving habit:', error);
            toast.error("Erro ao salvar. Verifique se a tabela 'habits' existe.");
        }
    };

    const initiateDelete = (id: string) => {
        setDeleteConfirmation({ visible: true, id });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation.id) return;
        const id = deleteConfirmation.id;

        // Optimistic
        setHabits(prev => prev.filter(h => h.id !== id));
        setDeleteConfirmation({ visible: false, id: null });

        try {
            const { error } = await supabase.from('habits').delete().eq('id', id);
            if (error) throw error;
            toast.success("Hábito excluído.");
        } catch (err) {
            console.error(err);
            toast.error("Erro ao excluir.");
            fetchHabits(); // Re-sync
        }
    };

    const toggleHabit = async (habitId: string) => {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const existingLog = logs.find(l => l.habit_id === habitId && l.date === dateStr);

        // Optimistic
        if (existingLog) {
            setLogs(prev => prev.filter(l => l.id !== existingLog.id));
        } else {
            const tempLog = { id: 'temp-' + Date.now(), habit_id: habitId, date: dateStr, completed_at: new Date().toISOString() };
            setLogs(prev => [...prev, tempLog]);
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            if (existingLog) {
                await supabase.from('habit_logs').delete().eq('id', existingLog.id);
            } else {
                const { data } = await supabase.from('habit_logs').insert([{
                    habit_id: habitId,
                    user_id: user.id,
                    date: dateStr
                }]).select().single();

                // Update temp ID with real ID
                if (data) {
                    setLogs(prev => prev.map(l => l.id.startsWith('temp-') && l.habit_id === habitId ? data : l));
                }
            }
        } catch (err) {
            console.error(err);
            toast.error("Erro ao atualizar status.");
            fetchLogs(currentDate); // Revert
        }
    };

    const openEdit = (habit: Habit) => {
        setEditingHabit(habit);
        setFormData({
            title: habit.title,
            description: habit.description || '',
            period: habit.period,
            color: habit.color,
            frequency: habit.frequency || WEEKDAYS.map(d => d.id)
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingHabit(null);
        setFormData({
            title: '',
            description: '',
            period: 'anytime',
            color: 'bg-indigo-500',
            frequency: WEEKDAYS.map(d => d.id)
        });
    };

    const toggleDay = (dayId: string) => {
        setFormData(prev => {
            const exists = prev.frequency.includes(dayId);
            if (exists) return { ...prev, frequency: prev.frequency.filter(d => d !== dayId) };
            return { ...prev, frequency: [...prev.frequency, dayId] };
        });
    };

    // --- Derived State ---
    const dayMap: Record<string, string> = { 'Sun': 'sun', 'Mon': 'mon', 'Tue': 'tue', 'Wed': 'wed', 'Thu': 'thu', 'Fri': 'fri', 'Sat': 'sat' };

    // Filter habits for current day
    const currentDayId = dayMap[format(currentDate, 'eee')];

    const todaysHabits = habits.filter(h => {
        // If frequency is empty, maybe assume daily? Or just don't show. Let's assume daily if missing.
        if (!h.frequency || h.frequency.length === 0) return true;
        return h.frequency.includes(currentDayId);
    });

    // Group by period
    const groupedHabits = {
        morning: todaysHabits.filter(h => h.period === 'morning'),
        afternoon: todaysHabits.filter(h => h.period === 'afternoon'),
        evening: todaysHabits.filter(h => h.period === 'evening'),
        anytime: todaysHabits.filter(h => h.period === 'anytime')
    };

    const completionRate = todaysHabits.length > 0
        ? Math.round((logs.length / todaysHabits.length) * 100)
        : 0;

    return (
        <div className="h-full flex flex-col gap-6 animate-fade-in pb-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[var(--color-card)] border border-[var(--color-border)] p-5 rounded-2xl shadow-sm md:sticky md:top-0 z-20 backdrop-blur-xl">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Minha Rotina</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        {isToday(currentDate) ? 'Hoje é o melhor dia para vencer.' : `Planejamento para ${format(currentDate, "dd 'de' MMMM", { locale: ptBR })}`}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Date Nav */}
                    <div className="flex items-center gap-2 bg-[var(--color-glass)] p-1 rounded-xl border border-[var(--color-border)]">
                        <button onClick={() => setCurrentDate(prev => subDays(prev, 1))} className="p-2 hover:bg-[var(--color-card)] rounded-lg text-[var(--color-text-secondary)] transition-colors">
                            <CalendarIcon size={18} className="rotate-90" /> {/* Reuse Icon nicely */}
                        </button>
                        <span className="w-32 text-center text-sm font-medium text-[var(--color-text-primary)]">
                            {isToday(currentDate) ? 'Hoje' : format(currentDate, "dd MMM", { locale: ptBR })}
                        </span>
                        <button onClick={() => setCurrentDate(prev => addDays(prev, 1))} className="p-2 hover:bg-[var(--color-card)] rounded-lg text-[var(--color-text-secondary)] transition-colors">
                            <CalendarIcon size={18} className="-rotate-90" />
                        </button>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                    >
                        <Plus size={20} />
                        <span className="hidden md:inline">Novo Hábito</span>
                    </button>
                </div>
            </div>

            {/* Progress Bar (Daily) */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl flex items-center gap-6 relative overflow-hidden">
                <div className="relative z-10 flex-1">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <p className="text-sm font-medium text-[var(--color-text-secondary)]">Progresso Diário</p>
                            <h3 className="text-3xl font-bold text-[var(--color-text-primary)] mt-1">{completionRate}%</h3>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-sm text-[var(--color-text-primary)] font-medium">{logs.length}/{todaysHabits.length}</span>
                            <span className="text-xs text-[var(--color-text-secondary)]">Hábitos concluídos</span>
                        </div>
                    </div>
                    <div className="h-3 w-full bg-[var(--color-glass)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                            style={{ width: `${completionRate}%` }}
                        ></div>
                    </div>
                </div>
                <div className="hidden md:block p-4 bg-amber-500/10 rounded-full text-amber-500 relative z-10">
                    <Flame size={32} />
                </div>
            </div>

            {/* Content Lists */}
            <div className="flex-1 space-y-6">
                {(Object.entries(groupedHabits) as [keyof typeof PERIODS, Habit[]][]).map(([key, group]) => {
                    if (group.length === 0) return null;
                    const PeriodIcon = PERIODS[key].icon;

                    return (
                        <div key={key} className="space-y-3">
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider pl-1">
                                <PeriodIcon size={16} className={PERIODS[key].color} />
                                {PERIODS[key].label}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {group.map(habit => {
                                    const isCompleted = logs.some(l => l.habit_id === habit.id);
                                    return (
                                        <div
                                            key={habit.id}
                                            className={`
                                                group relative flex items-center gap-4 bg-[var(--color-card)] border border-[var(--color-border)] p-4 rounded-xl transition-all
                                                ${isCompleted ? 'opacity-75 saturate-50 bg-[var(--color-glass)]' : 'hover:shadow-md hover:border-indigo-500/30'}
                                            `}
                                        >
                                            <button
                                                onClick={() => toggleHabit(habit.id)}
                                                className={`
                                                    min-w-[48px] h-12 rounded-xl flex items-center justify-center transition-all duration-300
                                                    ${isCompleted
                                                        ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                                        : `bg-[var(--color-glass)] text-[var(--color-text-secondary)] hover:bg-emerald-500/10 hover:text-emerald-500`
                                                    }
                                                `}
                                            >
                                                <Check size={24} className={`transition-transform duration-300 ${isCompleted ? 'scale-100' : 'scale-75 opacity-50'}`} />
                                            </button>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h4 className={`font-semibold truncate ${isCompleted ? 'text-[var(--color-text-secondary)] line-through' : 'text-[var(--color-text-primary)]'}`}>
                                                        {habit.title}
                                                    </h4>
                                                </div>
                                                {habit.description && (
                                                    <p className="text-xs text-[var(--color-text-secondary)] line-clamp-1">{habit.description}</p>
                                                )}
                                                <div className="flex gap-1 mt-1">
                                                    <div className={`w-2 h-2 rounded-full ${habit.color}`}></div>
                                                </div>
                                            </div>

                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                <button onClick={() => openEdit(habit)} className="p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-glass)] rounded">
                                                    <MoreVertical size={14} />
                                                </button>
                                                <button onClick={() => initiateDelete(habit.id)} className="p-1.5 text-[var(--color-text-secondary)] hover:text-rose-400 hover:bg-rose-500/10 rounded">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {todaysHabits.length === 0 && (
                    <div className="text-center py-20 text-[var(--color-text-secondary)]">
                        <Repeat size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-lg">Nenhum hábito para hoje.</p>
                        <p className="text-sm opacity-60">Adicione hábitos para começar a rastrear sua rotina.</p>
                        <button onClick={() => setIsModalOpen(true)} className="mt-4 text-indigo-400 font-medium hover:underline">Criar Hábito</button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={closeModal}>
                    <div
                        className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-5 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-bg)]/50">
                            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                                {editingHabit ? 'Editar Hábito' : 'Novo Hábito'}
                            </h3>
                            <button onClick={closeModal} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5 overflow-y-auto">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[var(--color-text-secondary)]">Título</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Ex: Beber 2L de água, Ler 10 páginas..."
                                    className="w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-text-primary)] focus:border-indigo-500 outline-none transition-all"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[var(--color-text-secondary)]">Descrição</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Detalhes opcionais..."
                                    className="w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-text-primary)] focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[var(--color-text-secondary)]">Frequência</label>
                                <div className="flex justify-between gap-1">
                                    {WEEKDAYS.map(day => {
                                        const isSelected = formData.frequency.includes(day.id);
                                        return (
                                            <button
                                                key={day.id}
                                                onClick={() => toggleDay(day.id)}
                                                className={`
                                                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
                                                    ${isSelected
                                                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                                        : 'bg-[var(--color-glass)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}
                                                `}
                                            >
                                                {day.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-[var(--color-text-secondary)]">Período</label>
                                    <div className="relative">
                                        <select
                                            value={formData.period}
                                            onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value as any }))}
                                            className="w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-text-primary)] focus:border-indigo-500 outline-none appearance-none cursor-pointer"
                                        >
                                            {Object.entries(PERIODS).map(([key, val]) => (
                                                <option key={key} value={key} className="bg-[var(--color-card)] text-[var(--color-text-primary)]">{val.label}</option>
                                            ))}
                                        </select>
                                        <Clock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-[var(--color-text-secondary)]">Cor</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {COLORS.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setFormData(prev => ({ ...prev, color }))}
                                                className={`w-6 h-6 rounded-full ${color} ${formData.color === color ? 'ring-2 ring-offset-2 ring-indigo-500 ring-offset-[var(--color-card)]' : 'opacity-70 hover:opacity-100'} transition-all`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t border-[var(--color-border)] flex gap-3 justify-end bg-[var(--color-bg)]/50">
                            <button
                                onClick={closeModal}
                                className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-glass)] hover:text-[var(--color-text-primary)] font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateOrUpdate}
                                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                            >
                                {editingHabit ? 'Salvar' : 'Criar Hábito'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {deleteConfirmation.visible && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4 animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col gap-2">
                            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Excluir hábito?</h3>
                            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                                Tem certeza que deseja excluir este hábito? Todo o histórico de progresso dele também será apagado.
                                <br />
                                <span className="text-amber-500 font-medium mt-1 inline-block">Essa ação não pode ser desfeita.</span>
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-2">
                            <button
                                onClick={() => setDeleteConfirmation({ visible: false, id: null })}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-glass)] transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white shadow-sm transition-colors"
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
