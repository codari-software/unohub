import { Play, Pause, RotateCcw } from 'lucide-react';
import { usePomodoro } from '../context/PomodoroContext';

export default function Pomodoro() {
    const {
        timeLeft,
        isActive,
        mode,
        toggleTimer,
        resetTimer,
        setTimerMode,
        formatTime,
    } = usePomodoro();

    return (
        <div className="flex flex-col items-center justify-center h-full gap-8">
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-12 flex flex-col items-center gap-10 w-full max-w-lg backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-pink-500 to-indigo-500 opacity-50"></div>

                <div className="flex gap-2 p-1.5 bg-[var(--color-glass)] rounded-full">
                    {['focus', 'short', 'long'].map(m => (
                        <button
                            key={m}
                            onClick={() => setTimerMode(m)}
                            className={`
                px-6 py-2 rounded-full font-semibold text-sm transition-all duration-300 capitalize
                ${mode === m
                                    ? 'bg-indigo-600 text-white shadow-lg scale-105'
                                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-glass)]'}
              `}
                        >
                            {m === 'focus' ? 'Focus' : m === 'short' ? 'Short Break' : 'Long Break'}
                        </button>
                    ))}
                </div>

                <div className="text-[7rem] font-bold text-[var(--color-text-primary)] tabular-nums tracking-tighter leading-none mt-2 drop-shadow-2xl">
                    {formatTime(timeLeft)}
                </div>

                <div className="flex gap-6 items-center">
                    <button
                        className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-500/10 hover:shadow-indigo-500/20"
                        onClick={toggleTimer}
                    >
                        {isActive ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} />}
                        {isActive ? 'Pause' : 'Start Focus'}
                    </button>

                    <button
                        className="p-4 rounded-2xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-secondary)]/30 hover:bg-[var(--color-glass)] transition-all active:scale-95"
                        onClick={resetTimer}
                    >
                        <RotateCcw size={24} />
                    </button>
                </div>
            </div>

            <p className="text-[var(--color-text-secondary)] text-sm font-medium italic tracking-wide opacity-70">
                "One step at a time."
            </p>
        </div>
    );
}
