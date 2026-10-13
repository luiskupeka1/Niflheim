import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
export const catalogOptions = queryOptions({ queryKey:['catalog'], queryFn:async()=>{
  const [foods,exercises]=await Promise.all([supabase.from('foods').select('*').order('name'),supabase.from('exercises').select('*').order('name')]);
  if(foods.error||exercises.error)throw new Error('Não foi possível carregar o catálogo.');
  return {foods:foods.data,exercises:exercises.data};
} });