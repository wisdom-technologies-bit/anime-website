"use client";
import {useEffect,useState} from "react";
export type LocalPrefs={autoSkip:boolean;autoNext:boolean;dubEpisodes:boolean;subtitle_language:string};
const defaults:LocalPrefs={autoSkip:false,autoNext:true,dubEpisodes:false,subtitle_language:"English"};
function get(key:keyof LocalPrefs){try{const v=localStorage.getItem(key);if(v===null)return defaults[key];return key==="subtitle_language"?v:v==="true"}catch{return defaults[key]}}
export function readPrefs():LocalPrefs{return typeof window==='undefined'?defaults:{autoSkip:get("autoSkip") as boolean,autoNext:get("autoNext") as boolean,dubEpisodes:get("dubEpisodes") as boolean,subtitle_language:get("subtitle_language") as string}}
export function useLocalPrefs(){const [prefs,setPrefs]=useState<LocalPrefs>(defaults);useEffect(()=>{setPrefs(readPrefs());const fn=()=>setPrefs(readPrefs());window.addEventListener("storage",fn);return()=>window.removeEventListener("storage",fn)},[]);return prefs}
export function setLocalPref<K extends keyof LocalPrefs>(key:K,value:LocalPrefs[K]){try{localStorage.setItem(key,String(value));window.dispatchEvent(new Event("storage"))}catch{}}
