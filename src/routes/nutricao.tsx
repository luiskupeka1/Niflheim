import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { 
  Utensils, 
  Plus, 
  Trash2, 
  Footprints, 
  Flame, 
  CheckCircle2, 
  Search, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Edit2,
  Sliders,
  Check,
  RotateCcw,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLifestyle } from '@/components/lifestyle-provider';
import { SectionHeading } from '@/components/page-ui';
import { MacroRing, MacroBars } from '@/components/macro-ring';
import { localDay } from '@/lib/metrics';
import { 
  calculateCardioMetrics, 
  calculateMultiSegmentCardio, 
  type CardioIntensity,
  type CardioSegment 
} from '@/lib/calculateCardioMetrics';

export const Route = createFileRoute('/nutricao')({
  head: () => ({
    meta: [
      { title: 'NIFLHEIM — Nutrição & Tracking' },
      { name: 'description', content: 'Diário alimentar, CRUD total de refeições, meta diária calculada e cardio multietapas.' },
    ],
  }),
  component: NutricaoPage,
});

const DEFAULT_MEAL_CATEGORIES = [
  'Café da Manhã',
  'Almoço',
  'Café da Tarde',
  'Jantar',
  'Pré-Treino',
  'Pós-Treino',
];

interface FoodItemCatalog {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  verified?: boolean;
}

const CATALOG_FOODS: FoodItemCatalog[] = [
  { id: 'f-1', name: 'Peito de Frango Grelhado', kcal: 159, protein: 32, carbs: 0, fat: 2.5, fiber: 0, verified: true },
  { id: 'f-2', name: 'Arroz Branco Cozido', kcal: 130, protein: 2.5, carbs: 28.2, fat: 0.3, fiber: 0.4, verified: true },
  { id: 'f-3', name: 'Arroz Integral Cozido', kcal: 124, protein: 2.6, carbs: 25.8, fat: 1, fiber: 2.7, verified: true },
  { id: 'f-4', name: 'Ovo Inteiro Cozido', kcal: 146, protein: 13.3, carbs: 0.6, fat: 9.5, fiber: 0, verified: true },
  { id: 'f-5', name: 'Aveia em Flocos', kcal: 394, protein: 13.9, carbs: 66.6, fat: 8.5, fiber: 9.1, verified: true },
  { id: 'f-6', name: 'Banana Prata', kcal: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, verified: true },
  { id: 'f-7', name: 'Batata-Doce Cozida', kcal: 77, protein: 0.6, carbs: 18.4, fat: 0.1, fiber: 2.2, verified: true },
  { id: 'f-8', name: 'Whey Protein Concentrado 80%', kcal: 400, protein: 80, carbs: 6.7, fat: 6.7, fiber: 0, verified: true },
  { id: 'f-9', name: 'Azeite de Oliva Extra Virgem', kcal: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, verified: true },
  { id: 'f-10', name: 'Pasta de Amendoim Integral', kcal: 588, protein: 25, carbs: 20, fat: 50, fiber: 6, verified: true },
  { id: 'f-11', name: 'Patinho Moído Grelhado', kcal: 185, protein: 31, carbs: 0, fat: 6, fiber: 0, verified: true },
  { id: 'f-12', name: 'Tilápia Grelhada', kcal: 128, protein: 26, carbs: 0, fat: 2.7, fiber: 0, verified: true },
];

