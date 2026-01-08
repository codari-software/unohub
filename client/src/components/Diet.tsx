import { useState, useEffect } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Utensils,
    Flame,
    Droplets,
    Plus,
    X,
    MoreVertical,
    Trash2,
    CheckCircle2,
    CalendarDays,
    Info,
    Search,
    GripVertical
} from 'lucide-react';
import { format, addDays, subDays, isSameDay, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DietOnboarding from './DietOnboarding';

// --- Types ---
interface FoodItem {
    id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    portion_amount?: number;
    portion_unit?: string;
}

interface MealLog {
    id: string;
    user_id: string;
    date: string; // ISO
    type: 'breakfast' | 'lunch' | 'snack' | 'dinner';
    food_name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
}

interface DailyTargets {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    water: number; // ml
}

// --- Constants ---
const DEFAULT_TARGETS: DailyTargets = {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fats: 65,
    water: 2500
};



const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage > 100) return 'text-emerald-500'; // Target hit/exceeded (good for protein/water)
    // For calories, exceeding might be bad? But usually hitting goal is green.
    // Let's stick to a simple scale.
    if (percentage > 90) return 'text-emerald-500';
    return 'text-indigo-500';
};

const getProgressBg = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage > 90) return 'bg-emerald-500';
    return 'bg-indigo-500';
};

