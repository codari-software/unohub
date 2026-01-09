
import { useState, useEffect, useMemo } from 'react';
import {
    Calendar as CalendarIcon,
    MapPin,
    Plus,
    ChevronLeft,
    ChevronRight,
    Trash2,
    X
} from 'lucide-react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
    parseISO,
    isBefore,
    addHours
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

// Types
type EventType = 'work' | 'personal' | 'health' | 'leisure' | 'study' | 'important';

interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    start_time: string; // ISO string
    end_time: string; // ISO string
    type: EventType;
    location?: string;
    user_id: string;
}

const EVENT_TYPES: { id: EventType; label: string; color: string; bgColor: string }[] = [
    { id: 'work', label: 'Trabalho', color: 'text-indigo-400', bgColor: 'bg-indigo-400/10' },
    { id: 'personal', label: 'Pessoal', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
    { id: 'health', label: 'Saúde', color: 'text-rose-400', bgColor: 'bg-rose-400/10' },
    { id: 'leisure', label: 'Lazer', color: 'text-amber-400', bgColor: 'bg-amber-400/10' },
    { id: 'study', label: 'Estudos', color: 'text-sky-400', bgColor: 'bg-sky-400/10' },
    { id: 'important', label: 'Importante', color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
];

export default function Events() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Modal Form State
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; eventId: string | null }>({
        isOpen: false,
        eventId: null
    });

    const [formData, setFormData] = useState<{
        title: string;
        description: string;
        date: string;
        startTime: string;
        endTime: string;
        type: EventType;
        location: string;
    }>({
        title: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '10:00',
        type: 'personal',
        location: ''
    });

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                fetchEvents(user.id);
            } else {
                setLoading(false);
            }
        };
        init();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowModal(false);
                setDeleteConfirmation({ isOpen: false, eventId: null });
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const fetchEvents = async (uid: string) => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('user_id', uid)
                .order('start_time', { ascending: true });

            if (error) throw error;
            if (data) {
                setEvents(data);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            // toast.error('Erro ao carregar eventos.');
        } finally {
            setLoading(false);
        }
    };

    const handlePreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const handleToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
        setFormData(prev => ({
            ...prev,
            date: format(date, 'yyyy-MM-dd')
        }));
    };

    const handleAddEventClick = () => {
        setFormData({
            title: '',
            description: '',
            date: format(selectedDate, 'yyyy-MM-dd'),
            startTime: format(new Date(), 'HH:mm'),
            endTime: format(addHours(new Date(), 1), 'HH:mm'),
            type: 'personal',
            location: ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;

        // Construct ISO strings
        const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
        const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

        const newEvent = {
            title: formData.title,
            description: formData.description,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            type: formData.type,
            location: formData.location,
            user_id: userId
        };

        try {
            const { data, error } = await supabase
                .from('events')
                .insert([newEvent])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setEvents(prev => [...prev, data]);
                setShowModal(false);
                toast.success('Evento criado com sucesso!');
            }
        } catch (error) {
            console.error('Error creating event:', error);
            toast.error('Erro ao criar evento. Verifique se a tabela existe.');
        }
    };

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteConfirmation({ isOpen: true, eventId: id });
    };

    const executeDelete = async () => {
        if (!userId || !deleteConfirmation.eventId) return;

        try {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', deleteConfirmation.eventId)
                .eq('user_id', userId);

            if (error) throw error;

            setEvents(prev => prev.filter(ev => ev.id !== deleteConfirmation.eventId));
            toast.success('Evento removido.');
        } catch (error) {
            console.error('Error deleting event:', error);
            toast.error('Erro ao remover evento.');
        } finally {
            setDeleteConfirmation({ isOpen: false, eventId: null });
        }
    };

    // Calendar Generation Logic
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { locale: ptBR });
        const endDate = endOfWeek(monthEnd, { locale: ptBR });

        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [currentDate]);

    // Filter events for selected date
    const selectedDateEvents = useMemo(() => {
        return events.filter(event => isSameDay(parseISO(event.start_time), selectedDate));
    }, [events, selectedDate]);

    // Upcoming events (future)
    const upcomingEvents = useMemo(() => {
        const now = new Date();
        return events
            .filter(event => isBefore(now, parseISO(event.start_time)))
            .slice(0, 5); // Limit to 5
    }, [events]);

    return (
        <div className="h-full flex flex-col lg:flex-row gap-6 animate-fade-in pb-8">
            {/* Left Column: Calendar */}
            <div className="flex-1 flex flex-col gap-6 h-full min-h-[600px]">
                {/* Calendar Header */}
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 backdrop-blur-xl flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] capitalize">
                            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                        </h2>
                        <div className="flex gap-1">
                            <button onClick={handlePreviousMonth} className="p-2 hover:bg-[var(--color-glass)] rounded-lg text-[var(--color-text-secondary)] transition-colors">
                                <ChevronLeft size={20} />
                            </button>
                            <button onClick={handleNextMonth} className="p-2 hover:bg-[var(--color-glass)] rounded-lg text-[var(--color-text-secondary)] transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={handleToday}
                        className="px-4 py-2 bg-[var(--color-glass)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl text-sm font-medium transition-colors"
                    >
                        Hoje
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 backdrop-blur-xl flex flex-col">
                    <div className="grid grid-cols-7 mb-4">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                            <div key={i} className="text-center text-sm font-semibold text-[var(--color-text-secondary)] py-2">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 flex-1 gap-2">
                        {calendarDays.map((day, i) => {
                            const isSelected = isSameDay(day, selectedDate);
                            const isCurrentMonth = isSameMonth(day, currentDate);
                            const isTodayDate = isToday(day);

                            const dayEvents = events.filter(e => isSameDay(parseISO(e.start_time), day));

                            return (
                                <button
                                    key={i}
                                    onClick={() => handleDateClick(day)}
                                    className={`
                                        relative flex flex-col items-center justify-start py-2 px-1 rounded-xl transition-all h-full min-h-[80px] border border-transparent
                                        ${!isCurrentMonth ? 'opacity-30' : 'opacity-100'}
                                        ${isSelected ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'hover:bg-[var(--color-glass)]'}
                                        ${isTodayDate && !isSelected ? 'border-indigo-400/30 bg-[var(--color-glass)]' : ''}
                                    `}
                                >
                                    <span className={`
                                        text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1
                                        ${isTodayDate ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-[var(--color-text-primary)]'}
                                    `}>
                                        {format(day, 'd')}
                                    </span>

                                    {/* Event Dots */}
                                    <div className="flex flex-wrap justify-center gap-1 w-full px-1">
                                        {dayEvents.map((ev, idx) => {
                                            const typeColor = EVENT_TYPES.find(t => t.id === ev.type)?.bgColor.replace('/10', '') || 'bg-gray-400';
                                            return idx < 4 && (
                                                <div
                                                    key={idx}
                                                    className={`w-1.5 h-1.5 rounded-full ${typeColor}`}
                                                    title={ev.title}
                                                />
                                            );
                                        })}
                                        {dayEvents.length > 4 && (
                                            <span className="text-[9px] text-[var(--color-text-secondary)] leading-none">+</span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Right Column: Details & Actions */}
            <div className="w-full lg:w-96 flex flex-col gap-6">
                {/* Actions */}
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 backdrop-blur-xl">
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                        {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                    </h3>
                    <button
                        onClick={handleAddEventClick}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20"
                    >
                        <Plus size={20} /> Novo Evento
                    </button>
                </div>

                {/* Selected Date Events */}
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 backdrop-blur-xl flex-1 min-h-[300px] overflow-y-auto">
                    <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Eventos do Dia</h3>
                    <div className="space-y-3">
                        {loading ? (
                            <div className="animate-pulse space-y-3">
                                <div className="h-20 bg-[var(--color-glass)] rounded-xl w-full"></div>
                                <div className="h-20 bg-[var(--color-glass)] rounded-xl w-full"></div>
                            </div>
                        ) : selectedDateEvents.length > 0 ? (
                            selectedDateEvents.map(event => {
                                const typeStyle = EVENT_TYPES.find(t => t.id === event.type) || EVENT_TYPES[0];
                                return (
                                    <div key={event.id} className="group relative p-4 rounded-xl bg-[var(--color-glass)] border border-[var(--color-border)] hover:border-indigo-500/30 transition-all">
                                        <div className="flex gap-4">
                                            <div className="flex flex-col items-center justify-center px-2 border-r border-[var(--color-border)]">
                                                <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                                                    {format(parseISO(event.start_time), 'HH:mm')}
                                                </span>
                                                <span className="text-xs text-[var(--color-text-secondary)] opacity-50">
                                                    {format(parseISO(event.end_time), 'HH:mm')}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-[var(--color-text-primary)] truncate">{event.title}</h4>
                                                {event.description && <p className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">{event.description}</p>}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeStyle.bgColor} ${typeStyle.color} font-medium`}>
                                                        {typeStyle.label}
                                                    </span>
                                                    {event.location && (
                                                        <span className="flex items-center gap-1 text-[10px] text-[var(--color-text-secondary)]">
                                                            <MapPin size={10} /> {event.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteClick(event.id, e)}
                                            className="absolute top-2 right-2 p-1.5 text-[var(--color-text-secondary)] hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <CalendarIcon size={32} className="text-[var(--color-text-secondary)] opacity-20 mb-3" />
                                <p className="text-[var(--color-text-secondary)] text-sm">Nenhum evento para este dia.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Upcoming Preview */}
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 backdrop-blur-xl">
                    <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Próximos Eventos</h3>
                    <div className="space-y-3">
                        {upcomingEvents.length > 0 ? (
                            upcomingEvents.map(event => (
                                <div key={event.id} className="flex gap-3 items-center">
                                    <div className={`w-2 h-2 rounded-full ${EVENT_TYPES.find(t => t.id === event.type)?.bgColor.replace('/10', '') || 'bg-gray-400'}`}></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{event.title}</p>
                                        <p className="text-xs text-[var(--color-text-secondary)]">
                                            {format(parseISO(event.start_time), "d MMM, HH:mm", { locale: ptBR })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-[var(--color-text-secondary)]">Sem eventos futuros.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Novo Evento</h3>
                            <button onClick={() => setShowModal(false)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Título</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    placeholder="Ex: Reunião de Projeto"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Tipo</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {EVENT_TYPES.map(type => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: type.id })}
                                            className={`
                                                px-2 py-1.5 rounded-lg text-xs font-medium border transition-all
                                                ${formData.type === type.id
                                                    ? `${type.bgColor} ${type.color} border-${type.color.replace('text-', '')}/30`
                                                    : 'bg-[var(--color-glass)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}
                                            `}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Data</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Início</label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.startTime}
                                            onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                            className="w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl px-2 py-2.5 text-[var(--color-text-primary)] text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Fim</label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.endTime}
                                            onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                            className="w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl px-2 py-2.5 text-[var(--color-text-primary)] text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Local (Opcional)</label>
                                <div className="relative">
                                    <MapPin size={16} className="absolute left-3 top-3 text-[var(--color-text-secondary)]" />
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl pl-9 pr-4 py-2.5 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        placeholder="Ex: Sala de Reuniões / Link Zoom"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Descrição</label>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                                    placeholder="Detalhes adicionais..."
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 mt-2"
                            >
                                Salvar Evento
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmation.isOpen && (
                <div
                    className="fixed inset-0 z-[70] overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setDeleteConfirmation({ isOpen: false, eventId: null })}
                >
                    <div
                        className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Confirmar Exclusão</h3>
                        <p className="text-[var(--color-text-secondary)] text-sm mb-6">
                            Tem certeza que deseja remover este evento? Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmation({ isOpen: false, eventId: null })}
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
