import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/adm')({
  head: () => ({
    meta: [
      { title: 'NIFLHEIM — Painel Administrativo Coach ADM' },
    ],
  }),
  component: AdmRouteComponent,
});

function AdmRouteComponent() {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('niflheim_admin_unlocked_v1', 'true');
    }
    navigate({ to: '/treinos', search: { mode: 'admin' } as any });
  }, [navigate]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4">
      <div className="text-center space-y-3">
        <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
        <h2 className="text-base font-black text-foreground">Abrindo Painel Administrativo...</h2>
        <p className="text-xs text-muted-foreground">Redirecionando para o Coach Studio.</p>
      </div>
    </div>
  );
}
