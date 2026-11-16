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
const sandbox=vm.createContext({document,localStorage:storage,window:{scrollTo(){},confirm(){return true},addEventListener(){}},console,setTimeout,Math,Date,Number,Set,Array,JSON});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8'),sandbox);
const run=code=>vm.runInContext(code,sandbox);

const results=run(`CHAPTERS.map(ch=>{
  activeChapter=ch.id;initMap();
  const bfs=planRoute('bfs'), dijkstra=planRoute('dijkstra'), astar=planRoute('astar');
  return {chapter:ch.id, bfsSteps:bfs.path?.length-1, dijkstraSteps:dijkstra.path?.length-1, bfsCost:pathCost(bfs.path),
    dijkstraCost:pathCost(dijkstra.path),astarCost:pathCost(astar.path),
    rabbitVisited:waypoint===null||(bfs.path||[]).includes(waypoint)};
})`);
for(const item of results){
  assert.ok(Number.isFinite(item.bfsSteps),`Chapter ${item.chapter} must be reachable`);
  assert.ok(item.rabbitVisited,`Chapter ${item.chapter}: required checkpoint must be visited`);
  assert.equal(item.dijkstraCost,item.astarCost,`Chapter ${item.chapter}: Dijkstra vs A* optimal cost`);
}
assert.ok(results[1].bfsCost>results[1].dijkstraCost,'Muddy Meadow must illustrate weighted path choices');
assert.ok(results[1].dijkstraSteps>results[1].bfsSteps,'The wiser path should be longer in the default meadow');
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
// Story mode: newly started game opens a skippable three-page intro without
// changing existing progress when revisited from the Chapter One card.
run('newAdventure()');
assert.equal(get('#story-overlay').hidden,false,'New adventure must show opening story');
assert.match(get('#story-scene-title').textContent,/little garden/);
run('advanceFirstStory()');
assert.equal(get('#story-scene-count').textContent,'PAGE 2 OF 3');
run('advanceFirstStory()');run('advanceFirstStory()');
assert.equal(get('#story-overlay').hidden,true,'Story must close after page 3');
run('openFirstStory()');
assert.equal(get('#story-overlay').hidden,false,'Story should be replayable');
run('closeFirstStory()');
assert.equal(get('#story-overlay').hidden,true);
// Tutorial is opt-in after first story, can be skipped and reopened without XP changes.
run('storyIsReplay=false; storyIsOpen=true; tutorialSeen=false; closeFirstStory()');
assert.equal(get('#tutorial-panel').hidden,false,'Tutorial appears after a new story');
assert.equal(run('tutorialStep'),'meet');
run('setTutorialStep("bfs")');
assert.equal(run('tutorialStep'),'bfs');
run('stopTutorial()');
assert.equal(get('#tutorial-panel').hidden,true,'Guide can be skipped');
run('startTutorial()');
assert.equal(run('tutorialStep'),'meet','Guide can be replayed');
assert.equal(JSON.parse(memory.get('little-steps-kristie-v03')).xp,run('progress.xp'),'Tutorial must not change earned XP');
// v0.6: Muddy Meadow story, wooden bridge, clover, manual walking and replayable stars.
run('progress=defaultProgress();openChapter(1);completeChapter(14,14,"BFS");openChapter(2)');
assert.equal(get('#story-overlay').hidden,false,'Chapter 2 must introduce its own story');
assert.match(get('#story-scene-title').textContent,/rain overnight/);
run('closeFirstStory()');
assert.equal(run('progress.chapter2StorySeen'),true,'Chapter 2 intro should be remembered');
const meadow=run(`(()=>{activeChapter=2;initMap();const bfs=planRoute('bfs'),dik=planRoute('dijkstra');return {bfsSteps:bfs.path.length-1,bfsCost:pathCost(bfs.path),dijkstraCost:pathCost(dik.path),bridgeCount:CHAPTERS[1].bridge.length}})()`);
assert.ok(meadow.bfsCost>meadow.dijkstraCost,'Muddy Meadow must compare short and cheap paths');
assert.equal(meadow.bridgeCount,2);
// First earn a route-cost star by auto-planning.
run('completeChapter(16,16,"Dijkstra")');
assert.deepEqual(Array.from(run('progress.stars[2]')),[1,2]);
run('closeFinish();showScreen("game");');
const wander=run(`(()=>{
 const first=searchBFS(start,chapterTwoClover()).path,second=searchBFS(chapterTwoClover(),goal).path;
 const path=[...first,...second.slice(1)];startManualMode();
 for(let i=1;i<path.length;i++){
  const [r,c]=rcOf(path[i-1]),[nr,nc]=rcOf(path[i]);
  const action=DIRECTIONS.findIndex(([dr,dc])=>r+dr===nr&&c+dc===nc);
  walkManually(action);
 }
 return {steps:manualSteps,cost:manualCost,stars:progress.stars[2],mode:manualMode,completed:progress.completedChapters.includes(2)};
})()`);
assert.ok(wander.completed,'Manual walk should complete the meadow');
assert.equal(wander.mode,false,'Manual mode switches off at success');
assert.deepEqual(Array.from(wander.stars),[1,2,3],'Clover exploration awards the third star cumulatively');
const saved06=JSON.parse(memory.get('little-steps-kristie-v03'));
assert.deepEqual(Array.from(saved06.stars[2]),[1,2,3],'Stars must survive saving');
assert.ok(saved06.routeRecords[2].manual.steps>0,'Manual records must save');
assert.equal(run('progress.xp'),100,'Repeat runs must not duplicate chapter XP');
// v0.7: later stories, starlight collection order, RL state expansion, and epilogue.
const lateChapters=run(`CHAPTERS.slice(2).map(c=>({id:c.id,title:c.title,reachable:(()=>{activeChapter=c.id;initMap();return !!planRoute('astar').path})()}))`);
for(const c of lateChapters)assert.ok(c.reachable,`Later chapter ${c.id} must be playable`);
run('progress=defaultProgress();progress.hasStarted=true;progress.completedChapters=[1,2,3,4];openChapter(5)');
assert.equal(get('#story-overlay').hidden,false,'Chapter Five opening story appears on first visit');
assert.match(get('#story-scene-title').textContent,/night garden/);
run('closeFirstStory()');
assert.equal(run('progress.storySeen[5]'),true,'Chapter Five story can be marked as seen');
const finalRoute=run(`(()=>{const p=planRoute('astar').path;return {path:p,fragments:fragmentPositions(),cost:pathCost(p),mask:qIndex(goal,true,3)}})()`);
assert.equal(finalRoute.fragments.length,2,'Final chapter requires two fragments');
for(const fragment of finalRoute.fragments)assert.ok(finalRoute.path.includes(fragment),'Planner must collect all starlight');
assert.ok(finalRoute.mask<320,'Q-Learning uses four position/fragment states (80x4)');
const finalBFS=run("planRoute('bfs').path");
for(const fragment of finalRoute.fragments)assert.ok(finalBFS.includes(fragment),'BFS must collect both stars');
run('collectedStarlight=new Set(fragmentPositions());completeChapter(20,22,"Manual",{fragments:2})');
assert.equal(get('#season-one-epilogue').hidden,false,'Season One epilogue is shown after final chapter');
assert.match(get('#finish-quote').textContent,/The world is bigger than I ever imagined/);
assert.equal(run('progress.xp'),50,'Completing one chapter awards XP once');
run('completeChapter(20,22,"Manual",{fragments:2})');
assert.equal(run('progress.xp'),50,'Repeated final chapter gives no additional XP');
assert.deepEqual(Array.from(run('progress.stars[5]')),[1,2,3],'Final chapter rewards collect / manual / completion stars');
console.log('PASS — five chapters, RL planning, V0.5 tutorial, V0.6 meadow, V0.7 rabbit / wind / starlight / epilogue');
