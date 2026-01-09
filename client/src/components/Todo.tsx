import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Plus,
    Trash2,
    CheckCircle2,
    Calendar,
    Flag,
    Tag,
    Search,
    X,
    MoreVertical,
    Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { format, isPast, isToday, isTomorrow, formatDistanceToNow, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Types ---
interface Todo {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    is_completed: boolean;
    priority: 'low' | 'medium' | 'high';
    category: string | null;
    due_date: string | null; // ISO
    created_at: string;
}

// --- Constants ---
const PRIORITIES = {
    low: { label: 'Baixa', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    medium: { label: 'Média', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    high: { label: 'Alta', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' }
};

const CATEGORIES = [
    { id: 'work', label: 'Trabalho', color: 'bg-indigo-500' },
    { id: 'personal', label: 'Pessoal', color: 'bg-emerald-500' },
    { id: 'study', label: 'Estudos', color: 'bg-violet-500' },
    { id: 'shopping', label: 'Compras', color: 'bg-pink-500' },
    { id: 'health', label: 'Saúde', color: 'bg-cyan-500' },
    { id: 'other', label: 'Outros', color: 'bg-slate-500' }
];

export default function Todo() {
    // --- State ---
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ visible: boolean; id: string | null }>({
        visible: false,
        id: null
    });
    const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium' as 'low' | 'medium' | 'high',
        category: 'personal',
        due_date: ''
    });

    // --- Effects ---
    useEffect(() => {
        fetchTodos();
    }, []);

    // --- Actions ---
    const fetchTodos = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('todos')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTodos(data || []);
        } catch (error) {
            console.error('Error fetching todos:', error);
            // Don't toast on initial load error if table doesn't exist yet, purely for DX
        } finally {
            setLoading(false);
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
                priority: formData.priority,
                category: formData.category,
                due_date: formData.due_date || null
            };

            if (editingTodo) {
                const { error } = await supabase
                    .from('todos')
                    .update(payload)
                    .eq('id', editingTodo.id);

                if (error) throw error;

                setTodos(prev => prev.map(t => t.id === editingTodo.id ? { ...t, ...payload } : t));
                toast.success("Tarefa atualizada!");
            } else {
                const { data, error } = await supabase
                    .from('todos')
                    .insert([{ ...payload, is_completed: false }])
                    .select()
                    .single();

                if (error) throw error;

                setTodos(prev => [data, ...prev]);
                toast.success("Tarefa criada!");
            }

            closeModal();
        } catch (error) {
            console.error('Error saving todo:', error);
            toast.error("Erro ao salvar tarefa. Verifique se a tabela 'todos' existe.");
        }
    };

    const handleToggleComplete = async (todo: Todo) => {
        // Optimistic UI
        const newStatus = !todo.is_completed;
        setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, is_completed: newStatus } : t));

        try {
            const { error } = await supabase
                .from('todos')
                .update({ is_completed: newStatus })
                .eq('id', todo.id);

            if (error) throw error;

            if (newStatus) {
                toast.success("Tarefa concluída!");
            }
        } catch (error) {
            console.error('Error toggling todo:', error);
            toast.error("Erro ao atualizar status.");
            // Revert
            setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, is_completed: !newStatus } : t));
        }
    };

    const initiateDelete = (id: string) => {
        setDeleteConfirmation({ visible: true, id });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation.id) return;
        const id = deleteConfirmation.id;

        // Optimistic
        setTodos(prev => prev.filter(t => t.id !== id));
        setDeleteConfirmation({ visible: false, id: null });

        try {
            const { error } = await supabase
                .from('todos')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success("Tarefa excluída.");
        } catch (error) {
            console.error('Error deleting todo:', error);
            toast.error("Erro ao excluir.");
            fetchTodos(); // Re-sync
        }
    };

    const openEditMsg = (todo: Todo) => {
        setEditingTodo(todo);
        setFormData({
            title: todo.title,
            description: todo.description || '',
            priority: todo.priority,
            category: todo.category || 'other',
            due_date: todo.due_date ? todo.due_date.split('T')[0] : '' // Simple date input handling
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTodo(null);
        setFormData({
            title: '',
            description: '',
            priority: 'medium',
            category: 'personal',
            due_date: ''
        });
    };

    // --- Helpers ---
    const parseLocalDate = (dateStr: string) => {
        if (!dateStr) return null;
        // Handle ISO string with time or just date
        const cleanStr = dateStr.split('T')[0];
        const [y, m, d] = cleanStr.split('-').map(Number);
        return new Date(y, m - 1, d); // Construct date in local timezone explicitly
    };

    const getCategoryColor = (catId: string | null) => {
        const cat = CATEGORIES.find(c => c.id === catId);
        return cat ? cat.color : 'bg-slate-500';
    };

    const getCategoryLabel = (catId: string | null) => {
        const cat = CATEGORIES.find(c => c.id === catId);
        return cat ? cat.label : 'Outros';
    };

    // --- Filtering ---
    const filteredTodos = todos.filter(todo => {
        const matchesSearch = todo.title.toLowerCase().includes(search.toLowerCase()) ||
            (todo.description && todo.description.toLowerCase().includes(search.toLowerCase()));

        const matchesStatus = filter === 'all'
            ? true
            : filter === 'completed'
                ? todo.is_completed
                : !todo.is_completed;

        const matchesCategory = categoryFilter === 'all' ? true : todo.category === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
    });

    // Sort: Pending first, then by date/priority (simplified: just date for Pending completed last)
    filteredTodos.sort((a, b) => {
        if (a.is_completed === b.is_completed) {
            // Secondary sort by priority or date? Let's do Priority High -> Low
            const pMap = { high: 3, medium: 2, low: 1 };
            if (pMap[a.priority] !== pMap[b.priority]) return pMap[b.priority] - pMap[a.priority];
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return a.is_completed ? 1 : -1;
    });

    const activeCount = todos.filter(t => !t.is_completed).length;
    const completedCount = todos.filter(t => t.is_completed).length;

    // Handle Escape key
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

    return (
        <div className="h-full flex flex-col gap-6 animate-fade-in pb-8">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[var(--color-text-secondary)] text-sm font-medium">Tarefas Pendentes</p>
                        <h3 className="text-3xl font-bold text-[var(--color-text-primary)] mt-1">{activeCount}</h3>
                    </div>
                    <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 relative z-10">
                        <Clock size={24} />
                    </div>
                    {/* Decorative bg */}
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
                </div>

                <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[var(--color-text-secondary)] text-sm font-medium">Concluídas</p>
                        <h3 className="text-3xl font-bold text-[var(--color-text-primary)] mt-1">{completedCount}</h3>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 relative z-10">
                        <CheckCircle2 size={24} />
                    </div>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
                </div>

                <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-5 rounded-2xl flex items-center justify-between shadow-sm cursor-pointer hover:border-indigo-500/50 transition-colors group"
                    onClick={() => setIsModalOpen(true)}>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                            <Plus size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-[var(--color-text-primary)]">Nova Tarefa</h3>
                            <p className="text-xs text-[var(--color-text-secondary)]">Adicionar item à lista</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls & Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[var(--color-card)] border border-[var(--color-border)] p-4 rounded-2xl backdrop-blur-xl sticky top-0 z-30 shadow-sm">

                {/* Search */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar tarefas..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl py-2 pl-9 pr-4 text-sm text-[var(--color-text-primary)] focus:border-indigo-500 outline-none transition-all placeholder:text-[var(--color-text-secondary)]/50"
                    />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
                    <div className="flex bg-[var(--color-glass)] p-1 rounded-xl border border-[var(--color-border)]">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === 'all' ? 'bg-[var(--color-card)] shadow-sm text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
                        >
                            Todas
                        </button>
                        <button
                            onClick={() => setFilter('pending')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === 'pending' ? 'bg-[var(--color-card)] shadow-sm text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
                        >
                            Pendentes
                        </button>
                        <button
                            onClick={() => setFilter('completed')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === 'completed' ? 'bg-[var(--color-card)] shadow-sm text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
                        >
                            Concluídas
                        </button>
                    </div>

                    <div className="h-8 w-px bg-[var(--color-border)] mx-1 hidden md:block"></div>

                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl py-2 px-3 text-sm text-[var(--color-text-secondary)] focus:border-indigo-500 outline-none cursor-pointer"
                    >
                        <option value="all" className="bg-[var(--color-card)] text-[var(--color-text-primary)]">Todas Categorias</option>
                        {CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id} className="bg-[var(--color-card)] text-[var(--color-text-primary)]">{cat.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Task List */}
            <div className="flex-1 space-y-3">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-[var(--color-card)] rounded-xl animate-pulse border border-[var(--color-border)]"></div>
                    ))
                ) : filteredTodos.length > 0 ? (
                    filteredTodos.map(todo => (
                        <div
                            key={todo.id}
                            className={`
                                group bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 transition-all hover:shadow-md hover:border-indigo-500/30
                                ${todo.is_completed ? 'opacity-60 saturate-50 bg-[var(--color-glass)]' : ''}
                            `}
                        >
                            <div className="flex items-start gap-4">
                                <button
                                    onClick={() => handleToggleComplete(todo)}
                                    className={`
                                        mt-1 min-w-[24px] h-6 rounded-full border-2 flex items-center justify-center transition-all
                                        ${todo.is_completed
                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                            : 'border-[var(--color-text-secondary)] hover:border-indigo-500 hover:text-indigo-400 text-transparent'
                                        }
                                    `}
                                >
                                    <CheckCircle2 size={14} className={todo.is_completed ? 'opacity-100' : 'opacity-0'} />
                                </button>

                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openEditMsg(todo)}>
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h4 className={`text-base font-semibold truncate pr-2 ${todo.is_completed ? 'line-through text-[var(--color-text-secondary)]' : 'text-[var(--color-text-primary)]'}`}>
                                            {todo.title}
                                        </h4>

                                        {/* Priority Badge */}
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider border ${PRIORITIES[todo.priority].bg} ${PRIORITIES[todo.priority].color} ${PRIORITIES[todo.priority].border}`}>
                                            {PRIORITIES[todo.priority].label}
                                        </span>

                                        {/* Category Badge */}
                                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-glass)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                                            <div className={`w-1.5 h-1.5 rounded-full ${getCategoryColor(todo.category)}`}></div>
                                            {getCategoryLabel(todo.category)}
                                        </span>
                                    </div>

                                    {todo.description && (
                                        <p className="text-sm text-[var(--color-text-secondary)] mb-2 line-clamp-2">
                                            {todo.description}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)] mt-1">
                                        {todo.due_date && (() => {
                                            const date = parseLocalDate(todo.due_date);
                                            if (!date || !isValid(date)) return null;

                                            return (
                                                <div className={`flex items-center gap-1 ${isPast(date) && !isToday(date) && !todo.is_completed ? 'text-rose-400 font-medium' : ''}`}>
                                                    <Calendar size={12} />
                                                    {isToday(date) ? 'Hoje' :
                                                        isTomorrow(date) ? 'Amanhã' :
                                                            format(date, "dd/MM/yyyy", { locale: ptBR })}
                                                </div>
                                            );
                                        })()}
                                        {/* Created At */}
                                        {!todo.due_date && (() => {
                                            const date = new Date(todo.created_at);
                                            if (!isValid(date)) return null;
                                            return <span className="opacity-50">Criado há {formatDistanceToNow(date, { addSuffix: false, locale: ptBR })}</span>;
                                        })()}
                                    </div>
                                </div>

                                <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity self-center">
                                    <button
                                        onClick={() => openEditMsg(todo)}
                                        className="p-2 text-[var(--color-text-secondary)] hover:text-indigo-400 hover:bg-[var(--color-glass)] rounded-lg transition-colors"
                                    >
                                        <MoreVertical size={18} />
                                    </button>
                                    <button
                                        onClick={() => initiateDelete(todo.id)}
                                        className="p-2 text-[var(--color-text-secondary)] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-[var(--color-text-secondary)]">
                        <div className="w-16 h-16 bg-[var(--color-glass)] rounded-full flex items-center justify-center mb-4 opacity-50">
                            <CheckCircle2 size={32} />
                        </div>
                        <p className="text-lg font-medium">Nenhuma tarefa encontrada</p>
                        <p className="text-sm opacity-60">Aproveite para descansar ou planejar algo novo!</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-6 text-indigo-400 hover:text-indigo-300 font-medium underline"
                        >
                            Criar primeira tarefa
                        </button>
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
                                {editingTodo ? 'Editar Tarefa' : 'Nova Tarefa'}
                            </h3>
                            <button onClick={closeModal} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[var(--color-text-secondary)]">Título</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Ex: Pagar contas, Estudar React..."
                                    className="w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-text-primary)] focus:border-indigo-500 outline-none transition-all"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[var(--color-text-secondary)]">Descrição <span className="text-xs opacity-50">(Opcional)</span></label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Detalhes adicionais..."
                                    rows={3}
                                    className="w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-text-primary)] focus:border-indigo-500 outline-none transition-all resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-[var(--color-text-secondary)]">Prioridade</label>
                                    <div className="relative">
                                        <select
                                            value={formData.priority}
                                            onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                                            className="w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-text-primary)] focus:border-indigo-500 outline-none appearance-none"
                                        >
                                            <option value="low" className="bg-[var(--color-card)] text-[var(--color-text-primary)]">Baixa</option>
                                            <option value="medium" className="bg-[var(--color-card)] text-[var(--color-text-primary)]">Média</option>
                                            <option value="high" className="bg-[var(--color-card)] text-[var(--color-text-primary)]">Alta</option>
                                        </select>
                                        <Flag size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-[var(--color-text-secondary)]">Categoria</label>
                                    <div className="relative">
                                        <select
                                            value={formData.category || 'other'}
                                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                            className="w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-text-primary)] focus:border-indigo-500 outline-none appearance-none"
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat.id} value={cat.id} className="bg-[var(--color-card)] text-[var(--color-text-primary)]">{cat.label}</option>
                                            ))}
                                        </select>
                                        <Tag size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[var(--color-text-secondary)]">Data de Vencimento</label>
                                <input
                                    type="date"
                                    value={formData.due_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                                    className="w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-text-primary)] focus:border-indigo-500 outline-none transition-all [color-scheme:dark]"
                                />
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
                                {editingTodo ? 'Salvar Alterações' : 'Criar Tarefa'}
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
                            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Excluir tarefa?</h3>
                            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                                Tem certeza que deseja excluir esta tarefa?
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
