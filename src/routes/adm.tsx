import { createFileRoute } from '@tanstack/react-router';
import { TreinosPage } from './treinos';
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
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('niflheim_admin_unlocked_v1', 'true');
      } catch {}
    }
  }, []);

  return <TreinosPage defaultMode="MONTAR" forceAdmin={true} />;
}
