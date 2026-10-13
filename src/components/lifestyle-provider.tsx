import { createContext,useContext,useEffect,useState,type ReactNode } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { getSnapshot,saveRecord } from '@/lib/lifestyle.functions';
import { emptySnapshot,type Snapshot } from '@/lib/lifestyle-types';
import { toast } from 'sonner';

type Command=Parameters<typeof saveRecord>[0]['data'];
type Store={user:User|null;data:Snapshot;loading:boolean;refresh:()=>Promise<void>;save:(command:Command)=>Promise<boolean>;reward:(points:number)=>void};
const Context=createContext<Store|null>(null);
export function LifestyleProvider({children}:{children:ReactNode}){
  const [user,setUser]=useState<User|null>(null),[data,setData]=useState(emptySnapshot),[loading,setLoading]=useState(true),[rewardPoints,setRewardPoints]=useState(0);
  const router=useRouter(), query=useQueryClient(),fetchSnapshot=useServerFn(getSnapshot),write=useServerFn(saveRecord);
  async function refresh(){try{setData(await fetchSnapshot());}catch(e){toast.error(e instanceof Error?e.message:'Falha ao carregar dados');}}
  useEffect(()=>{
    let alive=true;
    const {data:subscription}=supabase.auth.onAuthStateChange((event,session)=>{
      if(!alive)return;
      setUser(session?.user??null);
      if(event==='SIGNED_OUT'){setData(emptySnapshot);query.clear();router.invalidate();}
      if(event==='SIGNED_IN'||event==='USER_UPDATED'){router.invalidate();query.invalidateQueries();}
    });
    supabase.auth.getUser().then(({data})=>{if(alive){setUser(data.user);setLoading(false);}});
    return()=>{alive=false;subscription.subscription.unsubscribe();};
  },[]);
  useEffect(()=>{if(user){refresh();}else setData(emptySnapshot);},[user?.id]);
  function reward(points:number){setRewardPoints(points);setTimeout(()=>setRewardPoints(0),1600);if(navigator.vibrate)navigator.vibrate(100);}
  async function save(command:Command){if(!user){toast('Entre na sua conta para salvar seus registros.');router.navigate({to:'/auth'});return false;}try{await write({data:command});await refresh();return true;}catch(e){toast.error(e instanceof Error?e.message:'Não foi possível salvar');return false;}}
  return <Context.Provider value={{user,data,loading,refresh,save,reward}}>{children}{rewardPoints>0&&<div className="reward"><span>✦ +{rewardPoints} XP ✦</span></div>}</Context.Provider>;
}
export function useLifestyle(){const context=useContext(Context);if(!context)throw new Error('Contexto indisponível');return context;}