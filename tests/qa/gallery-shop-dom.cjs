/* Independent real React DOM test harness. Run with JSDOM_PATH pointing to jsdom. */
const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const assert=require('node:assert/strict');
const ts=require('typescript');
const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom');
const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'http://localhost/qa'});
for(const k of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLSelectElement','Node','Event','MouseEvent','CustomEvent','localStorage','sessionStorage']) global[k]=dom.window[k];
global.IS_REACT_ACT_ENVIRONMENT=true;
global.requestAnimationFrame=(cb)=>setTimeout(cb,0);
global.cancelAnimationFrame=clearTimeout;
window.scrollTo=()=>{};
HTMLElement.prototype.scrollIntoView=function(){};
const originalResolve=Module._resolveFilename;
Module._resolveFilename=function(request,parent,...args){return originalResolve.call(this,request.startsWith('@/')?path.join(process.cwd(),'src',request.slice(2)):request,parent,...args)};
for(const ext of ['.ts','.tsx']) require.extensions[ext]=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);
const React=require('react');
const {act}=React;
const {createRoot}=require('react-dom/client');
let root=createRoot(document.getElementById('root'));
const tick=()=>new Promise(r=>setTimeout(r,0));
async function flush(){await act(async()=>{await tick();await tick()})}
async function mount(component,props){await act(async()=>{root.render(React.createElement(component,props));await tick()});await flush()}
async function reset(){await act(async()=>root.unmount());document.body.innerHTML='<div id="root"></div>';root=createRoot(document.getElementById('root'));await flush()}
function button(text){const found=[...document.querySelectorAll('button')].filter(e=>typeof text==='string'?e.textContent.trim()===text:text.test(e.textContent.trim()));assert.equal(found.length,1,`button ${text}: ${found.length}; buttons: ${[...document.querySelectorAll('button')].map(e=>e.textContent.trim()).join(' | ')}`);return found[0]}
function field(label){let e=document.querySelector(`[aria-label="${label}"]`);if(!e){const l=[...document.querySelectorAll('label')].find(l=>{const c=l.cloneNode(true);c.querySelectorAll('input,select,textarea').forEach(n=>n.remove());return c.textContent.trim()===label});e=l?.control||l?.querySelector('input,select,textarea')}assert.ok(e,`field ${label}`);return e}
async function click(e){assert.ok(!e.disabled,`click disabled: ${e.textContent}`);await act(async()=>{e.dispatchEvent(new MouseEvent('click',{bubbles:true}));await tick()});await flush()}
async function set(e,value){await act(async()=>{const proto=e.tagName==='SELECT'?window.HTMLSelectElement.prototype:e.tagName==='TEXTAREA'?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,String(value));e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));await tick()});await flush()}
const log=[];
async function check(name,fn){await fn();log.push(name);console.log('PASS',name)}
module.exports={assert,React,act,mount,reset,flush,button,field,click,set,log,check};
