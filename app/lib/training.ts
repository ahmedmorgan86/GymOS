import {z} from 'zod';
import {RuleError,type GymState,type Operation} from './domain.ts';
export function trainingText(value:string,ar:boolean){if(!/[\u0600-\u06FF]/.test(value))return value;const split=value.search(/\s\/\s(?=[A-Za-z])/);return split<0?value:ar?value.slice(0,split):value.slice(split+3);}
export const categories=['strength','cardio','hybrid','hypertrophy','full-body','ppl','upper-lower','functional','circuit','hiit','mobility','bodyweight','general-fitness','custom'] as const;
export const categoryNames:Record<typeof categories[number],[string,string]>={strength:['حديد وقوة','Weights & strength'],cardio:['كارديو','Cardio'],hybrid:['حديد + كارديو','Weights + cardio'],hypertrophy:['تضخيم عضلي','Hypertrophy'],'full-body':['جسم كامل','Full body'],ppl:['دفع / سحب / أرجل','Push / pull / legs'],'upper-lower':['علوي / سفلي','Upper / lower'],functional:['تدريب وظيفي','Functional'],circuit:['تدريب دائري','Circuit'],hiit:['كارديو متقطع HIIT','HIIT'],mobility:['مرونة وحركة','Mobility'],bodyweight:['وزن الجسم','Bodyweight'],'general-fitness':['لياقة عامة','General fitness'],custom:['برنامج مخصص','Custom']};
export const exerciseSchema=z.object({name:z.string().trim().min(1).max(150),weight:z.number().min(0).max(1000).nullable(),sets:z.number().int().min(1).max(20).nullable(),reps:z.string().trim().max(80),minutes:z.number().min(0.5).max(180).nullable(),rest:z.number().int().min(0).max(600).nullable(),notes:z.string().trim().max(500)}).strict();
export const daySchema=z.object({name:z.string().trim().min(1).max(100),rest:z.boolean(),exercises:z.array(exerciseSchema).max(20)}).strict().refine(d=>d.rest?d.exercises.length===0:d.exercises.length>0);
export const programSchema=z.object({id:z.string().min(1).max(250),name:z.string().trim().min(1).max(150),category:z.enum(categories),level:z.enum(['all','beginner','intermediate','advanced']),notes:z.string().trim().max(1000),days:z.array(daySchema).min(1).max(7),branch:z.string().min(1).max(250),archived:z.boolean(),source:z.string().max(100).optional()}).strict().refine(p=>p.days.some(d=>!d.rest));
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>Number.isFinite(Date.parse(v))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v);
export const assignmentSchema=z.object({id:z.string(),member:z.string(),program:z.string(),start:date,end:date.nullable(),notes:z.string().max(1000),active:z.boolean(),branch:z.string()}).strict().refine(a=>!a.end||a.end>=a.start);
export const loggedSetSchema=z.object({exercise:z.number().int().min(0).max(19),set:z.number().int().min(1).max(20),weight:z.number().min(0).max(1000),reps:z.number().int().min(1).max(200),rir:z.number().int().min(0).max(10).nullable()}).strict();
export type LoggedSet=z.infer<typeof loggedSetSchema>;
export const sessionSchema=z.object({id:z.string(),assignment:z.string(),day:z.number().int().min(0).max(6),date,note:z.string().max(500),sets:z.array(loggedSetSchema).min(1).max(400).optional(),branch:z.string()}).strict();
export type TrainingProgram=z.infer<typeof programSchema>;
export type TrainingAssignment=z.infer<typeof assignmentSchema>;
export type TrainingSession=z.infer<typeof sessionSchema>;
export type TrainingDay=z.infer<typeof daySchema>;
export const blankExercise=(name='')=>({name,weight:null,sets:null,reps:'',minutes:null,rest:null,notes:''});
const day=(name:string,names:string[]):TrainingDay=>({name,rest:false,exercises:names.map(blankExercise)});
const push=['ضغط صدر / Chest press','ضغط كتف / Shoulder press','ترايسبس / Triceps'];
const pull=['سحب علوي / Lat pulldown','تجديف / Row','بايسبس / Biceps'];
const legs=['قرفصاء / Squat','ثني الرجل / Leg curl','رفع السمانة / Calf raise'];
const cardio=['مشي أو دراجة / Walking or cycling'];
const names:Partial<Record<typeof categories[number],TrainingDay[]>>={
 strength:[day('حديد A / Weights A',[push[0],pull[1],legs[0]]),day('حديد B / Weights B',[push[1],pull[0],legs[1]])],
 cardio:[day('كارديو A / Cardio A',cardio),day('كارديو B / Cardio B',['دراجة أو إليبتيكال / Cycling or elliptical'])],
 hybrid:[day('حديد + كارديو A / Hybrid A',[push[0],pull[1],...cardio]),day('حديد + كارديو B / Hybrid B',[legs[0],pull[0],...cardio])],
 hypertrophy:[day('علوي / Upper body',[...push,...pull]),day('سفلي / Lower body',legs)],
 'full-body':[day('جسم كامل A / Full body A',[legs[0],push[0],pull[1]]),day('جسم كامل B / Full body B',[legs[1],push[1],pull[0]])],
 ppl:[day('دفع / Push',push),day('سحب / Pull',pull),day('أرجل / Legs',legs)],
 'upper-lower':[day('علوي A / Upper A',[push[0],pull[0],push[1]]),day('سفلي A / Lower A',legs),day('علوي B / Upper B',[pull[1],push[2],pull[2]]),day('سفلي B / Lower B',legs)],
 functional:[day('حركة وظيفية / Functional movement',['حمل أوزان والمشي / Loaded carry','صعود درجة / Step-up','سحب مطاط / Band row'])],
 circuit:[day('دائرة تمارين / Exercise circuit',['دفع / Push movement','سحب / Pull movement','تمرين أرجل / Leg movement','كارديو / Cardio'])],
 hiit:[day('فترات عمل واستشفاء / Work & recovery intervals',['فترة عمل — يحدد المدرب / Work interval — coach defined','فترة استشفاء — يحدد المدرب / Recovery interval — coach defined'])],
 mobility:[day('مرونة وحركة / Mobility',['حركة الكتف / Shoulder mobility','حركة الحوض / Hip mobility','حركة الكاحل / Ankle mobility'])],
 bodyweight:[day('وزن الجسم / Bodyweight',['ضغط / Push-up','قرفصاء وزن الجسم / Bodyweight squat','بلانك / Plank'])],
 'general-fitness':[day('لياقة عامة / General fitness',['حركة مقاومة / Resistance movement',...cardio,'مرونة / Mobility'])]
};
export const presets:TrainingProgram[]=categories.filter(c=>c!=='custom').map(c=>({id:'preset-'+c,name:categoryNames[c].join(' / '),category:c,level:c==='hiit'?'advanced':'all',notes:'قالب قابل للتعديل؛ يحدد المدرب الأوزان والمجموعات والتكرارات والمدة المناسبة. / Editable template; coach defines loads, sets, repetitions and duration.',days:names[c]!,branch:'',archived:false,source:'preset-'+c}));
export function trainingOperation(s:GymState,op:Operation,today:string,newId:()=>string):boolean{
 s.programs??=[];s.trainingAssignments??=[];s.trainingSessions??=[];
 const fail=(code='invalid'):never=>{throw new RuleError(code);};
 switch(op.type){
 case 'training.save':{if(!op.program||typeof op.program!=='object'||Array.isArray(op.program))fail();const parsed=programSchema.safeParse({...(op.program as Record<string,unknown>),id:newId(),branch:op.branch,archived:false,source:undefined});if(!parsed.success)fail();s.programs.push(parsed.data!);break;}
 case 'training.archive':{const p=s.programs.find(p=>p.id===op.id&&p.branch===op.branch)??fail('notFound');p.archived=!p.archived;break;}
 case 'training.assign':{const m=s.members.find(m=>m.id===op.member&&m.branch===op.branch&&!m.archived)??fail('notFound');let p=s.programs.find(p=>p.id===op.program&&p.branch===op.branch&&!p.archived);if(!p){const preset=presets.find(p=>p.id===op.program)??fail('notFound');p=s.programs.find(p=>p.source===preset.id&&p.branch===op.branch&&!p.archived);if(!p){p={...structuredClone(preset),id:newId(),branch:op.branch};s.programs.push(p);}}
 const parsed=assignmentSchema.safeParse({id:newId(),member:m.id,program:p.id,start:op.start,end:op.end||null,notes:op.notes??'',active:true,branch:op.branch});if(!parsed.success)fail('dates');for(const a of s.trainingAssignments)if(a.member===m.id&&a.branch===op.branch)a.active=false;s.trainingAssignments.push(parsed.data!);break;}
 case 'training.stop':{const a=s.trainingAssignments.find(a=>a.id===op.id&&a.branch===op.branch&&a.active)??fail('notFound');a.active=false;break;}
 case 'training.complete':{const a=s.trainingAssignments.find(a=>a.id===op.id&&a.branch===op.branch&&a.active)??fail('notFound');if(s.members.find(m=>m.id===a.member)?.archived)fail('inactive');if(a.start>today||(a.end&&a.end<today))fail('dates');const p=s.programs.find(p=>p.id===a.program&&p.branch===op.branch)??fail('notFound');const parsed=sessionSchema.safeParse({id:newId(),assignment:a.id,day:op.day,date:today,note:op.note??'',sets:op.sets,branch:op.branch});if(!parsed.success||!p.days[Number(op.day)]||p.days[Number(op.day)].rest)fail();if(parsed.success&&parsed.data.sets){const seen=new Set<string>();for(const set of parsed.data.sets){const key=set.exercise+':'+set.set;if(!p.days[Number(op.day)].exercises[set.exercise]||seen.has(key))fail();seen.add(key);}}if(s.trainingSessions.some(x=>x.assignment===a.id&&x.day===op.day&&x.date===today))fail('duplicateSession');s.trainingSessions.push(parsed.data!);break;}
 default:return false;
 }
 if(s.programs.length>500||s.trainingAssignments.length>1000||s.trainingSessions.length>10000)fail('limit');return true;
}
