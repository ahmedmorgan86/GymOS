'use client';
import {Children,useId,useState,type ReactNode} from 'react';
/** Keep panels mounted so switching tasks preserves unfinished forms and media state. */
export default function TaskPanels({labels,children,value,onChange,ar}:{labels:string[];children:ReactNode;value?:number;onChange?:(index:number)=>void;ar:boolean}){
 const [local,setLocal]=useState(0),id=useId(),panels=Children.toArray(children),active=Math.min(value??local,Math.max(0,panels.length-1));
 return <div className="task-panels"><nav className="task-choices" aria-label={ar?'اختر المهمة':'Choose a task'}>{labels.map((label,index)=><button type="button" key={label} aria-expanded={active===index} aria-controls={id+'-'+index} className={active===index?'selected':''} onClick={()=>{setLocal(index);onChange?.(index);}}>{label}</button>)}</nav>{panels.map((panel,index)=><section className="task-panel" id={id+'-'+index} aria-label={labels[index]} hidden={active!==index} key={index}>{panel}</section>)}</div>;
}