export default function Diet() {
    // --- State ---
    const [currentDate, setCurrentDate] = useState(new Date());
    const [logs, setLogs] = useState<MealLog[]>([]);
    const [waterLog, setWaterLog] = useState(0);
    const [targets, setTargets] = useState<DailyTargets>(DEFAULT_TARGETS); // In future fetch from profile
    const [isLoading, setIsLoading] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [mealTypes, setMealTypes] = useState<any[]>([]);

    const [modalOpen, setModalOpen] = useState(false);
    const [activeMealType, setActiveMealType] = useState<string | null>(null);
    const [newMealTypeModalOpen, setNewMealTypeModalOpen] = useState(false);
    const [newMealTypeName, setNewMealTypeName] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const updateMealOrder = async (items: any[]) => {
        let hasError = false;

        for (const item of items) {
            if (!item.db_id) continue;

            const { error } = await supabase
                .from('diet_meal_types')
                .update({ order_index: item.order_index })
                .eq('id', item.db_id); // Use the row UUID

            if (error) {
                console.error("Error updating order for", item.label, error);
                hasError = true;
            }
        }

        if (hasError) {
            toast.error("Erro ao salvar a ordem das refeições.");
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setMealTypes((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);

                // Update the order_index property in the local state objects
                const updatedOrder = newOrder.map((item, index) => ({
                    ...item,
                    order_index: index
                }));

                updateMealOrder(updatedOrder);
                return updatedOrder;
            });
        }
    };

    const fetchMealTypes = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let { data: existingData, error } = await supabase
                .from('diet_meal_types')
                .select('*')
                .eq('user_id', user.id)
                .order('order_index', { ascending: true });

            if (error && error.code !== 'PGRST116') {
                console.error("Error loading meal types:", error);
                existingData = [];
            }

            // If user has NO types, fetch global defaults and seed them
            if (!existingData || existingData.length === 0) {
                const { data: defaults, error: defaultsError } = await supabase
                    .from('diet_default_meals')
                    .select('*')
                    .order('order_index', { ascending: true });

                if (defaults && defaults.length > 0) {
                    const newRows = defaults.map(def => ({
                        user_id: user.id,
                        type_id: def.type_id,
                        label: def.label,
                        recommended: def.recommended,
                        order_index: def.order_index
                    }));

                    const { data: inserted, error: insertError } = await supabase
                        .from('diet_meal_types')
                        .insert(newRows)
                        .select();

                    if (!insertError && inserted) {
                        existingData = inserted;
                    }
                }
            }

            if (existingData && existingData.length > 0) {
                // Sort by order_index
                existingData.sort((a, b) => (a.order_index ?? 999) - (b.order_index ?? 999));

                const mapped = existingData.map(d => ({
                    id: d.type_id,
                    label: d.label,
                    icon: Utensils,
                    recommended: d.recommended,
                    is_custom: true,
                    db_id: d.id,
                    order_index: d.order_index,
                    user_id: d.user_id
                }));

                // Deduplicate by type_id to fix duplicates caused by race conditions
                const uniqueMapped = Array.from(new Map(mapped.map(item => [item.id, item])).values());

                // Sort by order_index
                uniqueMapped.sort((a, b) => (a.order_index ?? 999) - (b.order_index ?? 999));

                setMealTypes(uniqueMapped);
            }
        } catch (err) {
            console.error("Error loading meal types:", err);
            setMealTypes([]);
        }
    };

    useEffect(() => {
        fetchMealTypes();
    }, []);

    const handleAddMealType = async () => {
        if (!newMealTypeName.trim()) return;
        const id = newMealTypeName.toLowerCase().replace(/\s+/g, '_');

        // Simple duplicate check against current state
        if (mealTypes.some(m => m.id === id)) {
            toast.error("Já existe uma refeição com esse nome!");
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const newTypeObj = {
                user_id: user.id,
                type_id: id,
                label: newMealTypeName,
                recommended: 500, // Default
                order_index: mealTypes.length
            };

            const { data, error } = await supabase
                .from('diet_meal_types')
                .insert(newTypeObj)
                .select()
                .single();

            if (error) throw error;

            const newType = {
                id: data.type_id,
                label: data.label,
                icon: Utensils,
                recommended: data.recommended,
                is_custom: true,
                db_id: data.id,
                order_index: data.order_index,
                user_id: data.user_id
            };

            setMealTypes(prev => [...prev, newType]);
            setNewMealTypeName('');
            setNewMealTypeModalOpen(false);
            toast.success("Nova categoria adicionada!");
        } catch (err) {
            console.error("Error creating meal type:", err);
            toast.error("Erro ao criar categoria.");
        }
    };

    const handleDeleteMealType = async (id: string) => {
        const hasLogs = logs.some(l => l.type === id);
        if (hasLogs) {
            toast.error("Não é possível remover uma categoria com registros. Remova os alimentos primeiro.");
            return;
        }

        // Optimistic update
        setMealTypes(prev => prev.filter(m => m.id !== id));

        try {
            // Delete from DB using the ID (slug) and user_id to be safe
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('diet_meal_types')
                .delete()
                .eq('user_id', user.id)
                .eq('type_id', id);

            if (error) throw error;
            toast.success("Categoria removida!");
        } catch (err) {
            console.error("Error deleting meal type:", err);
            toast.error("Erro ao remover do banco.");
            // Rollback if needed, but simplified for now
            fetchMealTypes();
        }
    };

    // --- Computed Stats ---
    const dailyStats = logs.reduce((acc, log) => ({
        calories: acc.calories + (log.calories || 0),
        protein: acc.protein + (log.protein || 0),
        carbs: acc.carbs + (log.carbs || 0),
        fats: acc.fats + (log.fats || 0)
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    const totalCalories = dailyStats.calories;

    // --- Effects ---
    useEffect(() => {
        fetchDailyData();
    }, [currentDate]);

    useEffect(() => {
        checkOnboardingStatus();
    }, []);

    // --- Data Fetching ---
    const checkOnboardingStatus = async () => {
        setIsLoading(true); // Ensure loading ensures
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsLoading(false);
                return;
            }

            // Check if profile exists
            const { data: profile } = await supabase
                .from('diet_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (!profile) {
                // If no profile, show onboarding
                setShowOnboarding(true);
            } else {
                // If profile exists, load targets
                setTargets({
                    calories: profile.target_calories,
                    protein: profile.target_protein,
                    carbs: profile.target_carbs,
                    fats: profile.target_fats,
                    water: profile.target_water
                });

                // Only fetch daily data if profile exists
                // Note: fetchDailyData is also called by useEffect[currentDate], 
                // but we might want to ensure it runs after profile load if needed.
                // For now, let's just stop loading here if we found a profile.
            }
        } catch (err) {
            console.error(err);
        } finally {
            // Only stop loading if we are NOT showing onboarding
            // If showing onboarding, we can stop loading main spinner, 
            // but if we are showing main content, we wait for this check.
            // Actually, simplest is to just stop loading.
            // If showOnboarding is true, the component will return <DietOnboarding />
            setIsLoading(false);
        }
    };

    const fetchDailyData = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const start = startOfDay(currentDate).toISOString();
            const end = endOfDay(currentDate).toISOString();

            const { data: logsData, error: logsError } = await supabase
                .from('diet_meals')
                .select('*')
                .eq('user_id', user.id)
                .gte('date', start)
                .lte('date', end);

            if (logsError && logsError.code !== 'PGRST116') {
                console.error("Error fetching diet data:", logsError);
            }
            setLogs(logsData as MealLog[] || []);

            // Water logs
            const { data: waterData, error: waterError } = await supabase
                .from('diet_water')
                .select('amount')
                .eq('user_id', user.id)
                .gte('date', start)
                .lte('date', end);

            if (!waterError && waterData) {
                const totalWater = waterData.reduce((acc, curr) => acc + curr.amount, 0);
                setWaterLog(totalWater);
            } else {
                setWaterLog(0);
            }

        } catch (err) {
            console.error("Error fetching diet data:", err);
            toast.error("Erro ao carregar dados.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveMeal = async (formData: any) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const newLog = {
                user_id: user.id,
                date: currentDate.toISOString(),
                type: activeMealType,
                food_name: formData.food_name,
                calories: Number(formData.calories),
                protein: Number(formData.protein),
                carbs: Number(formData.carbs),
                fats: Number(formData.fats)
            };

            const { data, error } = await supabase
                .from('diet_meals')
                .insert(newLog)
                .select()
                .single();

            if (error) throw error;

            setLogs(prev => [...prev, data as MealLog]);
            setModalOpen(false);
            toast.success("Refeição registrada!");
        } catch (err) {
            console.error("Error saving meal:", err);
            toast.error("Erro ao registrar refeição.");
        }
    };

    const handleDeleteMeal = async (id: string, calories: number) => {
        try {
            const { error } = await supabase
                .from('diet_meals')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setLogs(prev => prev.filter(l => l.id !== id));
            toast.success("Item removido.");
        } catch (err) {
            console.error("Error deleting meal:", err);
            toast.error("Erro ao remover.");
        }
    };

    const handleAddWater = async (amount: number) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('diet_water')
                .insert({
                    user_id: user.id,
                    date: currentDate.toISOString(),
                    amount: amount
                });

            if (error) throw error;

            setWaterLog(prev => prev + amount);
            toast.success(`${amount}ml registrados!`);
        } catch (err) {
            console.error("Error adding water:", err);
            toast.error("Erro ao registrar água.");
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex flex-col gap-6 animate-pulse pb-8">
                {/* Header Skeleton */}
                <div className="flex justify-between items-center p-4 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)]">
                    <div className="h-8 w-64 bg-[var(--color-glass)] rounded-xl"></div>
                    <div className="h-8 w-32 bg-[var(--color-glass)] rounded-xl hidden md:block"></div>
                </div>

                {/* Summary Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="h-48 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)]"></div>
                    <div className="h-48 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] lg:col-span-2"></div>
                    <div className="h-48 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)]"></div>
                </div>

                {/* Meals List Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-64 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)]"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (showOnboarding) {
        return <DietOnboarding onComplete={() => { setShowOnboarding(false); checkOnboardingStatus(); }} />;
    }

    return (
        <div className="h-full flex flex-col gap-6 animate-fade-in pb-8">
            {/* Header & Date Nav */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[var(--color-card)] border border-[var(--color-border)] p-4 rounded-2xl backdrop-blur-xl shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setCurrentDate(prev => subDays(prev, 1))}
                        className="p-2 hover:bg-[var(--color-glass)] rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-glass)] rounded-xl border border-[var(--color-border)]">
                        <CalendarDays size={18} className="text-indigo-400" />
                        <span className="font-semibold text-[var(--color-text-primary)] capitalize">
                            {isSameDay(currentDate, new Date()) ? 'Hoje, ' : ''}
                            {format(currentDate, "d 'de' MMMM", { locale: ptBR })}
                        </span>
                    </div>
                    <button
                        onClick={() => setCurrentDate(prev => addDays(prev, 1))}
                        className="p-2 hover:bg-[var(--color-glass)] rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="flex gap-4 items-center">
                    <div className="text-right hidden md:block">
                        <p className="text-xs text-[var(--color-text-secondary)]">Meta Diária</p>
                        <p className="font-bold text-[var(--color-text-primary)]">{targets.calories} kcal</p>
                    </div>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Calories Card */}
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl flex items-center gap-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Flame size={80} className="text-orange-500" />
                    </div>
                    <div className="relative z-10 w-24 h-24 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90">
                            <circle cx="48" cy="48" r="40" stroke="var(--color-border)" strokeWidth="8" fill="none" className="opacity-30" />
                            <circle
                                cx="48" cy="48" r="40"
                                stroke="currentColor" strokeWidth="8" fill="none"
                                strokeDasharray={251.2}
                                strokeDashoffset={251.2 - (Math.min(dailyStats.calories / targets.calories, 1) * 251.2)}
                                className={`transition-all duration-1000 ease-out ${getProgressColor(dailyStats.calories, targets.calories)}`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-lg font-bold ${getProgressColor(dailyStats.calories, targets.calories)}`}>
                                {Math.round((dailyStats.calories / targets.calories) * 100)}%
                            </span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[var(--color-text-secondary)] text-sm font-medium">Calorias</p>
                        <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">
                            {dailyStats.calories} <span className="text-sm font-normal text-[var(--color-text-secondary)]">/ {targets.calories}</span>
                        </h3>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1 ml-0.5">
                            {targets.calories - dailyStats.calories > 0 ? `${targets.calories - dailyStats.calories} restantes` : 'Meta atingida!'}
                        </p>
                    </div>
                </div>

                {/* Macros Card */}
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl flex flex-col justify-center gap-4 lg:col-span-2">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-xs font-medium">
                                <span className="text-[var(--color-text-secondary)]">Proteína</span>
                                <span className={getProgressColor(dailyStats.protein, targets.protein)}>{dailyStats.protein}/{targets.protein}g</span>
                            </div>
                            <div className="h-2 w-full bg-[var(--color-glass)] rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${getProgressBg(dailyStats.protein, targets.protein)}`}
                                    style={{ width: `${Math.min((dailyStats.protein / targets.protein) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-xs font-medium">
                                <span className="text-[var(--color-text-secondary)]">Carboidratos</span>
                                <span className={getProgressColor(dailyStats.carbs, targets.carbs)}>{dailyStats.carbs}/{targets.carbs}g</span>
                            </div>
                            <div className="h-2 w-full bg-[var(--color-glass)] rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${getProgressBg(dailyStats.carbs, targets.carbs)}`}
                                    style={{ width: `${Math.min((dailyStats.carbs / targets.carbs) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-xs font-medium">
                                <span className="text-[var(--color-text-secondary)]">Gorduras</span>
                                <span className={getProgressColor(dailyStats.fats, targets.fats)}>{dailyStats.fats}/{targets.fats}g</span>
                            </div>
                            <div className="h-2 w-full bg-[var(--color-glass)] rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${getProgressBg(dailyStats.fats, targets.fats)}`}
                                    style={{ width: `${Math.min((dailyStats.fats / targets.fats) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Water Card */}
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[var(--color-text-secondary)] text-sm font-medium">Água</p>
                                <h3 className="text-2xl font-bold text-sky-400 mt-1">
                                    {(waterLog / 1000).toFixed(1)}L <span className="text-sm font-normal text-[var(--color-text-secondary)]">/ {(targets.water / 1000).toFixed(1)}L</span>
                                </h3>
                            </div>
                            <div className="p-2 bg-sky-500/10 rounded-full text-sky-400">
                                <Droplets size={20} />
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={() => handleAddWater(250)}
                                className="flex-1 py-2 px-3 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1"
                            >
                                <Plus size={14} /> 250ml
                            </button>
                            <button
                                onClick={() => handleAddWater(500)}
                                className="flex-1 py-2 px-3 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1"
                            >
                                <Plus size={14} /> 500ml
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Meals List */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={mealTypes.map(m => m.id)}
                    strategy={rectSortingStrategy}
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                        {mealTypes.map(type => (
                            <SortableMealCard
                                key={type.id}
                                type={type}
                                logs={logs}
                                handleDeleteMeal={handleDeleteMeal}
                                handleDeleteMealType={handleDeleteMealType}
                                onAddFood={() => { setActiveMealType(type.id); setModalOpen(true); }}
                            />
                        ))}

                        {/* Add New Category Card */}
                        <button
                            onClick={() => setNewMealTypeModalOpen(true)}
                            className="flex flex-col items-center justify-center gap-4 bg-[var(--color-card)]/50 border-2 border-dashed border-[var(--color-border)] rounded-2xl p-5 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group min-h-[300px]"
                        >
                            <div className="p-4 bg-[var(--color-glass)] rounded-full group-hover:scale-110 transition-transform text-[var(--color-text-secondary)] group-hover:text-indigo-400">
                                <Plus size={32} />
                            </div>
                            <p className="font-medium text-[var(--color-text-secondary)] group-hover:text-indigo-400">Criar Nova Refeição</p>
                        </button>
                    </div>
                </SortableContext>
            </DndContext>


            {/* New Meal Type Modal */}
            {newMealTypeModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm" onClick={() => setNewMealTypeModalOpen(false)}>
                    <div className="flex items-center justify-center min-h-full p-4">
                        <div
                            className="relative w-full max-w-sm bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-2xl animate-fade-in"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Nova Categoria de Refeição</h3>
                            <input
                                type="text"
                                placeholder="Nome (ex: Ceia, Pré-Treino)"
                                className="w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl p-3 text-[var(--color-text-primary)] focus:border-indigo-500 outline-none mb-4"
                                value={newMealTypeName}
                                onChange={e => setNewMealTypeName(e.target.value)}
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setNewMealTypeModalOpen(false)}
                                    className="flex-1 py-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-glass)]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddMealType}
                                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                                >
                                    Criar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Food Modal */}
            {modalOpen && (
                <AddFoodModal
                    onClose={() => setModalOpen(false)}
                    onSave={handleSaveMeal}
                    activeMealType={activeMealType}
                />
            )}
        </div>
    );
}

function AddFoodModal({ onClose, onSave, activeMealType }: { onClose: () => void, onSave: (meal: any) => void, activeMealType: string | null }) {
    const [formData, setFormData] = useState({
        food_name: '',
        calories: '',
        protein: '',
        carbs: '',
        fats: ''
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [isNewFood, setIsNewFood] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.length >= 2) {
                searchFoods(searchTerm);
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const searchFoods = async (query: string) => {
        setIsSearching(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            let queryBuilder = supabase
                .from('diet_foods')
                .select('*')
                .ilike('name', `%${query}%`)
                .limit(20); // Increased limit slightly

            if (user) {
                // Ensure we only fetch public foods OR user's own foods
                queryBuilder = queryBuilder.or(`is_public.eq.true,user_id.eq.${user.id}`);
            } else {
                queryBuilder = queryBuilder.eq('is_public', true);
            }

            const { data, error } = await queryBuilder;

            if (data) setSearchResults(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectFood = (food: FoodItem) => {
        setFormData({
            food_name: food.name,
            calories: String(food.calories),
            protein: String(food.protein),
            carbs: String(food.carbs),
            fats: String(food.fats)
        });
        setSearchTerm(food.name);
        setSearchResults([]);
        setShowForm(true);
        setIsNewFood(false);
    };

    const handleManualEntry = () => {
        setFormData({ ...formData, food_name: searchTerm });
        setShowForm(true);
        setIsNewFood(true);
    };

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault(); // Prevent default form submission behavior

        // Manual validation
        if (!formData.food_name || !formData.calories) {
            // Assuming 'toast' is available in the scope, e.g., from 'react-hot-toast'
            // If not, you might need to import it or use a different notification method.
            // For example: alert("Preencha o nome e as calorias.");
            // toast.error("Preencha o nome e as calorias.");
            console.error("Validation Error: Food name and calories are required.");
            return;
        }

        // Always save to DB if it's a new food being created manually
        if (isNewFood && formData.food_name) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase.from('diet_foods').insert({
                        user_id: user.id,
                        name: formData.food_name,
                        calories: Number(formData.calories),
                        protein: Number(formData.protein) || 0, // Default to 0 if empty
                        carbs: Number(formData.carbs) || 0,     // Default to 0 if empty
                        fats: Number(formData.fats) || 0,       // Default to 0 if empty
                        is_public: false
                    });
                }
            } catch (err) {
                console.error("Error saving new food to database:", err);
                // toast.error("Erro ao salvar o alimento no banco de dados.");
            }
        }

        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="flex items-start justify-center min-h-full p-4 pt-20">
                <div
                    className="relative w-full max-w-md bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-2xl animate-fade-in"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                            {showForm ? 'Detalhes do Alimento' : 'Adicionar Alimento'}
                        </h3>
                        <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {!showForm ? (
                        <div className="flex flex-col gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar alimento (ex: Arroz Branco)"
                                    className="w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl pl-10 pr-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-indigo-500 outline-none transition-all"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {isSearching && <p className="text-xs text-[var(--color-text-secondary)] text-center">Buscando...</p>}

                            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                                {searchResults.map(food => (
                                    <button
                                        key={food.id}
                                        onClick={() => handleSelectFood(food)}
                                        className="text-left p-3 rounded-xl bg-[var(--color-glass)] hover:bg-indigo-500/10 hover:border-indigo-500/30 border border-transparent transition-all group"
                                    >
                                        <p className="font-medium text-[var(--color-text-primary)] group-hover:text-indigo-400">{food.name}</p>
                                        <p className="text-xs text-[var(--color-text-secondary)]">
                                            {food.calories}kcal • P: {food.protein} • C: {food.carbs} • G: {food.fats}
                                        </p>
                                    </button>
                                ))}
                                {searchTerm.length > 2 && !isSearching && searchResults.length === 0 && (
                                    <div className="text-center py-4">
                                        <p className="text-sm text-[var(--color-text-secondary)] mb-2">Nenhum alimento encontrado.</p>
                                        <button
                                            onClick={handleManualEntry}
                                            className="text-indigo-400 text-sm font-medium hover:underline"
                                        >
                                            Cadastrar "{searchTerm}" manualmente
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Nome do Alimento</label>
                                <input
                                    type="text"
                                    className={`w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl p-3 text-[var(--color-text-primary)] focus:border-indigo-500 outline-none transition-all ${!isNewFood ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    value={formData.food_name}
                                    onChange={e => isNewFood && setFormData({ ...formData, food_name: e.target.value })}
                                    readOnly={!isNewFood}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Calorias (kcal)</label>
                                    <input
                                        type="number"
                                        className={`w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl p-3 text-[var(--color-text-primary)] focus:border-indigo-500 outline-none transition-all ${!isNewFood ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        value={formData.calories}
                                        onChange={e => isNewFood && setFormData({ ...formData, calories: e.target.value })}
                                        readOnly={!isNewFood}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Proteínas (g)</label>
                                    <input
                                        type="number"
                                        className={`w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl p-3 text-[var(--color-text-primary)] focus:border-emerald-500 outline-none transition-all focus:ring-1 focus:ring-emerald-500/50 ${!isNewFood ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        value={formData.protein}
                                        onChange={e => isNewFood && setFormData({ ...formData, protein: e.target.value })}
                                        readOnly={!isNewFood}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Carboidratos (g)</label>
                                    <input
                                        type="number"
                                        className={`w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl p-3 text-[var(--color-text-primary)] focus:border-indigo-500 outline-none transition-all ${!isNewFood ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        value={formData.carbs}
                                        onChange={e => isNewFood && setFormData({ ...formData, carbs: e.target.value })}
                                        readOnly={!isNewFood}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Gorduras (g)</label>
                                    <input
                                        type="number"
                                        className={`w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl p-3 text-[var(--color-text-primary)] focus:border-amber-500 outline-none transition-all focus:ring-1 focus:ring-amber-500/50 ${!isNewFood ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        value={formData.fats}
                                        onChange={e => isNewFood && setFormData({ ...formData, fats: e.target.value })}
                                        readOnly={!isNewFood}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setSearchTerm(''); }}
                                    className="flex-1 py-3 px-4 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] font-medium hover:bg-[var(--color-glass)] transition-colors"
                                >
                                    Voltar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all"
                                >
                                    Adicionar
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

function SortableMealCard({ type, logs, handleDeleteMeal, handleDeleteMealType, onAddFood }: {
    type: any,
    logs: MealLog[],
    handleDeleteMeal: (id: string, calories: number) => void,
    handleDeleteMealType: (id: string) => void,
    onAddFood: () => void
}) {
    const isDefault = ['breakfast', 'lunch', 'snack', 'dinner'].includes(type.id);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: type.id, disabled: isDefault });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const items = logs.filter(log => log.type === type.id);
    const sectionCalories = items.reduce((acc, curr) => acc + curr.calories, 0);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-5 backdrop-blur-xl flex flex-col h-full group/card transition-all hover:border-[var(--color-text-secondary)]/30 relative"
        >
            {/* Drag Handle - Only for custom meals */}
            {!isDefault && (
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute top-5 left-[50%] -translate-x-1/2 cursor-grab active:cursor-grabbing text-[var(--color-text-secondary)]/30 hover:text-[var(--color-text-secondary)] transition-colors -mt-2 p-1 touch-none"
                >
                    <GripVertical size={16} />
                </div>
            )}

            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[var(--color-border)] pt-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                        <type.icon size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-[var(--color-text-primary)]">{type.label}</h4>
                        <p className="text-xs text-[var(--color-text-secondary)]">Recomendado: {type.recommended} kcal</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${sectionCalories > type.recommended ? 'text-amber-400' : 'text-[var(--color-text-secondary)]'}`}>
                        {sectionCalories} kcal
                    </span>
                    {!isDefault && (
                        <button
                            onClick={() => handleDeleteMealType(type.id)}
                            className="p-1 text-[var(--color-text-secondary)] hover:text-rose-400 transition-colors"
                            title="Remover Categoria"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 space-y-3 mb-4">
                {items.length > 0 ? (
                    items.map(item => (
                        <div key={item.id} className="flex justify-between items-center p-3 rounded-xl bg-[var(--color-glass)] border border-[var(--color-border)] hover:border-[var(--color-text-secondary)]/20 transition-all group">
                            <div>
                                <p className="font-medium text-[var(--color-text-primary)]">{item.food_name}</p>
                                <p className="text-xs text-[var(--color-text-secondary)]">
                                    P: {item.protein}g • C: {item.carbs}g • G: {item.fats}g
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-[var(--color-text-primary)]">{item.calories} kcal</span>
                                <button
                                    onClick={() => handleDeleteMeal(item.id, item.calories)}
                                    className="p-1.5 text-[var(--color-text-secondary)] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-[var(--color-border)] rounded-xl">
                        <p className="text-sm text-[var(--color-text-secondary)]">Nenhum registro ainda</p>
                    </div>
                )}
            </div>

            <button
                onClick={onAddFood}
                className="w-full py-2.5 rounded-xl border border-dashed border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-indigo-500 hover:text-indigo-400 transition-all flex items-center justify-center gap-2 text-sm font-medium hover:bg-indigo-500/5"
            >
                <Plus size={16} /> Adicionar Alimento
            </button>
        </div>
    );
}
