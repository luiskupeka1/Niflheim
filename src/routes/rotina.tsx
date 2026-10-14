import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Check, 
  Flame, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  Sparkles,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLifestyle } from '@/components/lifestyle-provider';
import { SectionHeading } from '@/components/page-ui';
import { localDay, streak } from '@/lib/metrics';

export const Route = createFileRoute('/rotina')({
  head: () => ({
    meta: [
      { title: 'NIFLHEIM — Rotina & Hábitos' },
      { name: 'description', content: 'Gestão de hábitos diários, consistência e streaks.' },
    ],
  }),
  component: RotinaPage,
});

function RotinaPage() {
  const { user, data, save, reward } = useLifestyle();
  const today = localDay();
  const completed = data.completions.filter((e) => e.day === today);
  const habits = [...data.habits].sort(
    (a, b) => (a.details['order'] ?? 0) - (b.details['order'] ?? 0)
  );

  const [isCreating, setIsCreating] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('Manhã');

  const daysStreak = streak(data.xp.map((e) => e.day ?? ''));

  const toggleHabit = async (habitId: string) => {
    const c = completed.find((e) => e.habit_id === habitId);
    const success = await save({
      table: 'habit_completions',
      record: c
        ? { id: c.id }
        : { id: crypto.randomUUID(), day: today, habit_id: habitId },
      remove: !!c,
    });
    if (success && !c) {
      reward(20);
    }
  };

  const handleCreateHabit = async () => {
    if (!newHabitName.trim()) return;
    const success = await save({
      table: 'habits',
      record: {
        id: crypto.randomUUID(),
        details: {
          name: newHabitName.trim(),
          category: newHabitCategory,
          order: habits.length + 1,
        },
      },
    });
    if (success) {
      setNewHabitName('');
      setIsCreating(false);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    await save({
      table: 'habits',
      remove: true,
      record: { id: habitId },
    });
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= habits.length) return;

    const current = habits[index];
    const target = habits[targetIndex];

    await save({
      table: 'habits',
      record: {
        id: current.id,
        details: { ...current.details, order: target.details['order'] ?? targetIndex },
      },
    });
    await save({
      table: 'habits',
      record: {
        id: target.id,
        details: { ...target.details, order: current.details['order'] ?? index },
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
            Sistemas & Consistência
          </span>
          <h1 className="text-3xl font-extrabold md:text-4xl">
            Rotina Diária & Hábitos<span className="text-primary">.</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A consistência transforma pequenas ações diárias em resultados imbatíveis.
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-xs"
        >
          <Plus size={15} /> Novo Hábito
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="panel p-4 sm:p-5 rounded-2xl min-w-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span className="font-semibold truncate">Ofensiva Atual</span>
            <Flame size={17} className="text-primary shrink-0" />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-foreground truncate">
            {daysStreak} <span className="text-xs font-normal text-muted-foreground font-sans">dias seguidos</span>
          </div>
          <p className="mt-2 text-[10px] sm:text-[11px] text-muted-foreground truncate">
            Mantenha o ritmo completando metas.
          </p>
        </div>

        <div className="panel p-4 sm:p-5 rounded-2xl min-w-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span className="font-semibold truncate">Concluídos Hoje</span>
            <CheckSquare size={17} className="text-success shrink-0" />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-foreground truncate">
            {completed.length} / {habits.length}
          </div>
          <p className="mt-2 text-[10px] sm:text-[11px] text-muted-foreground truncate">
            {habits.length > 0
              ? `${Math.round((completed.length / habits.length) * 100)}% concluído hoje`
              : 'Nenhum hábito cadastrado'}
          </p>
        </div>

        <div className="panel p-4 sm:p-5 rounded-2xl min-w-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span className="font-semibold truncate">XP de Hábitos</span>
            <Sparkles size={17} className="text-primary shrink-0" />
          </div>
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-foreground truncate">
            +{completed.length * 20} <span className="text-xs font-normal text-primary font-sans">XP</span>
          </div>
          <p className="mt-2 text-[10px] sm:text-[11px] text-muted-foreground truncate">
            +20 XP por hábito diário feito.
          </p>
        </div>
      </div>

      {/* Modal Criar Hábito */}
      {isCreating && (
        <div className="panel p-4 sm:p-6 rounded-2xl border-primary/40 bg-primary/5 space-y-4">
          <h3 className="text-sm font-bold">Criar Novo Hábito</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Nome do hábito (ex: Beber 3L de água, Ler 15 min)..."
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              className="text-xs rounded-xl"
            />
            <select
              value={newHabitCategory}
              onChange={(e) => setNewHabitCategory(e.target.value)}
              className="text-xs rounded-xl"
            >
              <option value="Manhã">Manhã</option>
              <option value="Tarde">Tarde</option>
              <option value="Noite">Noite</option>
              <option value="Saúde">Saúde</option>
              <option value="Estudo">Estudo & Foco</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreating(false)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreateHabit}
              className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-xs rounded-xl"
            >
              Salvar Hábito
            </Button>
          </div>
        </div>
      )}

      {/* Lista de Hábitos */}
      <div className="panel p-4 sm:p-6 rounded-2xl">
        <SectionHeading title="Checklist do Dia" />

        {habits.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Target size={32} className="mx-auto mb-3 text-primary opacity-60" />
            <h3 className="font-semibold text-foreground text-sm">
              Sua lista de hábitos está vazia.
            </h3>
            <p className="mt-1 text-xs">
              Adicione hábitos matinais, de foco ou de saúde para começar a acumular XP.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreating(true)}
              className="mt-4 text-xs rounded-xl"
            >
              <Plus size={13} /> Criar Primeiro Hábito
            </Button>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-border/40">
            {habits.map((h, idx) => {
              const isDone = completed.some((c) => c.habit_id === h.id);
              return (
                <div
                  key={h.id}
                  className="flex items-center justify-between py-3 hover:bg-muted/15 px-2 rounded-xl transition-colors gap-2"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleHabit(h.id)}
                      className={`inline-flex size-6 items-center justify-center rounded-lg border transition-all shrink-0 ${
                        isDone
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'border-border bg-background text-muted-foreground hover:border-primary'
                      }`}
                    >
                      {isDone && <Check size={13} strokeWidth={3} />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-semibold truncate ${
                          isDone ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}
                      >
                        {h.details['name']}
                      </p>
                      <span className="text-[10px] text-muted-foreground truncate block">
                        {h.details['category']}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold text-primary mr-2">
                      +20 XP
                    </span>
                    <button
                      disabled={idx === 0}
                      onClick={() => handleReorder(idx, 'up')}
                      className="p-1 text-muted-foreground/60 hover:text-foreground disabled:opacity-30"
                    >
                      <MoveUp size={13} />
                    </button>
                    <button
                      disabled={idx === habits.length - 1}
                      onClick={() => handleReorder(idx, 'down')}
                      className="p-1 text-muted-foreground/60 hover:text-foreground disabled:opacity-30"
                    >
                      <MoveDown size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteHabit(h.id)}
                      className="p-1 text-muted-foreground/60 hover:text-destructive"
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
    </div>
  );
}
