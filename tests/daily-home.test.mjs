import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const component=new URL('../app/daily-home.tsx',import.meta.url).href;
const hook=registerHooks({resolve(spec,ctx,next){if(ctx.parentURL===component&&spec==='./lib/domain')return next(spec+'.ts',ctx);return next(spec,ctx);},load(url,ctx,next){if(url===component)return{format:'module',shortCircuit:true,source:ts.transpileModule(readFileSync(new URL(url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext}}).outputText};return next(url,ctx);}});
const {default:DailyHome}=await import(component);
hook.deregister();
const {emptyState}=await import('../app/lib/domain.ts');
function render(role,canEdit=true){const state=emptyState();state.members=[{id:'real',name:'Visible member',phone:'01000000000',branch:'main',joined:'2026-01-01',expires:'2026-01-30',archived:false,demo:false},{id:'foreign',name:'Foreign branch secret',phone:'',branch:'other',joined:'2026-01-01',expires:'2026-01-30',archived:false,demo:false},{id:'demo',name:'Demo member secret',phone:'',branch:'main',joined:'2026-01-01',expires:'2026-01-30',archived:false,demo:true}];return renderToStaticMarkup(createElement(DailyHome,{state,branch:'main',role,ar:false,today:'2026-01-25',canEdit,admin:role==='owner',onTask:()=>{},onMember:()=>{}}));}
test('Daily home scopes attention records to real members in the current branch',()=>{const html=render('owner');assert.match(html,/Visible member/);assert.doesNotMatch(html,/Foreign branch secret|Demo member secret/);assert.match(html,/Team &amp; permissions/);});
test('Reception home offers viewing tasks and explains the write restriction',()=>{const html=render('reception',false);assert.match(html,/Ask an owner or manager/);assert.match(html,/Find a member/);assert.doesNotMatch(html,/Collect a balance|Add member|Team &amp; permissions|View detailed reports/);});
test('Read-only managers retain disabled shortcuts without team administration',()=>{const html=render('manager',false);assert.equal((html.match(/disabled=""/g)??[]).length,4);assert.match(html,/Club manager/);assert.doesNotMatch(html,/Team &amp; permissions/);});
