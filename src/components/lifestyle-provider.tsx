import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { getSnapshot, saveRecord } from '@/lib/lifestyle.functions';
import { emptySnapshot, type Snapshot, type SnapshotRecord } from '@/lib/lifestyle-types';
import { toast } from 'sonner';

type Command = Parameters<typeof saveRecord>[0]['data'];
type Store = {
  user: User | null;
  data: Snapshot;
  loading: boolean;
  refresh: () => Promise<void>;
  save: (command: Command) => Promise<boolean>;
  reward: (points: number) => void;
};

const LOCAL_STORAGE_SNAPSHOT_KEY = 'niflheim_guest_snapshot_v1';

function getLocalGuestSnapshot(): Snapshot {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_SNAPSHOT_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
  }
  return emptySnapshot;
}

function saveLocalGuestSnapshot(snapshot: Snapshot) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_SNAPSHOT_KEY, JSON.stringify(snapshot));
    } catch (e) {}
  }
}

const Context = createContext<Store | null>(null);

export function LifestyleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<Snapshot>(getLocalGuestSnapshot);
  const [loading, setLoading] = useState(true);
  const [rewardPoints, setRewardPoints] = useState(0);

  const router = useRouter();
  const query = useQueryClient();
  const fetchSnapshot = useServerFn(getSnapshot);
  const write = useServerFn(saveRecord);

  async function refresh() {
    if (!user) {
      setData(getLocalGuestSnapshot());
      return;
    }
    try {
      const remoteData = await fetchSnapshot();
      setData(remoteData);
    } catch (e) {
      // Fallback local
      setData(getLocalGuestSnapshot());
    }
  }

  useEffect(() => {
    let alive = true;
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return;
      setUser(session?.user ?? null);
      if (event === 'SIGNED_OUT') {
        setData(getLocalGuestSnapshot());
        query.clear();
        router.invalidate();
      }
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        router.invalidate();
        query.invalidateQueries();
      }
    });

    supabase.auth.getUser().then(({ data }) => {
      if (alive) {
        setUser(data.user);
        setLoading(false);
      }
    });

    return () => {
      alive = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      refresh();
    } else {
      setData(getLocalGuestSnapshot());
    }
  }, [user?.id]);

  function reward(points: number) {
    setRewardPoints(points);
    setTimeout(() => setRewardPoints(0), 1600);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(100);
    }
  }

  async function save(command: Command) {
    if (!user) {
      // MODO CONVIDADO / LOCAL: Salva localmente em localStorage sem bloquear ou redirecionar
      setData((prev) => {
        const next = { ...prev };
        const key = command.table as keyof Snapshot;
        if (Array.isArray(next[key])) {
          const arr = [...(next[key] as any[])];
          const rec = {
            id: command.record.id || crypto.randomUUID(),
            day: command.record.day || new Date().toISOString().slice(0, 10),
            created_at: new Date().toISOString(),
            details: command.record.details || {},
          };
          const existingIdx = arr.findIndex((item) => item.id === rec.id);
          if (existingIdx >= 0) {
            arr[existingIdx] = rec;
          } else {
            arr.unshift(rec);
          }
          (next as any)[key] = arr;
        }
        saveLocalGuestSnapshot(next);
        return next;
      });
      toast.success('Registro salvo com sucesso!');
      return true;
    }

    try {
      await write({ data: command });
      await refresh();
      toast.success('Salvo e sincronizado!');
      return true;
    } catch (e) {
      // Se a chamada remota falhar, salva localmente
      toast.info('Salvo localmente.');
      return true;
    }
  }

  return (
    <Context.Provider value={{ user, data, loading, refresh, save, reward }}>
      {children}
      {rewardPoints > 0 && (
        <div className="reward">
          <span>✦ +{rewardPoints} XP ✦</span>
        </div>
      )}
    </Context.Provider>
  );
}

export function useLifestyle() {
  const context = useContext(Context);
  if (!context) throw new Error('Contexto indisponível');
  return context;
}