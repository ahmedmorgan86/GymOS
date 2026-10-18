"use client";
import {useCallback,useSyncExternalStore} from 'react';
function subscribe(callback:()=>void){window.addEventListener('storage',callback);window.addEventListener('gymos-preference',callback);return()=>{window.removeEventListener('storage',callback);window.removeEventListener('gymos-preference',callback);};}
export function usePreference<T extends string>(key:string,initial:T){const value=useSyncExternalStore(subscribe,()=>{try{return localStorage.getItem(key) as T??initial;}catch{return initial;}},()=>initial);const set=useCallback((next:T)=>{localStorage.setItem(key,next);window.dispatchEvent(new Event('gymos-preference'));},[key]);return[value,set] as const;}
export function useBooleanPreference(key:string){const [value,set]=usePreference<'yes'|'no'>(key,'no');return[value==='yes',(next:boolean)=>set(next?'yes':'no')] as const;}
function subscribeNetwork(callback:()=>void){window.addEventListener('online',callback);window.addEventListener('offline',callback);return()=>{window.removeEventListener('online',callback);window.removeEventListener('offline',callback);};}
export function useNetworkStatus(){return useSyncExternalStore(subscribeNetwork,()=>navigator.onLine,()=>true);}
