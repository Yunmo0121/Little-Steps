// node tests/test_algorithms.cjs
// Dependency-free smoke tests for the five chapters (Node.js 18+).
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');

class FakeClassList { constructor(){this.set=new Set()} toggle(n,v){v?this.set.add(n):this.set.delete(n)} add(n){this.set.add(n)} remove(n){this.set.delete(n)} }
class Element {
  constructor(){this.children=[];this.textContent='';this.dataset={};this.classList=new FakeClassList();this.value=52;this.width=420;this.height=145;this.style={};this.disabled=false;this.hidden=false;this.listeners={}}
  addEventListener(k,fn){(this.listeners[k]??=[]).push(fn)}
  setAttribute(){}
  append(...nodes){this.children.push(...nodes)}
  appendChild(node){this.children.push(node);return node}
  replaceChildren(...nodes){this.children=[...nodes]}
  focus(){}
  getContext(){return {clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fillText(){},arc(){},fill(){}}}
}
const elements=new Map();const get=s=>{if(!elements.has(s))elements.set(s,new Element());return elements.get(s)};
const tools=['hedge','mud','erase','start','goal'].map(v=>Object.assign(new Element(),{dataset:{tool:v}}));
const algs=['bfs','dijkstra','astar'].map(v=>Object.assign(new Element(),{dataset:{algorithm:v}}));
const document={querySelector:get,querySelectorAll(s){return s==='[data-tool]'?tools:s==='[data-algorithm]'?algs:[]},createElement(){return new Element()},createDocumentFragment(){return new Element()},getElementById:id=>get('#'+id)};
const memory=new Map();
const storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
const sandbox=vm.createContext({document,localStorage:storage,window:{scrollTo(){},confirm(){return true}},console,setTimeout,Math,Date,Number,Set,Array,JSON});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8'),sandbox);
const run=code=>vm.runInContext(code,sandbox);

const results=run(`CHAPTERS.map(ch=>{
  activeChapter=ch.id;initMap();
  const bfs=planRoute('bfs'), dijkstra=planRoute('dijkstra'), astar=planRoute('astar');
  return {chapter:ch.id, bfsSteps:bfs.path?.length-1, bfsCost:pathCost(bfs.path),
    dijkstraCost:pathCost(dijkstra.path),astarCost:pathCost(astar.path),
    rabbitVisited:waypoint===null||(bfs.path||[]).includes(waypoint)};
})`);
for(const item of results){
  assert.ok(Number.isFinite(item.bfsSteps),`Chapter ${item.chapter} must be reachable`);
  assert.ok(item.rabbitVisited,`Chapter ${item.chapter}: required checkpoint must be visited`);
  assert.equal(item.dijkstraCost,item.astarCost,`Chapter ${item.chapter}: Dijkstra vs A* optimal cost`);
}
assert.ok(results[1].bfsCost>results[1].dijkstraCost,'Muddy Meadow must illustrate weighted path choices');
const wind=run(`(()=>{
  activeChapter=4;initMap();const before=planRoute('astar').path;
  for(const [r,c] of CHAPTERS[3].windTiles)terrain[idOf(r,c)]='hedge';
  const after=planRoute('astar').path;
  return {before:JSON.stringify(before),after:JSON.stringify(after),reachable:!!after};
})()`);
assert.ok(wind.reachable,'Wind-shifted forest must remain playable');
assert.notEqual(wind.before,wind.after,'Wind must change the planned route');

run('progress=defaultProgress();activeChapter=1;openChapter(1)');
for(let chapter=1;chapter<=5;chapter++){
  if(chapter>1)run(`openChapter(${chapter})`);
  run('completeChapter(14,16,"A*")');
  assert.equal(run('progress.xp'),chapter*50,'50 XP exactly once per chapter');
  assert.equal(run('progress.completedChapters.length'),chapter);
  run('completeChapter(14,16,"A*")');
  assert.equal(run('progress.xp'),chapter*50,'replaying must not farm XP');
}
assert.equal(run('progress.completedChapters.length'),5);
assert.equal(run('document.querySelector("#finish-quote").textContent'),'“The world is bigger than I ever imagined.”');
assert.equal(JSON.parse(memory.get('little-steps-kristie-v03')).completedChapters.length,5);
console.log('PASS — five playable maps, optimal costs, waypoint, wind change, XP, saving and finale');
