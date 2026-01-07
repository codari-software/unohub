import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function Pomodoro() {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('focus'); // focus, short, long

    const [completedCycles, setCompletedCycles] = useState(0);

    useEffect(() => {
        let interval: any = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);

            // Play "Sininho"
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.error('Erro ao tocar som:', e));

            if (mode === 'focus') {
                const newCycles = completedCycles + 1;
                setCompletedCycles(newCycles);

                if (newCycles % 4 === 0) {
                    toast.success('Ciclo completo! Hora de uma pausa longa.', { duration: 5000 });
                    setMode('long');
                    setTimeLeft(15 * 60);
                } else {
                    toast.success('Foco finalizado! Hora de uma pausa curta.', { duration: 5000 });
                    setMode('short');
                    setTimeLeft(5 * 60);
                }
            } else {
                // Break is over
                toast.info('Pausa finalizada! De volta ao foco.', { duration: 5000 });
                setMode('focus');
                setTimeLeft(25 * 60);
            }
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode, completedCycles]);

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        if (mode === 'focus') setTimeLeft(25 * 60);
        if (mode === 'short') setTimeLeft(5 * 60);
        if (mode === 'long') setTimeLeft(15 * 60);
    };

    const setTimerMode = (m: string) => {
        setMode(m);
        setIsActive(false);
        if (m === 'focus') setTimeLeft(25 * 60);
        if (m === 'short') setTimeLeft(5 * 60);
        if (m === 'long') setTimeLeft(15 * 60);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center justify-center h-full gap-8">
            <div className="bg-[#1e232d]/70 border border-white/5 rounded-3xl p-12 flex flex-col items-center gap-10 w-full max-w-lg backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-pink-500 to-indigo-500 opacity-50"></div>

                <div className="flex gap-2 p-1.5 bg-black/20 rounded-full">
                    {['focus', 'short', 'long'].map(m => (
                        <button
                            key={m}
                            onClick={() => setTimerMode(m)}
                            className={`
                px-6 py-2 rounded-full font-semibold text-sm transition-all duration-300 capitalize
                ${mode === m
                                    ? 'bg-indigo-600 text-white shadow-lg scale-105'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'}
              `}
                        >
                            {m === 'focus' ? 'Focus' : m === 'short' ? 'Short Break' : 'Long Break'}
                        </button>
                    ))}
                </div>

                <div className="text-[7rem] font-bold text-white tabular-nums tracking-tighter leading-none mt-2 drop-shadow-2xl">
                    {formatTime(timeLeft)}
                </div>

                <div className="flex gap-6 items-center">
                    <button
                        className="flex items-center gap-3 bg-white text-indigo-950 px-8 py-4 rounded-2xl font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-500/10 hover:shadow-indigo-500/20"
                        onClick={toggleTimer}
                    >
                        {isActive ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} />}
                        {isActive ? 'Pause' : 'Start Focus'}
                    </button>

                    <button
                        className="p-4 rounded-2xl border border-white/10 text-slate-400 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all active:scale-95"
                        onClick={resetTimer}
                    >
                        <RotateCcw size={24} />
                    </button>
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => setTimeLeft(5)}
                    className="text-xs text-slate-600 hover:text-indigo-400 transition-colors"
                >
                    Test (5s)
                </button>
            </div>

            <p className="text-slate-500 text-sm font-medium italic tracking-wide opacity-70">
                "One step at a time."
            </p>
        </div>
    );
}
