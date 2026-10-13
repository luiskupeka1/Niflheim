import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
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
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLifestyle } from '@/components/lifestyle-provider';
import { SectionHeading } from '@/components/page-ui';
import { MacroRing, MacroBars } from '@/components/macro-ring';
import { nutritionSummary } from '@/lib/nutrition';
import { localDay } from '@/lib/metrics';
import { calculateCardioMetrics, type CardioIntensity } from '@/lib/calculateCardioMetrics';

export const Route = createFileRoute('/nutricao')({
  head: () => ({
    meta: [
      { title: 'NIFLHEIM — Nutrição & Tracking' },
      { name: 'description', content: 'Diário alimentar, macros dinâmicos e farm de passos.' },
    ],
  }),
  component: NutricaoPage,
});

const MEAL_CATEGORIES = [
  'Café da Manhã',
  'Almoço',
  'Jantar',
  'Pré-Treino',
  'Pós-Treino',
] as const;

function NutricaoPage() {
  const { user, data, save, reward } = useLifestyle();
  const today = localDay();
  const n = nutritionSummary(data, today);

  // Cardio / Farm de passos state
  const [cardioMinutes, setCardioMinutes] = useState(30);
  const [cardioIntensity, setCardioIntensity] = useState<CardioIntensity>('moderate');
  const userWeight = data.profile?.weight || 75;

  // Meal accordion open state
  const [openMeal, setOpenMeal] = useState<string>('Almoço');

  // Modal para adicionar alimento
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<string>('Café da Manhã');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrams, setSelectedGrams] = useState<number>(100);

  // Alimentos padrão do catálogo
  const availableFoods = [
    { id: '11111111-1111-1111-1111-111111111111', name: 'Peito de frango grelhado', portion: '100g', kcal: 159, protein: 32, carbs: 0, fat: 2.5, fiber: 0, verified: true },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Arroz integral cozido', portion: '100g', kcal: 124, protein: 2.6, carbs: 25.8, fat: 1, fiber: 2.7, verified: true },
    { id: '33333333-3333-3333-3333-333333333333', name: 'Ovo inteiro cozido', portion: '100g', kcal: 146, protein: 13.3, carbs: 0.6, fat: 9.5, fiber: 0, verified: true },
    { id: '44444444-4444-4444-4444-444444444444', name: 'Aveia em flocos', portion: '100g', kcal: 394, protein: 13.9, carbs: 66.6, fat: 8.5, fiber: 9.1, verified: true },
    { id: '55555555-5555-5555-5555-555555555555', name: 'Banana prata', portion: '100g', kcal: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, verified: true },
    { id: '66666666-6666-6666-6666-666666666666', name: 'Batata-doce cozida', portion: '100g', kcal: 77, protein: 0.6, carbs: 18.4, fat: 0.1, fiber: 2.2, verified: true },
  ];

  const filteredFoods = availableFoods.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const previewCardio = calculateCardioMetrics(cardioMinutes, cardioIntensity, userWeight);

  const handleRegisterCardio = async () => {
    const success = await save({
      table: 'cardio_logs',
      record: {
        id: crypto.randomUUID(),
        day: today,
        details: {
          minutes: cardioMinutes,
          intensity: cardioIntensity,
          steps: previewCardio.steps,
          calories: previewCardio.calories,
        },
      },
    });
    if (success) {
      reward(30);
    }
  };

  const handleAddFoodToMeal = async (food: typeof availableFoods[0]) => {
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

  const handleDeleteItem = async (id: string) => {
    await save({
      table: 'daily_nutrition',
      remove: true,
      record: { id },
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
            Nutrição de Alta Performance
          </span>
          <h1 className="text-3xl font-extrabold md:text-4xl">
            Diário Alimentar & Macros<span className="text-primary">.</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Bata seus macronutrientes com precisão cirúrgica e sincronize seu gasto calórico.
          </p>
        </div>
        <Button
          onClick={() => setIsAddingFood(true)}
          className="bg-primary text-primary-foreground font-bold hover:bg-primary/90"
        >
          <Plus size={16} /> Adicionar Alimento
        </Button>
      </div>

      {/* Grid: Macro Ring & Farm de Passos */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Painel de Metas e Anel de Macros */}
        <div className="panel p-6">
          <SectionHeading title="Equilíbrio Diário de Macronutrientes" />
          <div className="mt-4 grid items-center gap-6 sm:grid-cols-2">
            <MacroRing
              kcal={n.values.kcal}
              goal={n.goal}
              protein={n.values.protein}
              carbs={n.values.carbs}
              fat={n.values.fat}
              targets={n.targets}
            />
            <MacroBars values={n.values} targets={n.targets} />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between border-t border-border pt-4 text-xs">
            <span className="text-muted-foreground">Meta diária base:</span>
            <b>{(data.profile?.calorie_target ?? 2400).toLocaleString('pt-BR')} kcal</b>
            {n.credit > 0 && (
              <span className="ml-2 rounded bg-success/20 px-2 py-0.5 text-success font-semibold">
                +{n.credit} kcal ganhas do cardio
              </span>
            )}
          </div>
        </div>

        {/* Farm de Passos e Cardio */}
        <div className="panel p-6">
          <SectionHeading title="Farm de Passos & Cardio Extra" />
          <p className="mt-1 text-xs text-muted-foreground">
            Converta tempo de cardio em passos farmados e calorias liberadas no seu teto diário.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Duração:</span>
                <span className="text-primary font-mono">{cardioMinutes} minutos</span>
              </div>
              <input
                type="range"
                min="10"
                max="120"
                step="5"
                value={cardioMinutes}
                onChange={(e) => setCardioMinutes(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <span className="text-xs font-semibold block mb-1">Intensidade (PPM):</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'low', label: 'Baixa (100)', desc: 'Caminhada' },
                  { id: 'moderate', label: 'Mod. (120)', desc: 'Trote Z2' },
                  { id: 'high', label: 'Alta (150)', desc: 'HIIT/Corrida' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCardioIntensity(item.id as CardioIntensity)}
                    className={`rounded-lg border p-2 text-center text-xs transition-all ${
                      cardioIntensity === item.id
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border bg-background text-muted-foreground hover:border-border/80'
                    }`}
                  >
                    <div>{item.label}</div>
                    <div className="text-[10px] opacity-70">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Resultado do Farm */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Footprints size={16} className="text-primary" />
                  <span>+{previewCardio.steps.toLocaleString('pt-BR')} Passos</span>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  Você ganha <b className="text-primary">+{previewCardio.calories} kcal</b> para comer hoje!
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleRegisterCardio}
                className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-xs"
              >
                <Flame size={14} /> Registrar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Blocos Expansíveis de Refeições */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold">Refeições de Hoje</h2>

        {MEAL_CATEGORIES.map((meal) => {
          const items = data.nutrition.filter(
            (e) => e.day === today && e.meal === meal
          );
          const mealKcal = items.reduce(
            (sum, item) => sum + Number(item.details['kcal'] ?? 0),
            0
          );
          const mealProtein = items.reduce(
            (sum, item) => sum + Number(item.details['protein'] ?? 0),
            0
          );
          const isOpen = openMeal === meal;

          return (
            <div key={meal} className="panel overflow-hidden transition-all">
              <div
                onClick={() => setOpenMeal(isOpen ? '' : meal)}
                className="flex cursor-pointer items-center justify-between p-5 hover:bg-muted/20"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-secondary text-primary">
                    <Utensils size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{meal}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {items.length} {items.length === 1 ? 'item' : 'itens'} · {Math.round(mealKcal)} kcal · {Math.round(mealProtein)}g proteína
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
                    className="text-xs h-8"
                  >
                    <Plus size={13} /> Item
                  </Button>
                  <button className="text-muted-foreground">
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-border/60 bg-background/50 p-5">
                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-3">
                      Nenhum alimento registrado nesta refeição.
                    </p>
                  ) : (
                    <div className="divide-y divide-border/40">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between py-2.5 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-foreground">
                              {item.details['name']}
                            </span>
                            <span className="ml-2 text-muted-foreground">
                              ({item.details['grams']}g)
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-mono text-muted-foreground">
                              <b className="text-primary">{item.details['kcal']}</b> kcal ·{' '}
                              <b className="text-protein">{item.details['protein']}g</b> P ·{' '}
                              <b className="text-carbs">{item.details['carbs']}g</b> C ·{' '}
                              <b className="text-fat">{item.details['fat']}g</b> G
                            </span>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-muted-foreground/60 hover:text-destructive"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Adicionar Alimento */}
      {isAddingFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="panel max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold">Adicionar a {selectedMeal}</h3>
              <button
                onClick={() => setIsAddingFood(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            {/* Busca */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar alimento (ex: Frango, Arroz, Ovo)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            {/* Quantidade em Gramas */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Porção:</span>
              <input
                type="number"
                min="10"
                max="2000"
                step="10"
                value={selectedGrams}
                onChange={(e) => setSelectedGrams(parseInt(e.target.value) || 100)}
                className="w-24 text-xs font-mono font-bold text-center"
              />
              <span className="text-xs text-muted-foreground">gramas</span>
            </div>

            {/* Lista de Alimentos Validados */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {filteredFoods.map((f) => {
                const ratio = selectedGrams / 100;
                return (
                  <div
                    key={f.id}
                    onClick={() => handleAddFoodToMeal(f)}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3 hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        {f.name}
                        {f.verified && (
                          <span title="Alimento Validado">
                            <CheckCircle2 size={13} className="text-primary" />
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
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
          </div>
        </div>
      )}
    </div>
  );
}
