import { useState, useMemo } from 'react';
import {
    CircleDollarSign,
    TrendingUp,
    TrendingDown,
    Plus,
    Repeat,
    Trash2,
    CheckCircle2,
    History
} from 'lucide-react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { format, isSameMonth, startOfMonth, parseISO, getDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

// Types
type TransactionType = 'income' | 'expense';

interface Transaction {
    id: string;
    description: string;
    amount: number;
    type: TransactionType;
    date: string; // ISO string
    category: string;
    isRecurring: boolean;
}

interface RecurringItem {
    id: string;
    description: string;
    amount: number;
    type: TransactionType;
    dayOfMonth: number;
    category: string;
}

// Initial data is now empty, fetched from DB
const INITIAL_TRANSACTIONS: Transaction[] = [];

// Initial data is now empty, fetched from DB
const INITIAL_RECURRING: RecurringItem[] = [];

const INITIAL_CATEGORIES = ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Trabalho', 'Educação', 'Contas', 'Outros'];

const formatCurrencyInput = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";
    return (Number(numbers) / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
};

const parseCurrencyInput = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return Number(numbers) / 100;
};

const formatDateMask = (value: string) => {
    const v = value.replace(/\D/g, "").slice(0, 8);
    if (v.length >= 5) {
        return `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
    } else if (v.length >= 3) {
        return `${v.slice(0, 2)}/${v.slice(2)}`;
    }
    return v;
};

export default function Finance() {
    const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
    const [recurringItems, setRecurringItems] = useState<RecurringItem[]>(INITIAL_RECURRING);
    const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showRecurringModal, setShowRecurringModal] = useState(false);

    const [currentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    const [processedMonths, setProcessedMonths] = useState<string[]>([]);

    // Delete Confirmation State
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        type: 'transaction' | 'recurring' | null;
        id: string | null;
    }>({ isOpen: false, type: null, id: null });

    useEffect(() => {
        // Fetch User and then Data
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                // Fetch data only after we have the user
                await Promise.all([
                    fetchTransactions(user.id),
                    fetchRecurringItems(user.id),
                    fetchProcessedMonths(user.id)
                ]);
            } else {
                setLoading(false);
            }
        };
        init();
    }, []);

    const fetchTransactions = async (uid: string) => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', uid)
                .order('date', { ascending: false });

            if (error) throw error;
            if (data) {
                const mappedData: Transaction[] = data.map((t: any) => ({
                    id: t.id,
                    description: t.description,
                    amount: t.amount,
                    type: t.type,
                    date: t.date,
                    category: t.category,
                    isRecurring: t.is_recurring
                }));
                setTransactions(mappedData);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecurringItems = async (uid: string) => {
        try {
            const { data, error } = await supabase
                .from('recurring_items')
                .select('*')
                .eq('user_id', uid)
                .order('day_of_month', { ascending: true });

            if (error) throw error;
            if (data) {
                const mappedData: RecurringItem[] = data.map((t: any) => ({
                    id: t.id,
                    description: t.description,
                    amount: t.amount,
                    type: t.type,
                    dayOfMonth: t.day_of_month,
                    category: t.category
                }));
                setRecurringItems(mappedData);
            }
        } catch (error) {
            console.error('Error fetching recurring items:', error);
        }
    };

    const fetchProcessedMonths = async (uid: string) => {
        try {
            const { data, error } = await supabase
                .from('processed_months')
                .select('month_key')
                .eq('user_id', uid);

            if (error) throw error;
            if (data) {
                setProcessedMonths(data.map((item: any) => item.month_key));
            }
        } catch (error) {
            console.error('Error fetching processed months:', error);
        }
    };

    const currentMonthKey = useMemo(() => format(currentDate, 'yyyy-MM'), [currentDate]);
    const isCurrentMonthProcessed = processedMonths.includes(currentMonthKey);

    // Filter transactions for current month
    const currentMonthTransactions = useMemo(() => {
        return transactions.filter(t => isSameMonth(parseISO(t.date), currentDate));
    }, [transactions, currentDate]);

    // Calculate totals
    const totals = useMemo(() => {
        return currentMonthTransactions.reduce((acc, t) => {
            if (t.type === 'income') acc.income += t.amount;
            else acc.expense += t.amount;
            return acc;
        }, { income: 0, expense: 0 });
    }, [currentMonthTransactions]);

    const balance = totals.income - totals.expense;

    // Previous Balance (Accumulated before current month)
    const previousBalance = useMemo(() => {
        const startOfCurrent = startOfMonth(currentDate);
        return transactions
            .filter(t => parseISO(t.date) < startOfCurrent)
            .reduce((acc, t) => {
                return acc + (t.type === 'income' ? t.amount : -t.amount);
            }, 0);
    }, [transactions, currentDate]);

    // Charts Data
    const chartData = useMemo(() => {
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const data = Array.from({ length: daysInMonth }, (_, i) => ({
            day: i + 1,
            income: 0,
            expense: 0
        }));

        currentMonthTransactions.forEach(t => {
            const day = getDate(parseISO(t.date));
            if (day >= 1 && day <= daysInMonth) {
                if (t.type === 'income') data[day - 1].income += t.amount;
                else data[day - 1].expense += t.amount;
            }
        });

        return data;
    }, [currentMonthTransactions, currentDate]);



    const handleAddTransaction = async (newTx: Omit<Transaction, 'id'>) => {
        if (!userId) return;
        try {
            const { data, error } = await supabase
                .from('transactions')
                .insert([{
                    description: newTx.description,
                    amount: newTx.amount,
                    type: newTx.type,
                    date: newTx.date,
                    category: newTx.category,
                    is_recurring: newTx.isRecurring,
                    user_id: userId
                }])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const tx: Transaction = {
                    ...newTx,
                    id: data.id,
                };
                setTransactions(prev => [tx, ...prev]);
                setShowAddModal(false);
                toast.success('Transação adicionada com sucesso!');
            }
        } catch (error) {
            console.error('Error adding transaction:', error);
            toast.error('Erro ao salvar transação.');
        }
    };

    const confirmDeleteTransaction = (id: string) => {
        setDeleteConfirmation({ isOpen: true, type: 'transaction', id });
    };

    const confirmDeleteRecurring = (id: string) => {
        setDeleteConfirmation({ isOpen: true, type: 'recurring', id });
    };

    const executeDelete = async () => {
        if (!deleteConfirmation.id || !deleteConfirmation.type) return;

        if (deleteConfirmation.type === 'transaction') {
            await deleteTransaction(deleteConfirmation.id);
        } else {
            await deleteRecurring(deleteConfirmation.id);
        }
        setDeleteConfirmation({ isOpen: false, type: null, id: null });
    };

    const deleteTransaction = async (id: string) => {
        if (!userId) return;
        try {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id)
                .eq('user_id', userId);

            if (error) throw error;

            setTransactions(prev => prev.filter(t => t.id !== id));
            toast.success('Transação removida.');
        } catch (error) {
            console.error('Error deleting transaction:', error);
            toast.error('Erro ao apagar transação.');
        }
    };

    const handleAddRecurring = async (items: RecurringItem[]) => {
        if (!userId) return;
        const itemsToInsert = items.map(item => ({
            description: item.description,
            amount: item.amount,
            type: item.type,
            day_of_month: item.dayOfMonth,
            category: item.category,
            user_id: userId
        }));

        try {
            const { data, error } = await supabase
                .from('recurring_items')
                .insert(itemsToInsert)
                .select();

            if (error) throw error;

            if (data) {
                const newItems: RecurringItem[] = data.map((t: any) => ({
                    id: t.id,
                    description: t.description,
                    amount: t.amount,
                    type: t.type,
                    dayOfMonth: t.day_of_month,
                    category: t.category
                }));
                setRecurringItems(prev => [...prev, ...newItems]);
                setShowRecurringModal(false);
                toast.success('Recorrências salvas com sucesso!');
            }
        } catch (error) {
            console.error('Error adding recurring:', error);
            toast.error('Erro ao salvar recorrência.');
        }
    };

    const deleteRecurring = async (id: string) => {
        if (!userId) return;
        try {
            const { error } = await supabase
                .from('recurring_items')
                .delete()
                .eq('id', id)
                .eq('user_id', userId);

            if (error) throw error;

            setRecurringItems(prev => prev.filter(i => i.id !== id));
            toast.success('Recorrência removida.');
        } catch (error) {
            console.error('Error deleting recurring:', error);
            toast.error('Erro ao deletar recorrência.');
        }
    };

    const handleAddCategory = (newCategory: string) => {
        if (!categories.includes(newCategory) && newCategory.trim() !== '') {
            setCategories(prev => [...prev, newCategory].sort());
        }
    };

    const processRecurringToCurrentMonth = async (items: RecurringItem[]) => {
        if (!userId) return;
        if (isCurrentMonthProcessed) return;

        const transactionsToInsert = items.map(item => ({
            description: item.description,
            amount: item.amount,
            type: item.type,
            date: new Date(currentDate.getFullYear(), currentDate.getMonth(), item.dayOfMonth).toISOString(),
            category: item.category,
            is_recurring: true,
            user_id: userId
        }));

        try {
            const { data, error } = await supabase
                .from('transactions')
                .insert(transactionsToInsert)
                .select();

            if (error) throw error;

            if (data) {
                const newTransactions: Transaction[] = data.map((t: any) => ({
                    id: t.id,
                    description: t.description,
                    amount: t.amount,
                    type: t.type,
                    date: t.date,
                    category: t.category,
                    isRecurring: t.is_recurring
                }));
                setTransactions(prev => [...newTransactions, ...prev]);

                const { error: processedError } = await supabase
                    .from('processed_months')
                    .upsert(
                        [{ month_key: currentMonthKey, user_id: userId }],
                        { onConflict: 'month_key,user_id', ignoreDuplicates: true }
                    );

                if (processedError) throw processedError;

                setProcessedMonths(prev => [...prev, currentMonthKey]);
                toast.success('Recorrências processadas com sucesso!');
            }
        } catch (error) {
            console.error('Error processing recurring:', error);
            toast.error('Erro ao processar recorrentes.');
        }
    };

    if (loading) {
        return (
            <div className="h-full flex flex-col gap-6 pb-8 animate-pulse">
                {/* Header / Summary Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-[#1e232d]/70 border border-white/5 rounded-2xl p-6 flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                                <div className="h-4 w-24 bg-white/5 rounded"></div>
                                <div className="w-8 h-8 rounded-lg bg-white/5"></div>
                            </div>
                            <div className="h-8 w-32 bg-white/5 rounded mt-2"></div>
                        </div>
                    ))}
                </div>

                {/* Actions & Charts Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
                    {/* Left Column Skeleton */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Chart Area Skeleton */}
                        <div className="bg-[#1e232d]/70 border border-white/5 rounded-2xl p-6 h-[400px]">
                            <div className="flex justify-between items-center mb-6">
                                <div className="h-6 w-48 bg-white/5 rounded"></div>
                                <div className="flex gap-2">
                                    <div className="h-4 w-20 bg-white/5 rounded"></div>
                                    <div className="h-4 w-20 bg-white/5 rounded"></div>
                                </div>
                            </div>
                            <div className="w-full h-[300px] bg-white/5 rounded-xl"></div>
                        </div>

                        {/* Transaction History Skeleton */}
                        <div className="bg-[#1e232d]/70 border border-white/5 rounded-2xl p-6 flex-1">
                            <div className="h-6 w-48 bg-white/5 rounded mb-4"></div>
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-white/10"></div>
                                            <div className="flex flex-col gap-2">
                                                <div className="h-4 w-32 bg-white/10 rounded"></div>
                                                <div className="h-3 w-20 bg-white/10 rounded"></div>
                                            </div>
                                        </div>
                                        <div className="h-5 w-24 bg-white/10 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column Skeleton */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-[#1e232d]/70 border border-white/5 rounded-2xl p-6">
                            <div className="h-6 w-32 bg-white/5 rounded mb-4"></div>
                            <div className="flex flex-col gap-3">
                                <div className="h-12 w-full bg-white/5 rounded-xl"></div>
                                <div className="h-12 w-full bg-white/5 rounded-xl"></div>
                            </div>
                        </div>

                        <div className="bg-[#1e232d]/70 border border-white/5 rounded-2xl p-6 flex-1">
                            <div className="flex justify-between items-center mb-4">
                                <div className="h-6 w-32 bg-white/5 rounded"></div>
                            </div>
                            <div className="space-y-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
                                        <div className="flex flex-col gap-2">
                                            <div className="h-4 w-24 bg-white/10 rounded"></div>
                                            <div className="h-3 w-20 bg-white/10 rounded"></div>
                                        </div>
                                        <div className="h-4 w-16 bg-white/10 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col gap-6 animate-fade-in pb-8 relative">
            {/* Header / Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryCard
                    title="Saldo Anterior"
                    value={previousBalance}
                    icon={History}
                    color="text-[var(--color-text-secondary)]"
                    bgColor="bg-[var(--color-secondary)]/10"
                />
                <SummaryCard
                    title="Entradas"
                    value={totals.income}
                    icon={TrendingUp}
                    color="text-emerald-400"
                    bgColor="bg-emerald-400/10"
                />
                <SummaryCard
                    title="Saídas"
                    value={totals.expense}
                    icon={TrendingDown}
                    color="text-rose-400"
                    bgColor="bg-rose-400/10"
                />
                <SummaryCard
                    title="Saldo Mês"
                    value={balance}
                    icon={CircleDollarSign}
                    color={balance >= 0 ? "text-indigo-400" : "text-rose-400"}
                    bgColor={balance >= 0 ? "bg-indigo-400/10" : "bg-rose-400/10"}
                />
            </div>

            {/* Actions & Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
                {/* Left Column: Chart & History */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Chart Area */}
                    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 backdrop-blur-xl flex flex-col h-[400px]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Fluxo de Caixa - {format(currentDate, 'MMMM', { locale: ptBR })}</h3>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div> Entradas
                                </div>
                                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                                    <div className="w-3 h-3 rounded-full bg-rose-400"></div> Saídas
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                    <XAxis dataKey="day" stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                                        itemStyle={{ color: 'var(--color-text-primary)' }}
                                    />
                                    <Area type="monotone" dataKey="income" stroke="#34d399" fillOpacity={1} fill="url(#colorIncome)" />
                                    <Area type="monotone" dataKey="expense" stroke="#fb7185" fillOpacity={1} fill="url(#colorExpense)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 backdrop-blur-xl flex-1">
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Histórico de Transações</h3>
                        <div className="space-y-3">
                            {currentMonthTransactions.length > 0 ? (
                                currentMonthTransactions.map((t) => (
                                    <div key={t.id} className="flex justify-between items-center p-4 rounded-xl bg-[var(--color-glass)] border border-[var(--color-border)] hover:border-[var(--color-text-secondary)]/10 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-full ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                {t.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-[var(--color-text-primary)]">{t.description}</p>
                                                <p className="text-sm text-[var(--color-text-secondary)] capitalize">
                                                    {format(parseISO(t.date), 'dd/MM')} • {t.category}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                            </span>
                                            <button
                                                onClick={() => confirmDeleteTransaction(t.id)}
                                                className="text-[var(--color-text-secondary)] hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all p-2"
                                                title="Apagar transação"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-[var(--color-text-secondary)] py-8">Nenhuma transação neste mês.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions & Recurring */}
                <div className="flex flex-col gap-6">
                    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 backdrop-blur-xl">
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Ações Rápidas</h3>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl font-semibold transition-all w-full"
                            >
                                <Plus size={20} /> Nova Transação
                            </button>
                            <button
                                onClick={() => setShowRecurringModal(true)}
                                className="flex items-center justify-center gap-2 bg-[var(--color-glass)] hover:bg-[var(--color-glass)]/80 text-[var(--color-text-primary)] p-3 rounded-xl font-semibold transition-all w-full border border-[var(--color-border)]"
                            >
                                <Repeat size={20} /> Gerenciar Recorrências
                            </button>
                        </div>
                    </div>

                    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 backdrop-blur-xl flex-1 overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Recorrentes</h3>
                            {recurringItems.length > 0 && (
                                isCurrentMonthProcessed ? (
                                    <span className="flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">
                                        <CheckCircle2 size={12} />
                                        Processado
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => processRecurringToCurrentMonth(recurringItems)}
                                        className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded hover:bg-indigo-500/30 transition-colors"
                                        title="Adicionar todas ao mês atual"
                                    >
                                        Processar Mês
                                    </button>
                                )
                            )}
                        </div>
                        <div className="space-y-3">
                            {recurringItems.map(item => (
                                <div key={item.id} className="flex justify-between items-center p-3 rounded-lg bg-[var(--color-glass)] border border-[var(--color-border)] hover:border-[var(--color-text-secondary)]/10 transition-colors group">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-[var(--color-text-primary)]">{item.description}</span>
                                        <span className="text-xs text-[var(--color-text-secondary)]">Dia {item.dayOfMonth} • {item.category}</span>
                                    </div>
                                    <span className={`font-bold ${item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        R$ {item.amount.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                            {recurringItems.length === 0 && (
                                <p className="text-[var(--color-text-secondary)] text-sm text-center py-4">Nenhuma conta recorrente configurada.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showAddModal && (
                <TransactionModal
                    onClose={() => setShowAddModal(false)}
                    onSave={handleAddTransaction}
                    categories={categories}
                    onAddCategory={handleAddCategory}
                />
            )}

            {showRecurringModal && (
                <RecurringModal
                    onClose={() => setShowRecurringModal(false)}
                    items={recurringItems}
                    onSave={handleAddRecurring}
                    onDelete={confirmDeleteRecurring}
                />
            )}

            {/* Confirmation Modal */}
            {deleteConfirmation.isOpen && (
                <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in relative z-[70]">
                        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Confirmar Exclusão</h3>
                        <p className="text-[var(--color-text-secondary)] text-sm mb-6">
                            Tem certeza que deseja remover este item? Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })}
                                className="flex-1 px-4 py-2 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-glass)] transition-colors font-medium text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={executeDelete}
                                className="flex-1 px-4 py-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/50 hover:bg-rose-500/30 transition-colors font-medium text-sm"
                            >
                                Apagar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SummaryCard({ title, value, icon: Icon, color, bgColor }: any) {
    return (
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 backdrop-blur-xl flex items-center gap-4">
            <div className={`p-4 rounded-xl ${bgColor} ${color}`}>
                <Icon size={28} />
            </div>
            <div>
                <p className="text-[var(--color-text-secondary)] font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">
                    R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
            </div>
        </div>
    );
}

import { useEffect } from 'react';

function TransactionModal({ onClose, onSave, categories = [], onAddCategory }: any) {
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        type: 'expense',
        date: format(new Date(), 'dd/MM/yyyy'),
        category: categories[0] || 'Geral'
    });

    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryTemp, setNewCategoryTemp] = useState('');

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleSubmit = (e: any) => {
        e.preventDefault();

        // Convert DD/MM/YYYY to ISO
        const [day, month, year] = formData.date.split('/');
        const isoDate = `${year}-${month}-${day}`; // Simple conversion

        onSave({
            ...formData,
            amount: parseCurrencyInput(formData.amount),
            isRecurring: false,
            date: new Date(isoDate).toISOString()
        });
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData({ ...formData, amount: formatCurrencyInput(value) });
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, date: formatDateMask(e.target.value) });
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="flex items-start justify-center p-4 pt-20 text-center min-h-full">
                <div
                    className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-6 text-left align-middle shadow-xl transition-all"
                    onClick={e => e.stopPropagation()}
                >
                    <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">Nova Transação</h3>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <input
                            type="text"
                            placeholder="Descrição"
                            className="bg-[var(--color-glass)] border border-[var(--color-border)] rounded-lg p-3 text-[var(--color-text-primary)] focus:border-indigo-500 outline-none placeholder:text-[var(--color-text-secondary)]"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Valor (R$ 0,00)"
                            className="bg-[var(--color-glass)] border border-[var(--color-border)] rounded-lg p-3 text-[var(--color-text-primary)] focus:border-indigo-500 outline-none placeholder:text-[var(--color-text-secondary)]"
                            value={formData.amount}
                            onChange={handleAmountChange}
                            required
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className={`flex-1 p-3 rounded-lg font-medium transition-colors ${formData.type === 'income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-[var(--color-glass)] text-[var(--color-text-secondary)] border border-transparent'}`}
                                onClick={() => setFormData({ ...formData, type: 'income' })}
                            >
                                Entrada
                            </button>
                            <button
                                type="button"
                                className={`flex-1 p-3 rounded-lg font-medium transition-colors ${formData.type === 'expense' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' : 'bg-[var(--color-glass)] text-[var(--color-text-secondary)] border border-transparent'}`}
                                onClick={() => setFormData({ ...formData, type: 'expense' })}
                            >
                                Saída
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Data (DD/MM/AAAA)"
                            maxLength={10}
                            className="bg-[var(--color-glass)] border border-[var(--color-border)] rounded-lg p-3 text-[var(--color-text-primary)] focus:border-indigo-500 outline-none placeholder:text-[var(--color-text-secondary)]"
                            value={formData.date}
                            onChange={handleDateChange}
                            required
                        />
                        <div className="flex gap-2">
                            {isAddingCategory ? (
                                <div className="flex flex-1 gap-2 animate-fade-in">
                                    <input
                                        type="text"
                                        placeholder="Nova categoria..."
                                        className="flex-1 bg-[var(--color-glass)] border border-[var(--color-border)] rounded-lg p-3 text-[var(--color-text-primary)] focus:border-indigo-500 outline-none placeholder:text-[var(--color-text-secondary)]"
                                        value={newCategoryTemp}
                                        onChange={e => setNewCategoryTemp(e.target.value)}
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (newCategoryTemp.trim()) {
                                                onAddCategory(newCategoryTemp);
                                                setFormData({ ...formData, category: newCategoryTemp });
                                                setIsAddingCategory(false);
                                                setNewCategoryTemp('');
                                            }
                                        }}
                                        className="bg-emerald-500/20 text-emerald-400 p-3 rounded-lg hover:bg-emerald-500/30 transition-colors"
                                    >
                                        <CheckCircle2 size={20} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingCategory(false)}
                                        className="bg-rose-500/20 text-rose-400 p-3 rounded-lg hover:bg-rose-500/30 transition-colors"
                                    >
                                        <Plus size={20} className="rotate-45" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-1 gap-2">
                                    <select
                                        className="flex-1 bg-[var(--color-glass)] border border-[var(--color-border)] rounded-lg p-3 text-[var(--color-text-primary)] focus:border-indigo-500 outline-none appearance-none cursor-pointer"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {categories.map((c: string) => (
                                            <option key={c} value={c} className="bg-[var(--color-card)]">{c}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => { setIsAddingCategory(true); setNewCategoryTemp(''); }}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-lg transition-colors"
                                        title="Adicionar nova categoria"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button type="button" onClick={onClose} className="flex-1 p-3 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-glass)] transition-colors">Cancelar</button>
                            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-lg font-semibold shadow-lg shadow-indigo-500/20">Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function RecurringModal({ onClose, items, onSave, onDelete }: any) {
    const [newItems, setNewItems] = useState<any[]>([]);

    // Quick form state
    const [desc, setDesc] = useState('');
    const [amount, setAmount] = useState('');
    const [day, setDay] = useState('');
    const [type, setType] = useState('expense');

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(formatCurrencyInput(e.target.value));
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleAddItem = () => {
        if (!desc || !amount || !day) return;
        setNewItems(prev => [...prev, {
            id: Math.random().toString(),
            description: desc,
            amount: parseCurrencyInput(amount),
            type,
            dayOfMonth: Number(day),
            category: 'Recorrente'
        }]);
        setDesc('');
        setAmount('');
        setDay('');
    };

    const handleSaveAll = () => {
        onSave(newItems);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="flex items-start justify-center p-4 pt-20 text-center min-h-full">
                <div
                    className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-6 text-left align-middle shadow-xl transition-all"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Gerenciar Recorrências</h3>
                        <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">✕</button>
                    </div>

                    <div className="flex-1 overflow-auto pr-2">
                        {/* Add New Section */}
                        <div className="bg-[var(--color-glass)] rounded-xl p-4 mb-6 border border-[var(--color-border)]">
                            <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Adicionar Nova Recorrência (Bulk)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                                <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Nome (ex: Netflix)" className="bg-[var(--color-glass)] border border-[var(--color-border)] rounded-lg p-2 text-sm text-[var(--color-text-primary)] md:col-span-2 placeholder:text-[var(--color-text-secondary)]" />
                                <input value={amount} onChange={handleAmountChange} placeholder="Valor" type="text" className="bg-[var(--color-glass)] border border-[var(--color-border)] rounded-lg p-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]" />
                                <input value={day} onChange={e => setDay(e.target.value)} placeholder="Dia (1-31)" type="number" className="bg-[var(--color-glass)] border border-[var(--color-border)] rounded-lg p-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]" />
                            </div>
                            <div className="flex gap-3">
                                <select value={type} onChange={e => setType(e.target.value)} className="bg-[var(--color-glass)] border border-[var(--color-border)] rounded-lg p-2 text-sm text-[var(--color-text-primary)] flex-1">
                                    <option value="expense" className="bg-[var(--color-card)]">Saída</option>
                                    <option value="income" className="bg-[var(--color-card)]">Entrada</option>
                                </select>
                                <button onClick={handleAddItem} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                                    + Adicionar à Lista
                                </button>
                            </div>
                        </div>

                        {/* Staged Items */}
                        {newItems.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold text-emerald-400 mb-2">Novos Itens para Salvar:</h4>
                                <div className="space-y-2">
                                    {newItems.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                                            <span className="text-[var(--color-text-primary)] text-sm">{item.description} - {item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (Dia {item.dayOfMonth})</span>
                                            <button onClick={() => setNewItems(prev => prev.filter((_, i) => i !== idx))} className="text-rose-400 hover:text-rose-300">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={handleSaveAll} className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-lg font-bold shadow-lg shadow-emerald-500/20">
                                    Salvar {newItems.length} Itens
                                </button>
                            </div>
                        )}

                        {/* Existing Items */}
                        <div>
                            <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">Recorrências Ativas:</h4>
                            <div className="space-y-2">
                                {items.map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center p-3 rounded-lg bg-[var(--color-glass)] border border-[var(--color-border)]">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-[var(--color-text-primary)]">{item.description}</span>
                                            <span className="text-xs text-[var(--color-text-secondary)]">{item.type === 'income' ? 'Entrada' : 'Saída'} • Dia {item.dayOfMonth}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[var(--color-text-primary)]">
                                                {item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                            <button onClick={() => onDelete(item.id)} className="text-rose-400 hover:text-rose-300 opacity-50 hover:opacity-100">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
