import React, { createContext, useState, useEffect, useContext } from 'react';
import { toast } from 'sonner';

interface PomodoroContextType {
    timeLeft: number;
    isActive: boolean;
    mode: string;
    completedCycles: number;
    toggleTimer: () => void;
    resetTimer: () => void;
    setTimerMode: (m: string) => void;
    formatTime: (seconds: number) => string;
    setTimeLeft: (t: number) => void; // Exposed for testing
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
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
        <PomodoroContext.Provider value={{
            timeLeft,
            isActive,
            mode,
            completedCycles,
            toggleTimer,
            resetTimer,
            setTimerMode,
            formatTime,
            setTimeLeft
        }}>
            {children}
        </PomodoroContext.Provider>
    );
}

export function usePomodoro() {
    const context = useContext(PomodoroContext);
    if (context === undefined) {
        throw new Error('usePomodoro must be used within a PomodoroProvider');
    }
    return context;
}
