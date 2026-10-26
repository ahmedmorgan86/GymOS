"use client";
import{useCallback,useEffect,useRef,useState}from'react';
import{CameraConnection}from'./lib/camera-connection';
import{readDevicePreferences,videoConstraints}from'./lib/device-preferences';
export default function useManagedCamera(scope:string|null,purpose:'photo'|'attendance',defaults:MediaTrackConstraints){
 const[stream,setStream]=useState<MediaStream|null>(null),[opening,setOpening]=useState(false),[error,setError]=useState('');const connection=useRef<CameraConnection<MediaStream>|null>(null),constraints=useRef(defaults);
 useEffect(()=>{const session=new CameraConnection<MediaStream>({open:pinned=>{if(!navigator.mediaDevices?.getUserMedia)return Promise.reject(Error('cameraUnavailable'));const selected=videoConstraints(readDevicePreferences(scope),purpose,constraints.current);return navigator.mediaDevices.getUserMedia({video:pinned?{...selected,deviceId:{exact:pinned}}:selected,audio:false});},devices:()=>navigator.mediaDevices?.enumerateDevices()??Promise.resolve([]),initialId:()=>{const p=readDevicePreferences(scope);return purpose==='photo'?p.photoCamera:p.attendanceCamera;},retry:()=>readDevicePreferences(scope).autoReconnect,visible:()=>document.visibilityState==='visible',change:(next,reason)=>{setStream(next);setOpening(reason==='opening');setError(reason==='disconnected'?'disconnected':'');},error:reason=>{setOpening(false);setError(reason);}});connection.current=session;const reconnect=()=>void session.reconnect();navigator.mediaDevices?.addEventListener?.('devicechange',reconnect);document.addEventListener('visibilitychange',reconnect);const timer=setInterval(reconnect,5000);return()=>{session.dispose();if(connection.current===session)connection.current=null;clearInterval(timer);navigator.mediaDevices?.removeEventListener?.('devicechange',reconnect);document.removeEventListener('visibilitychange',reconnect);};},[scope,purpose]);
 const start=useCallback(()=>{const session=connection.current;if(!session)return;setError('');void session.start();},[]);
 const stop=useCallback(()=>connection.current?.stop(),[]);
 const isCurrent=useCallback((value:MediaStream)=>connection.current?.isCurrent(value)??false,[]);
 return{stream,opening,error,active:Boolean(stream),start,stop,isCurrent};
}