function NutricaoPage() {
  const { user, data, save, reward } = useLifestyle();
  const today = localDay();
  const userWeight = data.profile?.weight || 75;

  // Custom Categories de Refeição
  const [mealCategories, setMealCategories] = useState<string[]>(DEFAULT_MEAL_CATEGORIES);
  const [newMealCategoryName, setNewMealCategoryName] = useState('');
  const [isAddingNewMealCategory, setIsAddingNewMealCategory] = useState(false);

  // Acordeão de Refeições
  const [openMeal, setOpenMeal] = useState<string>('Almoço');

  // Modal de Adicionar Alimento
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<string>('Café da Manhã');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrams, setSelectedGrams] = useState<number>(100);

  // Cadastro de Novo Alimento Personalizado
  const [isCreatingCustomFood, setIsCreatingCustomFood] = useState(false);
  const [customFoodName, setCustomFoodName] = useState('');
  const [customFoodKcal, setCustomFoodKcal] = useState<number>(100);
  const [customFoodProtein, setCustomFoodProtein] = useState<number>(10);
  const [customFoodCarbs, setCustomFoodCarbs] = useState<number>(10);
  const [customFoodFat, setCustomFoodFat] = useState<number>(2);

  // Edição inline de gramas de item já lançado
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemGrams, setEditingItemGrams] = useState<number>(100);

  // Meta Calórica Base Editável
  const [customBaseTarget, setCustomBaseTarget] = useState<number>(
    data.profile?.calorie_target ?? 2400
  );
  const [isEditingBaseTarget, setIsEditingBaseTarget] = useState(false);

  // CARDIO MULTIETAPAS (NÃO-LINEAR)
  const [cardioSegments, setCardioSegments] = useState<CardioSegment[]>([
    { id: 'cs-1', name: 'Caminhada Aquecimento', minutes: 10, intensity: 'low' },
    { id: 'cs-2', name: 'Trote Z2 Moderado', minutes: 10, intensity: 'moderate' },
    { id: 'cs-3', name: 'Corrida Alta Intensidade', minutes: 10, intensity: 'high' },
  ]);

  // Cálculos Comportamentais Reativos de Nutrição
  const todayNutritionEntries = useMemo(() => {
    return data.nutrition.filter((e) => e.day === today);
  }, [data.nutrition, today]);

  const todayCardioEntries = useMemo(() => {
    return data.cardio.filter((e) => e.day === today);
  }, [data.cardio, today]);

  // Totais Ingeridos
  const ingestedTotals = useMemo(() => {
    return todayNutritionEntries.reduce(
      (acc, item) => ({
        kcal: acc.kcal + Number(item.details['kcal'] ?? 0),
        protein: acc.protein + Number(item.details['protein'] ?? 0),
        carbs: acc.carbs + Number(item.details['carbs'] ?? 0),
        fat: acc.fat + Number(item.details['fat'] ?? 0),
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [todayNutritionEntries]);

  // Crédito ganho de cardio já registrado hoje
  const cardioCreditCalories = useMemo(() => {
    return todayCardioEntries.reduce(
      (sum, item) => sum + Number(item.details['calories'] ?? 0),
      0
    );
  }, [todayCardioEntries]);

  const totalStepsToday = useMemo(() => {
    return todayCardioEntries.reduce(
      (sum, item) => sum + Number(item.details['steps'] ?? 0),
      0
    );
  }, [todayCardioEntries]);

  // Meta Dinâmica Total = Meta Base + Calorias Ganhas do Cardio
  const effectiveCalorieGoal = customBaseTarget + cardioCreditCalories;
  // Saldo Restante
  const remainingCalories = effectiveCalorieGoal - ingestedTotals.kcal;

  // Cálculo da Sessão de Cardio Multietapas em Planejamento
  const previewMultiCardio = useMemo(() => {
    return calculateMultiSegmentCardio(cardioSegments, userWeight);
  }, [cardioSegments, userWeight]);

  // Presets Rápidos de Cardio Composto
  const applyCardioPreset = (type: '10_10_10' | 'z2_run' | 'hiit_burn') => {
    if (type === '10_10_10') {
      setCardioSegments([
        { id: crypto.randomUUID(), name: 'Caminhada', minutes: 10, intensity: 'low' },
        { id: crypto.randomUUID(), name: 'Trote Z2', minutes: 10, intensity: 'moderate' },
        { id: crypto.randomUUID(), name: 'Corrida Intensa', minutes: 10, intensity: 'high' },
      ]);
    } else if (type === 'z2_run') {
      setCardioSegments([
        { id: crypto.randomUUID(), name: 'Aquecimento', minutes: 5, intensity: 'low' },
        { id: crypto.randomUUID(), name: 'Trote Z2 Contínuo', minutes: 25, intensity: 'moderate' },
      ]);
    } else if (type === 'hiit_burn') {
      setCardioSegments([
        { id: crypto.randomUUID(), name: 'Aquecimento Leve', minutes: 5, intensity: 'low' },
        { id: crypto.randomUUID(), name: 'Tiros / HIIT', minutes: 15, intensity: 'high' },
        { id: crypto.randomUUID(), name: 'Desaquecimento', minutes: 10, intensity: 'low' },
      ]);
    }
  };

  const handleAddCardioSegment = () => {
    setCardioSegments((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: `Etapa #${prev.length + 1}`,
        minutes: 10,
        intensity: 'moderate',
      },
    ]);
  };

  const handleUpdateCardioSegment = (id: string, updates: Partial<CardioSegment>) => {
    setCardioSegments((prev) =>
      prev.map((seg) => (seg.id === id ? { ...seg, ...updates } : seg))
    );
  };

  const handleRemoveCardioSegment = (id: string) => {
    if (cardioSegments.length <= 1) return;
    setCardioSegments((prev) => prev.filter((s) => s.id !== id));
  };

  // Registrar Sessão Multietapas
  const handleRegisterMultiCardio = async () => {
    if (previewMultiCardio.totalMinutes <= 0) return;
    const success = await save({
      table: 'cardio_logs',
      record: {
        id: crypto.randomUUID(),
        day: today,
        details: {
          minutes: previewMultiCardio.totalMinutes,
          intensity: 'multi_segment',
          steps: previewMultiCardio.totalSteps,
          calories: previewMultiCardio.totalCalories,
          segments: previewMultiCardio.segmentBreakdown,
        },
      },
    });
    if (success) {
      reward(40);
      alert(`Sessão multietapa registrada! +${previewMultiCardio.totalSteps.toLocaleString('pt-BR')} passos e +${previewMultiCardio.totalCalories} kcal adicionadas ao seu saldo diário.`);
    }
  };

  // CRUD DE ALIMENTOS
  const handleAddFoodToMeal = async (food: FoodItemCatalog) => {
    const ratio = selectedGrams / 100;
    const success = await save({
      table: 'daily_nutrition',
      record: {
        id: crypto.randomUUID(),
        day: today,
        meal: selectedMeal,
        food_id: food.id,
        details: {
          name: food.name,
          baseKcal100g: food.kcal,
          baseProtein100g: food.protein,
          baseCarbs100g: food.carbs,
          baseFat100g: food.fat,
          grams: selectedGrams,
          kcal: Math.round(food.kcal * ratio),
          protein: Math.round(food.protein * ratio * 10) / 10,
          carbs: Math.round(food.carbs * ratio * 10) / 10,
          fat: Math.round(food.fat * ratio * 10) / 10,
          fiber: Math.round(food.fiber * ratio * 10) / 10,
        },
      },
    });
    if (success) {
      reward(15);
      setIsAddingFood(false);
    }
  };

  // Criar alimento personalizado
  const handleCreateAndAddCustomFood = async () => {
    if (!customFoodName.trim()) return;
    const newFood: FoodItemCatalog = {
      id: crypto.randomUUID(),
      name: customFoodName.trim(),
      kcal: customFoodKcal,
      protein: customFoodProtein,
      carbs: customFoodCarbs,
      fat: customFoodFat,
      fiber: 0,
      verified: false,
    };
    await handleAddFoodToMeal(newFood);
    setIsCreatingCustomFood(false);
    setCustomFoodName('');
  };

  // Atualizar gramas de um item existente
  const handleSaveEditedGrams = async (item: any) => {
    const baseKcal = Number(item.details['baseKcal100g'] ?? (Number(item.details['kcal']) / Number(item.details['grams'] || 100)) * 100);
    const baseProt = Number(item.details['baseProtein100g'] ?? (Number(item.details['protein']) / Number(item.details['grams'] || 100)) * 100);
    const baseCarb = Number(item.details['baseCarbs100g'] ?? (Number(item.details['carbs']) / Number(item.details['grams'] || 100)) * 100);
    const baseFat = Number(item.details['baseFat100g'] ?? (Number(item.details['fat']) / Number(item.details['grams'] || 100)) * 100);

    const ratio = editingItemGrams / 100;
    await save({
      table: 'daily_nutrition',
      record: {
        ...item,
        details: {
          ...item.details,
          grams: editingItemGrams,
          kcal: Math.round(baseKcal * ratio),
          protein: Math.round(baseProt * ratio * 10) / 10,
          carbs: Math.round(baseCarb * ratio * 10) / 10,
          fat: Math.round(baseFat * ratio * 10) / 10,
        },
      },
    });
    setEditingItemId(null);
  };

  // Excluir item
  const handleDeleteItem = async (id: string) => {
    await save({
      table: 'daily_nutrition',
      remove: true,
      record: { id },
    });
  };

  // Adicionar nova categoria de refeição
  const handleAddMealCategory = () => {
    if (!newMealCategoryName.trim()) return;
    if (!mealCategories.includes(newMealCategoryName.trim())) {
      setMealCategories([...mealCategories, newMealCategoryName.trim()]);
    }
    setOpenMeal(newMealCategoryName.trim());
    setNewMealCategoryName('');
    setIsAddingNewMealCategory(false);
  };

  const filteredCatalog = CATALOG_FOODS.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
            Nutrição de Precisão & Controle Total
          </span>
          <h1 className="text-3xl font-extrabold md:text-4xl text-foreground">
            Diário Alimentar & Cardio Não-Linear<span className="text-primary">.</span>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Bata seus macronutrientes, crie sessões fracionadas de cardio e gerencie o saldo calórico real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setSelectedMeal(mealCategories[0]);
              setIsAddingFood(true);
            }}
            className="bg-primary text-primary-foreground font-black hover:bg-primary/90 text-xs flex items-center gap-1.5"
          >
            <Plus size={15} /> + Adicionar Alimento
          </Button>
        </div>
      </div>

      {/* DASHBOARD DE METAS & SALDO CALÓRICO REATIVO */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Painel do Macro Ring com Recálculo Dinâmico */}
        <div className="panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <SectionHeading title="Equilíbrio Diário & Saldo Real" />
            <div className="flex items-center gap-2">
              {isEditingBaseTarget ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="50"
                    value={customBaseTarget}
                    onChange={(e) => setCustomBaseTarget(parseInt(e.target.value) || 2000)}
                    className="w-20 rounded border border-primary bg-background px-1.5 py-0.5 text-center font-mono text-xs font-bold text-primary"
                  />
                  <Button
                    size="sm"
                    onClick={() => setIsEditingBaseTarget(false)}
                    className="h-6 px-2 text-[10px] bg-primary text-primary-foreground font-bold"
                  >
                    Salvar
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingBaseTarget(true)}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                >
                  <Target size={12} /> Meta Base: <strong className="text-foreground">{customBaseTarget} kcal</strong>
                </button>
              )}
            </div>
          </div>

          <div className="grid items-center gap-6 sm:grid-cols-2">
            <MacroRing
              kcal={ingestedTotals.kcal}
              goal={effectiveCalorieGoal}
              protein={ingestedTotals.protein}
              carbs={ingestedTotals.carbs}
              fat={ingestedTotals.fat}
              targets={{
                protein: data.profile?.protein_target ?? 160,
                carbs: data.profile?.carb_target ?? 280,
                fat: data.profile?.fat_target ?? 70,
              }}
            />
            <MacroBars
              values={ingestedTotals}
              targets={{
                protein: data.profile?.protein_target ?? 160,
                carbs: data.profile?.carb_target ?? 280,
                fat: data.profile?.fat_target ?? 70,
              }}
            />
          </div>

          {/* Cards de Saldo Calórico Dinâmico */}
          <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-4 text-center">
            <div className="rounded-xl bg-muted/20 p-2.5">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Teto Calórico</span>
              <span className="text-sm md:text-base font-black font-mono text-foreground">
                {effectiveCalorieGoal} <span className="text-[10px] text-muted-foreground font-sans">kcal</span>
              </span>
              <span className="text-[9px] text-emerald-400 block">
                {cardioCreditCalories > 0 ? `+${cardioCreditCalories} do cardio` : 'Base programada'}
              </span>
            </div>

            <div className="rounded-xl bg-muted/20 p-2.5">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Consumido</span>
              <span className="text-sm md:text-base font-black font-mono text-primary">
                {Math.round(ingestedTotals.kcal)} <span className="text-[10px] text-muted-foreground font-sans">kcal</span>
              </span>
              <span className="text-[9px] text-muted-foreground block">
                {todayNutritionEntries.length} alimentos
              </span>
            </div>

            <div className={`rounded-xl p-2.5 border ${
              remainingCalories >= 0
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              <span className="text-[10px] uppercase font-bold block">
                {remainingCalories >= 0 ? 'Restante' : 'Superávit'}
              </span>
              <span className="text-sm md:text-base font-black font-mono">
                {Math.abs(Math.round(remainingCalories))} <span className="text-[10px] font-sans">kcal</span>
              </span>
              <span className="text-[9px] block">
                {remainingCalories >= 0 ? 'Disponível p/ comer' : 'Acima da meta'}
              </span>
            </div>
          </div>
        </div>

        {/* PAINEL DE CARDIO MULTIETAPAS (NÃO-LINEAR) */}
        <div className="panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-primary tracking-wider">Cálculo Composto</span>
              <SectionHeading title="Farm de Passos & Cardio Multietapas" />
            </div>
            <span className="rounded bg-primary/20 px-2 py-0.5 font-mono text-xs font-black text-primary">
              {previewMultiCardio.totalMinutes} min total
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Monte sua rotina real: combine minutos de caminhada, trote e corrida. O cálculo não-linear soma as intensidades específicas com precisão metabólica.
          </p>

          {/* Presets Rápidos */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-bold text-muted-foreground mr-1">Presets:</span>
            <button
              onClick={() => applyCardioPreset('10_10_10')}
              className="rounded bg-muted/60 px-2 py-1 text-[10px] font-bold text-foreground hover:bg-primary hover:text-primary-foreground transition-all"
            >
              🏃 10m Anda + 10m Trota + 10m Corre
            </button>
            <button
              onClick={() => applyCardioPreset('z2_run')}
              className="rounded bg-muted/60 px-2 py-1 text-[10px] font-bold text-foreground hover:bg-primary hover:text-primary-foreground transition-all"
            >
              ⏱️ 5m Aquec. + 25m Z2
            </button>
            <button
              onClick={() => applyCardioPreset('hiit_burn')}
              className="rounded bg-muted/60 px-2 py-1 text-[10px] font-bold text-foreground hover:bg-primary hover:text-primary-foreground transition-all"
            >
              🔥 HIIT Explosivo
            </button>
          </div>

          {/* Lista de Etapas do Cardio Composto */}
          <div className="space-y-2.5 pt-1 max-h-56 overflow-y-auto pr-1">
            {cardioSegments.map((seg, idx) => (
              <div
                key={seg.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/80 bg-background/80 p-2.5 text-xs"
              >
                <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                  <span className="flex size-5 items-center justify-center rounded bg-secondary text-[10px] font-mono font-bold text-muted-foreground">
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={seg.name}
                    onChange={(e) => handleUpdateCardioSegment(seg.id, { name: e.target.value })}
                    className="border-0 bg-transparent text-xs font-bold text-foreground focus:ring-0 p-0 w-28"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={seg.minutes}
                      onChange={(e) =>
                        handleUpdateCardioSegment(seg.id, { minutes: Math.max(1, parseInt(e.target.value) || 0) })
                      }
                      className="w-12 rounded border border-border bg-background px-1 py-0.5 text-center font-mono text-xs font-bold"
                    />
                    <span className="text-[10px] text-muted-foreground">min</span>
                  </div>

                  <select
                    value={seg.intensity}
                    onChange={(e) =>
                      handleUpdateCardioSegment(seg.id, { intensity: e.target.value as CardioIntensity })
                    }
                    className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-bold text-foreground"
                  >
                    <option value="low">Caminhada (100 ppm)</option>
                    <option value="moderate">Trote (120 ppm)</option>
                    <option value="high">Corrida/HIIT (150 ppm)</option>
                  </select>

                  <button
                    onClick={() => handleRemoveCardioSegment(seg.id)}
                    disabled={cardioSegments.length <= 1}
                    className="text-muted-foreground hover:text-destructive disabled:opacity-20 p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddCardioSegment}
              className="text-[11px] h-7 border-dashed"
            >
              <Plus size={13} /> + Adicionar Etapa
            </Button>
          </div>

          {/* Resultado Composto e Botão de Registro */}
          <div className="rounded-xl border border-primary/40 bg-primary/10 p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-black text-foreground">
                <Footprints size={16} className="text-primary" />
                <span>+{previewMultiCardio.totalSteps.toLocaleString('pt-BR')} Passos Farmados</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Libera <strong className="text-primary">+{previewMultiCardio.totalCalories} kcal</strong> no teto calórico de hoje.
              </div>
            </div>

            <Button
              onClick={handleRegisterMultiCardio}
              className="bg-primary text-primary-foreground font-black hover:bg-primary/90 text-xs flex items-center gap-1.5"
            >
              <Flame size={14} /> Registrar Cardio
            </Button>
          </div>
        </div>
      </div>

      {/* CRUD TOTAL DE REFEIÇÕES */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl md:text-2xl font-black text-foreground flex items-center gap-2">
            <Utensils size={20} className="text-primary" /> Refeições do Dia & Registro
          </h2>

          <div className="flex items-center gap-2">
            {isAddingNewMealCategory ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Nome (ex: Ceia, Lanche 2)..."
                  value={newMealCategoryName}
                  onChange={(e) => setNewMealCategoryName(e.target.value)}
                  className="rounded border border-border bg-background px-2 py-1 text-xs"
                />
                <Button size="sm" onClick={handleAddMealCategory} className="text-xs h-7 bg-primary text-primary-foreground font-bold">
                  Adicionar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsAddingNewMealCategory(false)} className="text-xs h-7">
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingNewMealCategory(true)}
                className="text-xs border-dashed"
              >
                + Nova Refeição
              </Button>
            )}
          </div>
        </div>

        {mealCategories.map((meal) => {
          const items = todayNutritionEntries.filter((e) => e.meal === meal);
          const mealKcal = items.reduce((sum, item) => sum + Number(item.details['kcal'] ?? 0), 0);
          const mealProtein = items.reduce((sum, item) => sum + Number(item.details['protein'] ?? 0), 0);
          const mealCarbs = items.reduce((sum, item) => sum + Number(item.details['carbs'] ?? 0), 0);
          const mealFat = items.reduce((sum, item) => sum + Number(item.details['fat'] ?? 0), 0);
          const isOpen = openMeal === meal;

          return (
            <div key={meal} className="panel overflow-hidden transition-all">
              <div
                onClick={() => setOpenMeal(isOpen ? '' : meal)}
                className="flex cursor-pointer items-center justify-between p-4 md:p-5 hover:bg-muted/20"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-secondary text-primary">
                    <Utensils size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-foreground">{meal}</h3>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {items.length} {items.length === 1 ? 'item' : 'itens'} •{' '}
                      <strong className="text-foreground">{Math.round(mealKcal)} kcal</strong> •{' '}
                      <span className="text-primary">{Math.round(mealProtein)}g P</span> •{' '}
                      <span className="text-sky-400">{Math.round(mealCarbs)}g C</span> •{' '}
                      <span className="text-amber-400">{Math.round(mealFat)}g G</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMeal(meal);
                      setIsAddingFood(true);
                    }}
                    className="text-xs h-8 flex items-center gap-1"
                  >
                    <Plus size={13} /> Alimento
                  </Button>
                  <button className="text-muted-foreground">
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-border/60 bg-background/50 p-4 md:p-5">
                  {items.length === 0 ? (
                    <div className="text-center py-4 space-y-2">
                      <p className="text-xs text-muted-foreground italic">
                        Nenhum alimento registrado em {meal}.
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedMeal(meal);
                          setIsAddingFood(true);
                        }}
                        className="text-xs text-primary font-bold hover:bg-primary/10"
                      >
                        + Adicionar primeiro alimento
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40">
                      {items.map((item) => {
                        const isEditing = editingItemId === item.id;

                        return (
                          <div
                            key={item.id}
                            className="flex flex-wrap items-center justify-between py-2.5 text-xs gap-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground">
                                {item.details['name']}
                              </span>

                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="1"
                                    max="2000"
                                    value={editingItemGrams}
                                    onChange={(e) => setEditingItemGrams(parseInt(e.target.value) || 0)}
                                    className="w-16 rounded border border-primary bg-background px-1 py-0.5 text-center font-mono text-xs font-bold"
                                  />
                                  <span className="text-[10px] text-muted-foreground">g</span>
                                  <button
                                    onClick={() => handleSaveEditedGrams(item)}
                                    className="p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90"
                                    title="Salvar nova porção"
                                  >
                                    <Check size={12} />
                                  </button>
                                  <button
                                    onClick={() => setEditingItemId(null)}
                                    className="p-1 rounded text-muted-foreground hover:text-foreground"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingItemId(item.id);
                                    setEditingItemGrams(Number(item.details['grams'] || 100));
                                  }}
                                  className="text-muted-foreground hover:text-primary flex items-center gap-0.5 font-mono text-[11px]"
                                  title="Clique para editar as gramas"
                                >
                                  ({item.details['grams']}g) <Edit2 size={10} />
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-4">
                              <span className="font-mono text-muted-foreground text-[11px]">
                                <b className="text-foreground">{item.details['kcal']}</b> kcal ·{' '}
                                <b className="text-primary">{item.details['protein']}g</b> P ·{' '}
                                <b className="text-sky-400">{item.details['carbs']}g</b> C ·{' '}
                                <b className="text-amber-400">{item.details['fat']}g</b> G
                              </span>

                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-muted-foreground hover:text-destructive p-1 rounded"
                                title="Excluir item da refeição"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL ADICIONAR ALIMENTO OU CRIAR PERSONALIZADO */}
      {isAddingFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="panel max-w-lg w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-primary">Inserção de Alimento</span>
                <h3 className="text-lg font-black text-foreground">Adicionar a {selectedMeal}</h3>
              </div>
              <button
                onClick={() => {
                  setIsAddingFood(false);
                  setIsCreatingCustomFood(false);
                }}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Alternar entre Catálogo e Criar Personalizado */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">
                {isCreatingCustomFood ? 'Cadastrar Novo Alimento:' : 'Pesquisar na Tabela Nutricional:'}
              </span>
              <button
                onClick={() => setIsCreatingCustomFood(!isCreatingCustomFood)}
                className="text-xs text-primary font-bold hover:underline"
              >
                {isCreatingCustomFood ? '← Voltar ao Catálogo' : '+ Criar Alimento Personalizado'}
              </button>
            </div>

            {isCreatingCustomFood ? (
              /* Formulário de Alimento Personalizado */
              <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                    Nome do Alimento:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Iogurte Grego Caseiro..."
                    value={customFoodName}
                    onChange={(e) => setCustomFoodName(e.target.value)}
                    className="w-full text-xs"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground block">Kcal / 100g:</label>
                    <input
                      type="number"
                      value={customFoodKcal}
                      onChange={(e) => setCustomFoodKcal(parseFloat(e.target.value) || 0)}
                      className="w-full text-center font-mono text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block">Proteína (g):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={customFoodProtein}
                      onChange={(e) => setCustomFoodProtein(parseFloat(e.target.value) || 0)}
                      className="w-full text-center font-mono text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block">Carboidrato (g):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={customFoodCarbs}
                      onChange={(e) => setCustomFoodCarbs(parseFloat(e.target.value) || 0)}
                      className="w-full text-center font-mono text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block">Gordura (g):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={customFoodFat}
                      onChange={(e) => setCustomFoodFat(parseFloat(e.target.value) || 0)}
                      className="w-full text-center font-mono text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Porção a lançar:</span>
                    <input
                      type="number"
                      value={selectedGrams}
                      onChange={(e) => setSelectedGrams(parseInt(e.target.value) || 100)}
                      className="w-18 text-center font-mono text-xs font-bold"
                    />
                    <span className="text-xs text-muted-foreground">g</span>
                  </div>

                  <Button
                    onClick={handleCreateAndAddCustomFood}
                    className="bg-primary text-primary-foreground font-black text-xs"
                  >
                    Salvar e Adicionar
                  </Button>
                </div>
              </div>
            ) : (
              /* Catálogo e Busca */
              <>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar alimento (ex: Frango, Arroz, Ovo)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 text-xs"
                    autoFocus
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Porção a registrar:</span>
                  <input
                    type="number"
                    min="5"
                    max="3000"
                    step="10"
                    value={selectedGrams}
                    onChange={(e) => setSelectedGrams(parseInt(e.target.value) || 100)}
                    className="w-24 text-xs font-mono font-bold text-center"
                  />
                  <span className="text-xs text-muted-foreground font-semibold">gramas</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-64">
                  {filteredCatalog.map((f) => {
                    const ratio = selectedGrams / 100;
                    return (
                      <div
                        key={f.id}
                        onClick={() => handleAddFoodToMeal(f)}
                        className="flex cursor-pointer items-center justify-between rounded-xl border border-border/80 p-3 hover:border-primary hover:bg-primary/5 transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                            {f.name}
                            {f.verified && (
                              <span title="Validado pela Tabela TACO">
                                <CheckCircle2 size={13} className="text-primary" />
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                            {Math.round(f.kcal * ratio)} kcal · {Math.round(f.protein * ratio)}g P · {Math.round(f.carbs * ratio)}g C · {Math.round(f.fat * ratio)}g G
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="text-xs text-primary font-bold">
                          + Adicionar
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
