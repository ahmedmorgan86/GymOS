"use client";
import{createContext,useContext,type ReactNode}from'react';
const DeviceScope=createContext<string|null>(null);
export function DeviceScopeProvider({scope,children}:{scope:string;children:ReactNode}){return <DeviceScope.Provider value={scope}>{children}</DeviceScope.Provider>;}
export function useDeviceScope(){return useContext(DeviceScope);}
