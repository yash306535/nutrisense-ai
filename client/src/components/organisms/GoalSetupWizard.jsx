import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import { goalAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import { ACTIVITY_LEVELS, GOAL_TYPES } from '../../utils/constants';

const STEPS = ['Basic Info', 'Activity Level', 'Goal Type', 'Target'];

export default function GoalSetupWizard({ onComplete }) {
  const { updateUser } = useAuthStore();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    height: '', weight: '', age: '', gender: 'male',
    activityLevel: 'moderate', goalType: 'maintain',
    targetWeight: '', targetDate: '',
  });
  const [tips, setTips] = useState([]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const setupMutation = useMutation({
    mutationFn: () => goalAPI.setup({
      height: Number(form.height),
      currentWeight: Number(form.weight),
      targetWeight: Number(form.targetWeight || form.weight),
      age: Number(form.age),
      gender: form.gender,
      activityLevel: form.activityLevel,
      goalType: form.goalType,
      targetDate: form.targetDate || undefined,
    }),
    onSuccess: (res) => {
      const { goal, tips: newTips } = res.data.data;
      setTips(newTips || []);
      updateUser({
        calorieTarget: goal.calorieTarget,
        proteinTarget: goal.proteinTarget,
        carbsTarget: goal.carbsTarget,
        fatTarget: goal.fatTarget,
        goal: goal.goalType,
        height: goal.height,
        weight: goal.currentWeight,
        targetWeight: goal.targetWeight,
        age: goal.age,
        gender: goal.gender,
        activityLevel: goal.activityLevel,
      });
      setStep(4); // success step
    },
    onError: () => toast.error('Failed to set up goal'),
  });

  const canProceed = () => {
    if (step === 0) return form.height && form.weight && form.age;
    if (step === 3) return form.targetWeight;
    return true;
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress */}
      {step < 4 && (
        <div className="flex gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-2 w-full rounded-full transition-all duration-300 ${i <= step ? 'bg-primary' : 'bg-slate-200'}`} />
              <span className={`text-xs ${i === step ? 'text-primary font-medium' : 'text-text-muted'}`}>{s}</span>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Step 0: Basic Info */}
        {step === 0 && (
          <motion.div key="step0" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'Sora' }}>Tell us about yourself</h2>
            <p className="text-text-muted text-sm">We'll use this to calculate your personalized nutrition targets.</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Height (cm)" type="number" value={form.height} onChange={set('height')} placeholder="175" min="100" max="250" required />
              <Input label="Weight (kg)" type="number" value={form.weight} onChange={set('weight')} placeholder="70" min="30" max="300" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Age" type="number" value={form.age} onChange={set('age')} placeholder="25" min="10" max="100" required />
              <div>
                <label className="text-sm font-medium text-text-primary block mb-2">Gender</label>
                <div className="flex gap-2">
                  {['male', 'female', 'other'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setForm((f) => ({ ...f, gender: g }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize transition-all border-2
                        ${form.gender === g ? 'bg-primary text-white border-primary' : 'border-slate-200 text-text-muted hover:border-primary/50'}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 1: Activity Level */}
        {step === 1 && (
          <motion.div key="step1" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'Sora' }}>Activity Level</h2>
            <p className="text-text-muted text-sm">How active are you on a typical week?</p>
            <div className="space-y-2">
              {ACTIVITY_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setForm((f) => ({ ...f, activityLevel: level.value }))}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    form.activityLevel === level.value ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-semibold text-text-primary">{level.label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{level.description}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Goal Type */}
        {step === 2 && (
          <motion.div key="step2" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'Sora' }}>Your Goal</h2>
            <p className="text-text-muted text-sm">What are you working towards?</p>
            <div className="grid gap-3">
              {GOAL_TYPES.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setForm((f) => ({ ...f, goalType: g.value }))}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    form.goalType === g.value ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-3xl">{g.icon}</span>
                  <div>
                    <p className="font-semibold text-text-primary">{g.label}</p>
                    <p className="text-xs text-text-muted">{g.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 3: Target */}
        {step === 3 && (
          <motion.div key="step3" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'Sora' }}>Set Your Target</h2>
            <p className="text-text-muted text-sm">Where do you want to be?</p>
            <Input label="Target Weight (kg)" type="number" value={form.targetWeight} onChange={set('targetWeight')} placeholder="65" min="30" max="300" required />
            <Input label="Target Date (optional)" type="date" value={form.targetDate} onChange={set('targetDate')} />
            <div className="bg-primary/5 rounded-xl p-4 text-sm text-text-muted">
              <p>💡 We'll calculate your daily calorie target based on your goal and timeline.</p>
            </div>
          </motion.div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <motion.div key="step4" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-6">
            <div className="flex justify-center">
              <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 0.6 }}>
                <CheckCircle size={64} className="text-primary" />
              </motion.div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2" style={{ fontFamily: 'Sora' }}>Goal Set! 🎉</h2>
              <p className="text-text-muted">Here are your personalized tips for the first week:</p>
            </div>
            {tips.length > 0 && (
              <div className="text-left space-y-3">
                {tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl">
                    <span className="text-primary font-bold text-sm">{i + 1}</span>
                    <p className="text-sm text-text-primary">{tip}</p>
                  </div>
                ))}
              </div>
            )}
            <Button fullWidth onClick={onComplete} variant="primary">Let's Go! 🚀</Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      {step < 4 && (
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <Button variant="outline" icon={ChevronLeft} onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          )}
          <Button
            fullWidth
            variant="primary"
            onClick={step === 3 ? () => setupMutation.mutate() : () => setStep((s) => s + 1)}
            loading={setupMutation.isPending}
            disabled={!canProceed()}
            icon={step < 3 ? ChevronRight : CheckCircle}
          >
            {step === 3 ? 'Calculate My Targets' : 'Next'}
          </Button>
        </div>
      )}
    </div>
  );
}
