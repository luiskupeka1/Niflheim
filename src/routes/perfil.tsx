import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { 
  UserRound, 
  Flame, 
  Zap, 
  Scale, 
  Sliders, 
  Save, 
  Sparkles,
  Trophy,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLifestyle } from '@/components/lifestyle-provider';
import { SectionHeading } from '@/components/page-ui';
import { metabolism, level, streak, activityFactors } from '@/lib/metrics';
import { toast } from 'sonner';

export const Route = createFileRoute('/perfil')({
  head: () => ({
    meta: [
      { title: 'NIFLHEIM — Perfil & Motor Metabólico' },
      { name: 'description', content: 'Fórmula Mifflin-St Jeor, onboarding interativo e sliders de macros.' },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  const { user, data, save, reward } = useLifestyle();
  const xp = data.xp.reduce((s, e) => s + (e.points ?? 0), 0);
  const lvl = level(xp);
  const days = streak(data.xp.map((e) => e.day ?? ''));

  // Estados do formulário metabólico
  const [name, setName] = useState(data.profile?.name || '');
  const [phone, setPhone] = useState(data.profile?.phone || '');
  const [age, setAge] = useState<number>(data.profile?.age || 26);
  const [sex, setSex] = useState<'male' | 'female'>((data.profile?.sex as any) || 'male');
  const [height, setHeight] = useState<number>(data.profile?.height || 178);
  const [weight, setWeight] = useState<number>(data.profile?.weight || 78);
  const [bodyFat, setBodyFat] = useState<number>(data.profile?.body_fat || 14);
  const [goal, setGoal] = useState<'cutting' | 'bulking' | 'maintenance'>((data.profile?.goal as any) || 'maintenance');
  const [activity, setActivity] = useState<number>(data.profile?.activity || 1.55);

  // Sliders de Macronutrientes Manuais
  const [proteinGrams, setProteinGrams] = useState<number>(
    data.profile?.protein_target || Math.round(weight * 2.2)
  );
  const [fatGrams, setFatGrams] = useState<number>(
    data.profile?.fat_target || Math.round(weight * 0.9)
  );
  const [carbGrams, setCarbGrams] = useState<number>(
    data.profile?.carb_target || 250
  );

  // Cálculo dinâmico em tempo real de Mifflin-St Jeor
  const calculatedMetabolism = useMemo(() => {
    return metabolism({
      weight,
      height,
      age,
      sex,
      activity,
    });
  }, [weight, height, age, sex, activity]);

  // Calorias totais com base nos macros atuais
  const currentTotalKcal = Math.round(proteinGrams * 4 + carbGrams * 4 + fatGrams * 9);

  const handleApplyCalculatedMacros = () => {
    setProteinGrams(calculatedMetabolism.protein);
    setFatGrams(calculatedMetabolism.fat);
    setCarbGrams(calculatedMetabolism.carbs);
    toast.success('Macros sugeridos pela fórmula aplicados com sucesso!');
  };

  const handleSaveProfile = async () => {
    const success = await save({
      table: 'profiles' as any,
      record: {
        id: user?.id || crypto.randomUUID(),
        details: {
          name,
          phone,
          age,
          sex,
          height,
          weight,
          body_fat: bodyFat,
          goal,
          activity,
          calorie_target: currentTotalKcal,
          protein_target: proteinGrams,
          carb_target: carbGrams,
          fat_target: fatGrams,
          onboarded: true,
        },
      },
    });
    if (success) {
      reward(50);
      toast.success('Perfil metabólico e metas salvos com sucesso!');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full overflow-hidden">
      {/* Top Banner de Gamificação */}
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-card to-primary/10 p-4 sm:p-6 md:p-8 min-w-0 max-w-full overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-6 min-w-0">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <span className="grid size-14 sm:size-16 place-items-center rounded-2xl bg-primary text-primary-foreground font-black text-xl sm:text-2xl shadow-lg shrink-0">
              {lvl.level}
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                <Sparkles size={12} className="shrink-0" /> Nível de Evolução Geral
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-foreground truncate">
                Lvl {lvl.level} · {name || 'Guerreiro NIFLHEIM'}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {lvl.progress} / 500 XP para o próximo nível · {days} dias seguidos de ofensiva 🔥
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={handleSaveProfile}
              className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-xs flex items-center gap-1.5"
            >
              <Save size={15} /> Salvar Alterações
            </Button>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 h-2.5 w-full max-w-full rounded-full bg-secondary/80 overflow-hidden border border-border/40 p-0.5">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, (lvl.progress / 500) * 100))}%` }}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Onboarding & Dados Biométricos */}
        <div className="panel p-6 space-y-4">
          <SectionHeading title="Dados Biométricos & Onboarding" />
          <p className="text-xs text-muted-foreground">
            Alimente o motor com seus dados para calibração da Taxa Metabólica Basal.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome..."
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Sexo Biológico
              </label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as 'male' | 'female')}
                className="text-xs"
              >
                <option value="male">Masculino (+5 kcal na TMB)</option>
                <option value="female">Feminino (-161 kcal na TMB)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Idade (anos)
              </label>
              <input
                type="number"
                min="13"
                max="100"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 20)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Altura (cm)
              </label>
              <input
                type="number"
                min="100"
                max="250"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value) || 170)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Peso Atual (kg)
              </label>
              <input
                type="number"
                min="25"
                max="300"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 70)}
                className="text-xs font-bold font-mono text-primary"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Percentual de Gordura Estimado (BF%)
              </label>
              <input
                type="number"
                min="3"
                max="60"
                value={bodyFat}
                onChange={(e) => setBodyFat(parseInt(e.target.value) || 15)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Objetivo Atual
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value as any)}
                className="text-xs"
              >
                <option value="cutting">Cutting (Déficit Calórico)</option>
                <option value="maintenance">Manutenção (Recomposição)</option>
                <option value="bulking">Bulking (Superávit Calórico)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Nível de Atividade Física Diária
            </label>
            <select
              value={activity}
              onChange={(e) => setActivity(parseFloat(e.target.value))}
              className="text-xs"
            >
              <option value={1.2}>Sedentário (Fator 1.2 — Trabalho sentado, pouco treino)</option>
              <option value={1.375}>Leve (Fator 1.375 — Treino 1 a 3 dias/semana)</option>
              <option value={1.55}>Moderado (Fator 1.55 — Treino 3 a 5 dias/semana)</option>
              <option value={1.725}>Intenso (Fator 1.725 — Treino pesado 6 a 7 dias/semana)</option>
              <option value={1.9}>Muito Intenso (Fator 1.9 — Atleta, 2 treinos/dia)</option>
            </select>
          </div>

          {/* Resultado do Motor Matemático Mifflin-St Jeor */}
          <div className="rounded-xl border border-border bg-background/60 p-4 mt-4 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Motor Mifflin-St Jeor Calculado
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">Taxa Metabólica Basal (TMB):</span>
              <b className="font-mono text-sm text-foreground">{calculatedMetabolism.bmr} kcal</b>
            </div>
            <div className="flex items-baseline justify-between border-t border-border/40 pt-2">
              <span className="text-xs text-muted-foreground">Gasto Energético Total (TDEE):</span>
              <b className="font-mono text-base text-primary font-bold">
                {calculatedMetabolism.calories} kcal
              </b>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleApplyCalculatedMacros}
              className="w-full text-xs mt-2 border-primary/40 text-primary font-semibold"
            >
              Aplicar Sugestão Automática aos Macros
            </Button>
          </div>
        </div>

        {/* Sliders Deslizantes de Macronutrientes */}
        <div className="panel p-5 sm:p-6 space-y-6 overflow-hidden min-w-0">
          <SectionHeading title="Ajuste Fino de Macros (Sliders Manuais)" />
          <p className="text-xs text-muted-foreground">
            Ajuste fino com sliders deslizantes em gramas e gramas/kg corporais.
          </p>

          <div className="space-y-5 min-w-0">
            {/* Proteínas */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-baseline justify-between gap-1 text-xs font-semibold">
                <span className="text-protein flex items-center gap-1.5">
                  Proteínas: <b>{proteinGrams}g</b>
                </span>
                <span className="text-muted-foreground font-mono text-[11px]">
                  {(proteinGrams / weight).toFixed(1)}g / kg · {proteinGrams * 4} kcal
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="350"
                step="5"
                value={proteinGrams}
                onChange={(e) => setProteinGrams(parseInt(e.target.value))}
                className="w-full accent-protein max-w-full"
              />
              <div className="flex items-center justify-between text-[10px] text-muted-foreground gap-1">
                <span>50g</span>
                <span className="text-primary font-bold text-center truncate px-1">Faixa: 2.0 - 2.5g/kg</span>
                <span>350g</span>
              </div>
            </div>

            {/* Gorduras */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-baseline justify-between gap-1 text-xs font-semibold">
                <span className="text-fat flex items-center gap-1.5">
                  Gorduras: <b>{fatGrams}g</b>
                </span>
                <span className="text-muted-foreground font-mono text-[11px]">
                  {(fatGrams / weight).toFixed(1)}g / kg · {fatGrams * 9} kcal
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="180"
                step="2"
                value={fatGrams}
                onChange={(e) => setFatGrams(parseInt(e.target.value))}
                className="w-full accent-fat max-w-full"
              />
              <div className="flex items-center justify-between text-[10px] text-muted-foreground gap-1">
                <span>20g</span>
                <span className="text-primary font-bold text-center truncate px-1">Faixa: 0.8 - 1.0g/kg</span>
                <span>180g</span>
              </div>
            </div>

            {/* Carboidratos */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-baseline justify-between gap-1 text-xs font-semibold">
                <span className="text-carbs flex items-center gap-1.5">
                  Carboidratos: <b>{carbGrams}g</b>
                </span>
                <span className="text-muted-foreground font-mono text-[11px]">
                  {(carbGrams / weight).toFixed(1)}g / kg · {carbGrams * 4} kcal
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="600"
                step="10"
                value={carbGrams}
                onChange={(e) => setCarbGrams(parseInt(e.target.value))}
                className="w-full accent-carbs max-w-full"
              />
              <div className="flex items-center justify-between text-[10px] text-muted-foreground gap-1">
                <span>50g</span>
                <span className="text-muted-foreground text-center truncate px-1">Saldo energético</span>
                <span>600g</span>
              </div>
            </div>

            {/* Total Geral de Calorias com base nos Sliders */}
            <div className="rounded-xl border border-primary/50 bg-primary/10 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Calorias Totais Calculadas
                </span>
                <div className="font-display text-2xl sm:text-3xl font-black text-primary">
                  {currentTotalKcal.toLocaleString('pt-BR')} <span className="text-sm font-normal text-foreground">kcal</span>
                </div>
              </div>
              <Button
                onClick={handleSaveProfile}
                className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-xs rounded-xl cursor-pointer"
              >
                Salvar Metas
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
