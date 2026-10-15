import { Link,useLocation } from '@tanstack/react-router';
import { LayoutDashboard,Utensils,Dumbbell,CheckSquare,NotebookPen,UserRound,Zap,Flame,Bell,ChevronRight,LogIn } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLifestyle } from './lifestyle-provider';
import { level,streak } from '@/lib/metrics';
import { Button } from './ui/button';
const nav=[{to:'/' as const,label:'Início',icon:LayoutDashboard},{to:'/nutricao' as const,label:'Nutrição',icon:Utensils},{to:'/treinos' as const,label:'Treinos',icon:Dumbbell},{to:'/rotina' as const,label:'Rotina',icon:CheckSquare},{to:'/notas' as const,label:'Notas',icon:NotebookPen},{to:'/perfil' as const,label:'Perfil',icon:UserRound}];
export function AppShell({children}:{children:ReactNode}){
  const {user,data}=useLifestyle(),location=useLocation();
  if(location.pathname==='/auth'||location.pathname==='/reset-password')return children;
  const xp=data.xp.reduce((s,e)=>s+(e.points??0),0),lvl=level(xp),days=streak(data.xp.map(e=>e.day??''));
  return (
    <div>
      <aside className="app-sidebar flex flex-col">
        <Link to="/" className="sidebar-brand flex items-center gap-2 px-7 py-9">
          <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <Zap size={23} fill="currentColor" />
          </span>
          <span className="font-display text-2xl font-extrabold">
            NIFLHEIM<span className="text-primary">.</span>
          </span>
        </Link>
        <div className="sidebar-extra px-7 pb-4 text-[9px] font-semibold uppercase text-muted-foreground">
          Lifestyle OS
        </div>
        <nav className="sidebar-nav flex flex-col gap-1 px-4">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-item ${location.pathname === item.to ? 'active' : ''}`}
            >
              <item.icon size={19} />
              <span className="sidebar-label">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-extra mt-auto px-5 pb-5">
          <div className="mb-6 rounded-md border border-border p-4">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Zap size={16} className="text-primary" />
              Cada dia conta.
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Pequenos passos.<br />Uma versão melhor de você.
            </p>
          </div>
          <Link
            to={user ? '/perfil' : '/auth'}
            className="flex items-center gap-3 border-t border-border pt-5"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-sm font-bold">
              {user ? (data.profile?.name?.slice(0, 1) || 'N') : <UserRound size={17} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold">
                {user ? (data.profile?.name || 'Minha conta') : 'Visitante'}
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                {user ? `Nível ${lvl.level} · Em evolução` : 'Entrar na minha conta'}
              </div>
            </div>
            <ChevronRight size={14} className="text-muted-foreground" />
          </Link>
        </div>
      </aside>

      <div className="app-main">
        <header className="sticky top-0 z-30 flex h-14 sm:h-16 md:h-20 items-center justify-between border-b border-border/80 bg-background/90 px-4 sm:px-6 md:px-9 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/" className="flex items-center gap-1.5 font-display text-sm font-black text-foreground sm:hidden">
              <span className="grid size-6 place-items-center rounded bg-primary text-primary-foreground">
                <Zap size={14} fill="currentColor" />
              </span>
              <span>NIFLHEIM</span>
            </Link>
            <span className="hidden sm:inline">Meu espaço</span>
            <ChevronRight size={12} className="hidden sm:inline" />
            <span className="hidden sm:inline text-foreground font-semibold">
              {nav.find((n) => n.to === location.pathname)?.label ?? 'NIFLHEIM'}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <span className="flex items-center gap-1 text-xs font-extrabold text-primary bg-primary/10 px-2 py-1 rounded-full border border-primary/20">
              <Flame size={15} />
              <span>{days}</span>
              <span className="hidden sm:inline text-muted-foreground font-normal">dias</span>
            </span>
            <span className="h-4 border-r border-border" />
            <Link to="/perfil" aria-label="Notificações" className="text-muted-foreground hover:text-foreground p-1">
              <Bell size={17} />
            </Link>
            <Link
              to={user ? '/perfil' : '/auth'}
              className="grid size-7 sm:size-8 place-items-center rounded-full border border-border text-xs font-bold bg-secondary hover:border-primary transition-colors"
            >
              {user ? (data.profile?.name?.slice(0, 1) || 'N') : <LogIn size={14} />}
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-[1450px] p-3.5 sm:p-5 md:p-9">{children}</main>
      </div>
    </div>
  );
}