import type { Snapshot } from './lifestyle-types';
import { localDay } from './metrics';
export function nutritionSummary(data:Snapshot,day=localDay()){
 const entries=data.nutrition.filter(e=>e.day===day),cardio=data.cardio.filter(e=>e.day===day);
 const values=entries.reduce((s,e)=>({kcal:s.kcal+Number(e.details['kcal']??0),protein:s.protein+Number(e.details['protein']??0),carbs:s.carbs+Number(e.details['carbs']??0),fat:s.fat+Number(e.details['fat']??0)}),{kcal:0,protein:0,carbs:0,fat:0});
 const credit=cardio.reduce((s,e)=>s+Number(e.details['calories']??0),0);
 return {entries,values,credit,goal:(data.profile?.calorie_target??2400)+credit,targets:{protein:data.profile?.protein_target??160,carbs:data.profile?.carb_target??280,fat:data.profile?.fat_target??71},steps:cardio.reduce((s,e)=>s+Number(e.details['steps']??0),0)};
}