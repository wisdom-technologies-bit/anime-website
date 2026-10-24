"use client";
export type ProgressRecord={episode:number;time:number;duration:number;audio:"sub"|"dub";updatedAt:number;title?:string;cover?:string;watched:number[]};
const KEY="kumori_progress_v1"; const eventName="kumori-progress-change";
function read():Record<string,ProgressRecord>{try{return JSON.parse(window.localStorage.getItem(KEY)||"{}")}catch{return {}}}
function write(v:Record<string,ProgressRecord>){try{const entries=Object.entries(v).sort((a,b)=>b[1].updatedAt-a[1].updatedAt).slice(0,100);window.localStorage.setItem(KEY,JSON.stringify(Object.fromEntries(entries)));window.dispatchEvent(new Event(eventName))}catch{}}
export function getProgress(id:number|string){if(typeof window==='undefined')return null;return read()[String(id)]||null}
export function saveProgress(id:number|string,patch:Partial<ProgressRecord>){if(typeof window==='undefined')return;const all=read(), old=all[String(id)]||{episode:1,time:0,duration:0,audio:"sub",updatedAt:Date.now(),watched:[]};all[String(id)]={...old,...patch,updatedAt:Date.now(),watched:old.watched||[]};write(all)}
export function markWatched(id:number|string,ep:number,value=true){const old=getProgress(id)||{episode:ep,time:0,duration:0,audio:"sub" as const,updatedAt:Date.now(),watched:[]};const watched=new Set(old.watched||[]);value?watched.add(ep):watched.delete(ep);saveProgress(id,{episode:ep,watched:[...watched].sort((a,b)=>a-b)})}
export function isWatched(id:number|string,ep:number){return !!getProgress(id)?.watched?.includes(ep)}
export function listContinueWatching(limit=20){return Object.entries(read()).filter(([,v])=>v.time>=5&&(!v.duration||v.time<v.duration-10)).sort((a,b)=>b[1].updatedAt-a[1].updatedAt).slice(0,limit).map(([id,progress])=>({id:Number(id),progress}))}
export function subscribe(callback:()=>void){if(typeof window==='undefined')return()=>{};const fn=()=>callback();window.addEventListener("storage",fn);window.addEventListener(eventName,fn);return()=>{window.removeEventListener("storage",fn);window.removeEventListener(eventName,fn)}}
export function shouldResume(time:number,duration:number){return time>=5&&(!duration||time<duration-10)}
