import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import { calculateCardioMetrics, metabolism } from './metrics';
import type { Snapshot } from './lifestyle-types';

export const getSnapshot = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const db = context.supabase;
  const queries = await Promise.all([
    db.from('profiles').select('*').eq('id', context.userId).maybeSingle(),
    ...(['daily_nutrition', 'cardio_logs', 'workouts', 'workout_sets', 'fatigue_logs', 'habits', 'habit_completions', 'notes_pages', 'notes_blocks', 'xp_events'] as const).map(t => db.from(t).select('*').eq('user_id', context.userId)),
  ]);
  const failed = queries.find(q => q.error);
  if (failed?.error) throw new Error('Não foi possível carregar seus registros.');
  return { profile: queries[0].data, nutrition: queries[1].data, cardio: queries[2].data, workouts: queries[3].data, sets: queries[4].data, fatigue: queries[5].data, habits: queries[6].data, completions: queries[7].data, pages: queries[8].data, blocks: queries[9].data, xp: queries[10].data } as unknown as Snapshot;
});

const profileSchema = z.object({ name: z.string().min(1).max(100), phone: z.string().max(30), age: z.number().int().min(13).max(100), sex: z.enum(['male','female']), height: z.number().min(100).max(250), weight: z.number().min(25).max(350), body_fat: z.number().min(1).max(70).nullable(), goal: z.enum(['cutting','bulking','maintenance']), activity: z.union([z.literal(1.2),z.literal(1.375),z.literal(1.55),z.literal(1.725),z.literal(1.9)]) });
export const saveProfile = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(profileSchema).handler(async ({ data, context }) => {
  const targets = metabolism(data);
  const { error } = await context.supabase.from('profiles').update({ ...data, onboarded: true, calorie_target: targets.calories, protein_target: targets.protein, carb_target: targets.carbs, fat_target: targets.fat }).eq('id', context.userId);
  if (error) throw new Error('Não foi possível salvar o perfil.');
  return targets;
});
const tables = ['daily_nutrition','cardio_logs','workouts','workout_sets','fatigue_logs','habits','habit_completions','notes_pages','notes_blocks','foods','exercises'] as const;
const commandSchema = z.object({ table: z.enum(tables), remove: z.boolean().optional(), record: z.object({ id: z.string().uuid(), day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), meal: z.string().optional(), food_id: z.string().uuid().optional(), workout_id: z.string().uuid().optional(), exercise_id: z.string().uuid().optional(), habit_id: z.string().uuid().optional(), page_id: z.string().uuid().optional(), parent_id: z.string().uuid().nullable().optional(), details: z.record(z.string(),z.any()).optional() }) });
export const saveRecord = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(commandSchema).handler(async ({ data, context }) => {
  const db = context.supabase;
  if (data.remove) {
    const { error } = await db.from(data.table).delete().eq('id', data.record.id).eq('user_id', context.userId);
    if (error) throw new Error('Não foi possível remover o registro.');
    return { ok: true };
  }
  const r = data.record;
  const details = r.details ?? {};
  const row: Record<string, unknown> = { id: r.id, user_id: context.userId };
  const n = (key: string, min: number, max: number) => z.number().min(min).max(max).parse(details[key]);
  if (data.table === 'daily_nutrition') {
    const meal = z.enum(['Café da Manhã','Almoço','Jantar','Pré-Treino','Pós-Treino']).parse(r.meal);
    const { data: food, error } = await db.from('foods').select('*').eq('id', r.food_id ?? '').single();
    if (error || !food) throw new Error('Alimento não encontrado');
    const grams = n('grams', 1, 10000);
    Object.assign(row, { day: r.day, meal, food_id: food.id, details: { name: food.name, grams, kcal: food.kcal*grams/100, protein: food.protein*grams/100, carbs: food.carbs*grams/100, fat: food.fat*grams/100, fiber: food.fiber*grams/100 } });
  } else if (data.table === 'cardio_logs') {
    const { data: profile } = await db.from('profiles').select('weight').eq('id',context.userId).single();
    if (!profile?.weight) throw new Error('Preencha seu peso no perfil primeiro.');
    const minutes=n('minutes',1,1440), intensity=z.enum(['low','moderate','high']).parse(details['intensity']);
    Object.assign(row,{ day:r.day,details:{minutes,intensity,...calculateCardioMetrics(minutes,intensity,profile.weight)} });
  } else if (data.table === 'workout_sets') {
    Object.assign(row,{ workout_id:r.workout_id,exercise_id:r.exercise_id,details:{weight:n('weight',0,1000),reps:n('reps',1,200),rir:n('rir',0,5),type:z.enum(['Aquecimento','Preparatória','Trabalho','Falha','Drop-set']).parse(details['type']),completed:z.boolean().parse(details['completed'])} });
  } else if (data.table === 'workouts') {
    const completed=z.boolean().parse(details['completed']);
    let volume=0;
    if(completed){n('pse',1,10);n('duration',1,1440);const {data:sets}=await db.from('workout_sets').select('details').eq('workout_id',r.id);volume=(sets??[]).reduce((s,x)=>{const d=x.details as Record<string,any>;return s+(d['completed']?d['weight']*d['reps']:0)},0);}
    Object.assign(row,{day:r.day,details:{name:z.string().min(1).max(100).parse(details['name']),completed,pse:details['pse']??null,duration:details['duration']??null,volume} });
  } else if (data.table === 'fatigue_logs') {
    Object.assign(row,{day:r.day,details:{sleep:n('sleep',1,5),doms:n('doms',1,5),fatigue:n('fatigue',1,5)} });
    const {data:existing}=await db.from('fatigue_logs').select('id').eq('user_id',context.userId).eq('day',r.day ?? '').maybeSingle();
    if(existing) row['id']=existing.id;
  } else if (data.table === 'habit_completions') {
    Object.assign(row,{day:r.day,habit_id:r.habit_id});
  } else if (data.table === 'habits') {
    Object.assign(row,{details:{name:z.string().min(1).max(150).parse(details['name']),order:n('order',0,100000),category:z.string().max(50).parse(details['category']??'Pessoal')} });
  } else if (data.table === 'notes_pages') {
    Object.assign(row,{parent_id:r.parent_id??null,details:{title:z.string().min(1).max(150).parse(details['title'])} });
  } else if (data.table === 'notes_blocks') {
    Object.assign(row,{page_id:r.page_id,details:{type:z.enum(['text','h1','h2','h3','check','image','audio','drawing']).parse(details['type']),content:z.string().max(300000).parse(details['content']??''),checked:z.boolean().parse(details['checked']??false),order:n('order',0,100000)} });
  } else if (data.table === 'foods') {
    Object.assign(row,{name:z.string().min(1).max(100).parse(details['name']),portion:'100 g',kcal:n('kcal',0,1000),protein:n('protein',0,100),carbs:n('carbs',0,100),fat:n('fat',0,100),fiber:n('fiber',0,100),verified:false});
  } else if(data.table==='exercises') {
    Object.assign(row,{name:z.string().min(1).max(100).parse(details['name']),muscle:z.string().min(1).parse(details['muscle']),equipment:z.string().min(1).parse(details['equipment']),description:z.string().max(1000).parse(details['description']??''),video_url:details['video_url']?z.string().url().parse(details['video_url']):null});
  }
  const { error } = await db.from(data.table).upsert(row as never);
  if (error) throw new Error('Não foi possível salvar este registro. Tente novamente.');
  return { ok: true };
});

export const saveTargets = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({protein:z.number().min(0).max(500),carbs:z.number().min(0).max(1000),fat:z.number().min(0).max(300)})).handler(async({data,context})=>{
  const {error}=await context.supabase.from('profiles').update({protein_target:data.protein,carb_target:data.carbs,fat_target:data.fat,calorie_target:data.protein*4+data.carbs*4+data.fat*9}).eq('id',context.userId);
  if(error)throw new Error('Não foi possível salvar suas metas.'); return {ok:true};
});