import { createFileRoute,Link } from '@tanstack/react-router';
import { ArrowRight,Plus,Flame,Dumbbell,Footprints,Check,Clock,Zap,ArrowUpRight,Sun,BookOpen,Target,ChevronLeft,ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLifestyle } from '@/components/lifestyle-provider';
import { SectionHeading } from '@/components/page-ui';
import { MacroRing,MacroBars } from '@/components/macro-ring';
import { nutritionSummary } from '@/lib/nutrition';
import { level,localDay } from '@/lib/metrics';
import training from '@/assets/training.jpg';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'NIFLHEIM — Lifestyle OS & Evolução Diária' },
      { name: 'description', content: 'Acompanhe sua alimentação, treinos, hábitos e evolução diária.' },
      { property: 'og:title', content: 'NIFLHEIM — Lifestyle OS' },
      { property: 'og:description', content: 'Nutrição, treino e rotina conectados à sua evolução.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: Home,
});

function Home() {
  const { user, data, save, reward } = useLifestyle();
  const today = localDay();
  const n = nutritionSummary(data);
  const xp = data.xp.reduce((s, e) => s + (e.points ?? 0), 0);
  const lvl = level(xp);
  const habits = [...data.habits].sort((a, b) => (a.details['order'] ?? 0) - (b.details['order'] ?? 0));
  const completed = data.completions.filter((e) => e.day === today);
  const workouts = data.workouts.filter((e) => e.day === today && e.details['completed']);
  const date = new Date();
  const dateText = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  async function toggle(id: string) {
    const c = completed.find((e) => e.habit_id === id);
    if (
      await save({
        table: 'habit_completions',
        record: c ? { id: c.id } : { id: crypto.randomUUID(), day: today, habit_id: id },
        remove: !!c,
      })
    ) {
      if (!c) reward(20);
    }
  }

  return (
    <>
      <div className="mb-6 sm:mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
            <Sun size={14} className="text-primary shrink-0" />
            <span className="capitalize truncate">{dateText}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold md:text-4xl text-foreground truncate">
            Vamos evoluir{user && data.profile?.name ? `, ${data.profile.name.split(' ')[0]}` : ''}
            <span className="text-primary">.</span>
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
            Um dia de cada vez. Cada escolha te leva mais longe.
          </p>
        </div>
        <Button asChild className="h-10 rounded-xl px-4 font-bold shadow-sm">
          <Link to="/nutricao">
            <Plus size={16} /> Registrar refeição
          </Link>
        </Button>
      </div>

      <div className="mb-6 sm:mb-7 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[
          {
            icon: Flame,
            title: 'Calorias',
            fullTitle: 'Calorias consumidas',
            value: Math.round(n.values.kcal).toLocaleString('pt-BR'),
            unit: 'kcal',
            sub: `de ${n.goal.toLocaleString('pt-BR')} kcal`,
            color: 'text-primary',
          },
          {
            icon: Dumbbell,
            title: 'Treinos',
            fullTitle: 'Treinos da semana',
            value: data.workouts.filter((w) => w.details['completed'] && new Date(w.day ?? '').getTime() > Date.now() - 7 * 86400000).length,
            unit: 'treinos',
            sub: 'Consistência semanal',
            color: 'text-carbs',
          },
          {
            icon: Footprints,
            title: 'Cardio',
            fullTitle: 'Passos de cardio',
            value: n.steps.toLocaleString('pt-BR'),
            unit: 'passos',
            sub: n.credit ? `+${n.credit} kcal cardio` : 'Movimento diário',
            color: 'text-success',
          },
          {
            icon: Check,
            title: 'Hábitos',
            fullTitle: 'Hábitos concluídos',
            value: `${completed.length}/${habits.length}`,
            unit: 'feitos',
            sub: habits.length ? `${Math.round((completed.length / habits.length) * 100)}% da rotina` : 'Comece hoje',
            color: 'text-primary',
          },
        ].map((s) => (
          <div key={s.title} className="panel p-3.5 sm:p-5 rounded-2xl flex flex-col justify-between min-w-0 overflow-hidden">
            <div className="mb-3 sm:mb-5 flex items-center justify-between text-[11px] text-muted-foreground gap-1">
              <span className="truncate font-semibold">{s.fullTitle}</span>
              <s.icon size={16} className={`${s.color} shrink-0`} />
            </div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <b className="font-display text-2xl sm:text-3xl font-extrabold truncate">{s.value}</b>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground">{s.unit}</span>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground truncate">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.5fr]">
        <section className="panel p-4 sm:p-6 rounded-2xl">
          <SectionHeading
            title="Sua nutrição hoje"
            action={
              <Link to="/nutricao" className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-primary">
                Ver diário <ArrowUpRight size={12} />
              </Link>
            }
          />
          <div className="grid items-center gap-6 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 mt-4">
            <MacroRing kcal={n.values.kcal} goal={n.goal} protein={n.values.protein} carbs={n.values.carbs} fat={n.values.fat} targets={n.targets} />
            <MacroBars values={n.values} targets={n.targets} />
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs">
            <span className="text-muted-foreground">Ainda disponíveis</span>
            <b className="font-mono text-sm">
              {Math.max(0, Math.round(n.goal - n.values.kcal)).toLocaleString('pt-BR')}{' '}
              <span className="text-muted-foreground text-xs font-sans">kcal</span>
            </b>
          </div>
          <Button asChild variant="secondary" className="mt-4 w-full rounded-xl font-bold">
            <Link to="/nutricao">
              <Plus size={14} /> Adicionar alimento
            </Link>
          </Button>
        </section>

        <div>
          <SectionHeading
            title="Hora de ir além"
            action={
              <Link to="/treinos" className="text-[11px] font-bold text-muted-foreground hover:text-primary flex items-center gap-1">
                Meus treinos <ArrowUpRight size={12} />
              </Link>
            }
          />
          <div className="training-cover rounded-2xl mt-4">
            <img src={training} alt="Atleta realizando exercício com halteres" width={1536} height={1024} />
            <div className="p-5 sm:p-6">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-2.5 py-0.5 text-[9px] font-black text-primary">
                <Dumbbell size={12} /> SEU PRÓXIMO TREINO
              </span>
              <h2 className="max-w-60 text-xl sm:text-2xl font-black text-foreground">
                Mais forte que ontem.
              </h2>
              <p className="mt-2 max-w-52 text-xs leading-relaxed text-muted-foreground">
                Foco na execução. Progresso em cada repetição.
              </p>
              <Button asChild className="mt-4 rounded-xl font-bold">
                <Link to="/treinos">
                  <Dumbbell size={14} /> Começar treino <ArrowRight size={14} />
                </Link>
              </Button>
            </div>
          </div>
          <div className="panel mt-4 flex items-center gap-3.5 p-4 rounded-2xl">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Zap size={20} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs">
                <b className="truncate font-bold">
                  Nível {lvl.level} <span className="font-normal text-muted-foreground">· Sua evolução</span>
                </b>
                <span className="text-[10px] font-bold text-primary font-mono shrink-0">
                  {lvl.progress} / 500 XP
                </span>
              </div>
              <progress className="xp-progress mt-2.5 h-1.5 w-full rounded-full" value={lvl.progress} max={500} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-7 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="panel p-4 sm:p-6 rounded-2xl">
          <SectionHeading
            title="Sua rotina, seu ritmo"
            action={
              <Link to="/rotina" className="text-[11px] font-bold text-muted-foreground hover:text-primary flex items-center gap-1">
                Ver rotina <ArrowUpRight size={12} />
              </Link>
            }
          />
          {habits.length ? (
            <div className="mt-3 divide-y divide-border/40">
              {habits.slice(0, 4).map((h) => {
                const isDone = completed.some((c) => c.habit_id === h.id);
                return (
                  <div key={h.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Concluir ${h.details['name']}`}
                      onClick={() => toggle(h.id)}
                      className={`size-6 rounded-lg border transition-all shrink-0 ${
                        isDone ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                      }`}
                    >
                      {isDone && <Check size={13} strokeWidth={3} />}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {h.details['name']}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground truncate">{h.details['category']}</p>
                    </div>
                    <span className="text-[10px] font-bold text-primary shrink-0">+20 XP</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4 py-8">
              <div>
                <Target size={24} className="mb-2 text-primary" />
                <h3 className="text-sm font-bold">O começo de uma boa rotina.</h3>
                <p className="mt-1 text-xs text-muted-foreground">Quais hábitos você quer levar para o seu dia?</p>
              </div>
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/rotina">
                  <Plus size={14} /> Criar hábito
                </Link>
              </Button>
            </div>
          )}
        </section>

        <section className="panel p-4 sm:p-6 rounded-2xl">
          <SectionHeading title="Consistência da semana" />
          <div className="flex h-32 items-end justify-between gap-2 sm:gap-3 border-b border-border px-1 sm:px-2 pt-5">
            {Array.from({ length: 7 }, (_, i) => {
              const day = new Date();
              day.setDate(day.getDate() - 6 + i);
              const count = data.xp.filter((e) => e.day === localDay(day)).reduce((s, e) => s + (e.points ?? 0), 0);
              return (
                <div className="flex h-full flex-1 flex-col justify-end" key={i}>
                  <svg className="h-full w-full" viewBox="0 0 40 100" preserveAspectRatio="none">
                    <rect
                      x="6"
                      y={100 - Math.max(3, Math.min(100, count / 2))}
                      width="28"
                      height={Math.max(3, Math.min(100, count / 2))}
                      rx="4"
                      fill="currentColor"
                      className={count ? 'text-primary' : 'text-muted/60'}
                    />
                  </svg>
                  <span className="py-2 text-center text-[9px] font-bold text-muted-foreground uppercase">
                    {day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Flame size={14} className="text-primary shrink-0" />
            <span>A evolução está nos dias em que você aparece.</span>
          </p>
        </section>
      </div>

      <footer className="mt-8 flex items-center justify-between text-[10px] text-muted-foreground pb-4">
        <span>NIFLHEIM · Lifestyle OS</span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-success" />
          {user ? 'Seus dados conectados' : 'Seu espaço começa aqui'}
        </span>
      </footer>
    </>
  );
}