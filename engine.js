import {MISSIONS} from './content.js';
export const STORAGE_KEY='project-agency-7-v1';
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function initialState(){return {version:1,team:'',startedAt:null,completedAt:null,solved:{},answers:{},attempts:{},hints:{},notes:{},completed:[]};}
const tasks=new Map(MISSIONS.flatMap(m=>m.tasks.map(t=>[t.id,t])));
export function hydrate(value){
  if(!value || value.version!==1)return initialState();
  const state=initialState();
  state.team=typeof value.team==='string'?value.team.slice(0,60):'';
  state.startedAt=typeof value.startedAt==='string'?value.startedAt:null;
  state.completedAt=typeof value.completedAt==='string'?value.completedAt:null;
  for(const key of ['answers','attempts','hints']){
    if(value[key] && typeof value[key]==='object' && !Array.isArray(value[key]))
      for(const id of tasks.keys())if(Object.hasOwn(value[key],id))state[key][id]=value[key][id];
  }
  if(value.notes && typeof value.notes==='object')
    for(const m of MISSIONS)for(const f of m.fields)if(typeof value.notes[f.id]==='string')state.notes[f.id]=value.notes[f.id].slice(0,f.max);
  // Restore a solved flag only if its saved answer really passes the task.
  for(const [id,t] of tasks)if(value.solved?.[id] && isCorrect(t,state.answers[id]))state.solved[id]=true;
  for(const m of MISSIONS){
    // Editing a saved draft later does not remove an already earned mission badge.
    if(Array.isArray(value.completed) && value.completed.includes(m.id) && isUnlocked(state,m.id) && m.tasks.every(t=>state.solved[t.id]))state.completed.push(m.id);
    else break;
  }
  if(state.completed.length<8)state.completedAt=null;
  return state;
}
export function isCorrect(task,answer){
  if(task.type==='single')return typeof answer==='string' && answer===task.correct;
  if(task.type==='multi')return Array.isArray(answer) && answer.length===task.correct.length && new Set(answer).size===answer.length && task.correct.every(x=>answer.includes(x));
  if(task.type==='order')return Array.isArray(answer) && answer.length===task.correct.length && task.correct.every((x,i)=>answer[i]===x);
  if(task.type==='match')return answer && typeof answer==='object' && !Array.isArray(answer) && task.rows.every(row=>answer[row.id]===task.correct[row.id]);
  return false;
}
export function hasAnswer(task,answer){
  if(task.type==='single')return task.options.some(x=>x.id===answer);
  if(task.type==='multi')return Array.isArray(answer) && answer.length>0;
  if(task.type==='order')return Array.isArray(answer) && answer.length===task.items.length;
  if(task.type==='match')return !!answer && task.rows.every(row=>task.choices.some(c=>c.id===answer[row.id]));
  return false;
}
export function isUnlocked(state,missionId){return missionId===1 || state.completed.includes(missionId-1);}
export function canComplete(state,missionId){
  const m=MISSIONS.find(m=>m.id===missionId);
  return !!m && isUnlocked(state,missionId) && m.tasks.every(t=>state.solved[t.id] && isCorrect(t,state.answers[t.id])) && m.fields.every(f=>typeof state.notes[f.id]==='string' && state.notes[f.id].trim().length>=f.min);
}
export function markAnswer(state,task,answer){
  if(!hasAnswer(task,answer))return {accepted:false,correct:false,newlySolved:false};
  state.answers[task.id]=structuredClone(answer);
  state.attempts[task.id]=(Number(state.attempts[task.id])||0)+1;
  const correct=isCorrect(task,answer);
  const newlySolved=correct && !state.solved[task.id];
  if(correct)state.solved[task.id]=true;
  else delete state.solved[task.id];
  return {accepted:true,correct,newlySolved};
}
export function completeMission(state,id){
  if(!canComplete(state,id))return false;
  if(!state.completed.includes(id))state.completed.push(id);
  if(state.completed.length===8 && !state.completedAt)state.completedAt=new Date().toISOString();
  return true;
}
export function xp(state){return [...tasks.keys()].filter(id=>state.solved[id] && isCorrect(tasks.get(id),state.answers[id])).length*10;}
export function nextMission(state){return MISSIONS.find(m=>!state.completed.includes(m.id))?.id ?? 8;}
export function nextTask(state,id){const m=MISSIONS[id-1];const idx=m.tasks.findIndex(t=>!state.solved[t.id]);return idx<0?3:idx;}
export function fieldOwner(fieldId){return MISSIONS.find(m=>m.fields.some(f=>f.id===fieldId));}
