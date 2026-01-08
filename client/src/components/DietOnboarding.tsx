import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Activity, Target, ChevronRight, Check } from 'lucide-react';

interface DietOnboardingProps {
    onComplete: () => void;
}

export default function DietOnboarding({ onComplete }: DietOnboardingProps) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        gender: 'male',
        age: '',
        weight: '',
        height: '',
        activityLevel: '1.2',
        goal: 'maintain',
    });
    const [calculating, setCalculating] = useState(false);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const calculateAndSave = async () => {
        setCalculating(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user');

            const weight = Number(formData.weight);
            const height = Number(formData.height);
            const age = Number(formData.age);
            const activityLevel = Number(formData.activityLevel);

            // 1. Calculate BMR (Mifflin-St Jeor)
            let bmr = (10 * weight) + (6.25 * height) - (5 * age);
            bmr += formData.gender === 'male' ? 5 : -161;

            // 2. Calculate TDEE
            const tdee = bmr * activityLevel;

            // 3. Goal Adjustment
            let targetCalories = tdee;
            if (formData.goal === 'lose') targetCalories -= 500; // Deficit
            else if (formData.goal === 'gain') targetCalories += 300; // Surplus

            // Ensure safe minimums
            if (targetCalories < 1200) targetCalories = 1200;

            // 4. Macro Split (Flexible Dieting Standard)
            // Protein: 2g/kg (High protein for satiety & muscle retention)
            const protein = Math.round(weight * 2);

            // Fats: 0.9g/kg (Healthy hormonal function)
            const fats = Math.round(weight * 0.9);

            // Carbs: Remaining calories
            const proteinCals = protein * 4;
            const fatCals = fats * 9;
            const remainingCals = targetCalories - proteinCals - fatCals;
            const carbs = Math.max(0, Math.round(remainingCals / 4));

            // Water: ~35ml per kg
            const water = Math.round(weight * 35);

            const profileData = {
                user_id: user.id,
                gender: formData.gender,
                age,
                weight,
                height,
                activity_level: activityLevel,
                goal: formData.goal,
                target_calories: Math.round(targetCalories),
                target_protein: protein,
                target_carbs: carbs,
                target_fats: fats,
                target_water: water
            };

            const { error } = await supabase.from('diet_profiles').upsert(profileData);
            if (error) throw error;

            toast.success("Plano calculado com sucesso!");
            onComplete();

        } catch (err) {
            console.error(err);
            toast.error("Erro ao salvar perfil.");
        } finally {
            setCalculating(false);
        }
    };

    const nextStep = () => setStep(p => p + 1);

    return (
        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto animate-fade-in p-4">
            <div className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-glass)]">
                    <div
                        className="h-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${(step / 3) * 100}%` }}
                    ></div>
                </div>

                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                        {step === 1 && "Vamos conhecer você"}
                        {step === 2 && "Seu nível de atividade"}
                        {step === 3 && "Qual seu objetivo?"}
                    </h2>
                    <p className="text-[var(--color-text-secondary)]">
                        {step === 1 && "Para calcularmos suas metas ideais, precisamos de alguns dados básicos."}
                        {step === 2 && "Isso nos ajuda a estimar quantas calorias você queima por dia."}
                        {step === 3 && "Definiremos os macronutrientes baseados no que você quer alcançar."}
                    </p>
                </div>

                {step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleChange('gender', 'male')}
                                className={`p-4 rounded-xl border-2 transition-all ${formData.gender === 'male' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-indigo-500/50'}`}
                            >
                                Homem
                            </button>
                            <button
                                onClick={() => handleChange('gender', 'female')}
                                className={`p-4 rounded-xl border-2 transition-all ${formData.gender === 'female' ? 'border-pink-500 bg-pink-500/10 text-pink-400' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-pink-500/50'}`}
                            >
                                Mulher
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Idade</label>
                                <input
                                    type="number"
                                    value={formData.age}
                                    onChange={e => handleChange('age', e.target.value)}
                                    className="w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl p-3 text-[var(--color-text-primary)] focus:border-indigo-500 outline-none"
                                    placeholder="Anos"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Peso (kg)</label>
                                <input
                                    type="number"
                                    value={formData.weight}
                                    onChange={e => handleChange('weight', e.target.value)}
                                    className="w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl p-3 text-[var(--color-text-primary)] focus:border-indigo-500 outline-none"
                                    placeholder="kg"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Altura (cm)</label>
                                <input
                                    type="number"
                                    value={formData.height}
                                    onChange={e => handleChange('height', e.target.value)}
                                    className="w-full bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl p-3 text-[var(--color-text-primary)] focus:border-indigo-500 outline-none"
                                    placeholder="cm"
                                />
                            </div>
                        </div>

                        <button
                            onClick={nextStep}
                            disabled={!formData.age || !formData.weight || !formData.height}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            Próximo <ChevronRight size={20} />
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4 animate-fade-in">
                        {[
                            { val: '1.2', label: 'Sedentário', desc: 'Pouco ou nenhum exercício' },
                            { val: '1.375', label: 'Levemente Ativo', desc: 'Exercício leve 1-3 dias/semana' },
                            { val: '1.55', label: 'Moderadamente Ativo', desc: 'Exercício moderado 3-5 dias/semana' },
                            { val: '1.725', label: 'Muito Ativo', desc: 'Exercício pesado 6-7 dias/semana' },
                        ].map(opt => (
                            <button
                                key={opt.val}
                                onClick={() => handleChange('activityLevel', opt.val)}
                                className={`w-full p-4 rounded-xl border text-left flex justify-between items-center transition-all ${formData.activityLevel === opt.val
                                        ? 'border-indigo-500 bg-indigo-500/10'
                                        : 'border-[var(--color-border)] hover:bg-[var(--color-glass)]'
                                    }`}
                            >
                                <div>
                                    <h4 className={`font-semibold ${formData.activityLevel === opt.val ? 'text-indigo-400' : 'text-[var(--color-text-primary)]'}`}>{opt.label}</h4>
                                    <p className="text-sm text-[var(--color-text-secondary)]">{opt.desc}</p>
                                </div>
                                {formData.activityLevel === opt.val && <Check size={20} className="text-indigo-400" />}
                            </button>
                        ))}

                        <button
                            onClick={nextStep}
                            className="w-full py-4 mt-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            Próximo <ChevronRight size={20} />
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4 animate-fade-in">
                        {[
                            { val: 'lose', label: 'Perder Peso', icon: Activity },
                            { val: 'maintain', label: 'Manter Peso', icon: Target },
                            { val: 'gain', label: 'Ganhar Massa', icon: Activity },
                        ].map(opt => (
                            <button
                                key={opt.val}
                                onClick={() => handleChange('goal', opt.val)}
                                className={`w-full p-6 rounded-xl border flex flex-col items-center gap-3 transition-all ${formData.goal === opt.val
                                        ? 'border-indigo-500 bg-indigo-500/10 transform scale-[1.02]'
                                        : 'border-[var(--color-border)] hover:bg-[var(--color-glass)]'
                                    }`}
                            >
                                <opt.icon size={32} className={formData.goal === opt.val ? 'text-indigo-400' : 'text-[var(--color-text-secondary)]'} />
                                <span className={`font-bold text-lg ${formData.goal === opt.val ? 'text-indigo-400' : 'text-[var(--color-text-primary)]'}`}>{opt.label}</span>
                            </button>
                        ))}

                        <button
                            onClick={calculateAndSave}
                            disabled={calculating}
                            className="w-full py-4 mt-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            {calculating ? 'Calculando...' : 'Finalizar e Calcular Metas'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
