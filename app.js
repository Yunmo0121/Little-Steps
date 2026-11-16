'use strict';

// Little Steps Season One v0.3 — no libraries, backend, or network required.
// Storybook visuals, classic graph search, and real tabular Q-Learning.
const WIDTH = 10;
const HEIGHT = 8;
const DIRECTIONS = [[-1,0],[0,1],[1,0],[0,-1]]; // up, right, down, left
const DEFAULT_HEDGES = [[2,1],[2,2],[2,3],[2,4],[4,3],[5,3],[6,3],[7,3],[7,4],[7,5],[4,6]];
const DEFAULT_MUD = [[3,2],[3,3],[3,4],[3,5],[4,5],[5,5],[6,5],[6,4]];
const idOf = (r,c) => r*WIDTH+c;
const rcOf = i => [Math.floor(i/WIDTH),i%WIDTH];
const startDefault = idOf(6,1);
const goalDefault = idOf(1,8);
const garden = document.querySelector('#garden');
const status = document.querySelector('#status');
const diary = document.querySelector('#diary-entries');
const toolButtons = [...document.querySelectorAll('[data-tool]')];
const algorithmButtons = [...document.querySelectorAll('[data-algorithm]')];
const trainButton = document.querySelector('#train');
const learnedButton = document.querySelector('#learned');
const resetButton = document.querySelector('#reset');
const speedInput = document.querySelector('#speed');
const chart = document.querySelector('#chart');
const chapterCards=document.querySelector('#chapter-cards');
const windButton=document.querySelector('#wind-shift');
const finishOverlay=document.querySelector('#finish-overlay');

// Season One's five chapters. The other seasons are teasers, not playable content.
const CHAPTERS = [
  {id:1, title:'The First Flower', icon:'🌼', quality:'Courage',
   intro:'Kristie has never explored beyond her little cottage. Today, a glowing flower is waiting at the end of a winding path.',
   task:'Find the glowing flower. Every adventure begins with a first step.',
   win:'Kristie discovered that being brave does not mean knowing every answer. It means taking the first step.',
   hedges:[[2,1],[2,2],[2,3],[2,4],[4,3],[5,3],[6,3],[7,3],[7,4],[7,5],[4,6]],
   mud:[[3,2],[3,3],[3,4],[3,5],[4,5],[5,5],[6,5],[6,4]],
   start:[6,1],goal:[1,8],goalIcon:'🌼'},
  {id:2, title:'Muddy Meadow', icon:'🌦️', quality:'Wisdom',
   intro:'It rained all night. The shortest path is muddy, and some detours may turn out to be wiser choices.',
   task:'Reach the meadow bridge. Compare BFS with the weighted planners!',
   win:'Not every short road is the best road. Kristie learned to think about the cost of a choice.',
   hedges:[[1,3],[2,3],[4,3],[5,3],[6,3],[3,6],[4,6],[5,6],[1,8]],
   mud:[[3,1],[3,2],[3,3],[3,4],[3,5],[3,7],[4,5],[2,5],[2,6],[2,7],[4,7],[5,7],[5,1],[4,1],[1,1]],
   start:[7,1],goal:[0,8],goalIcon:'🌈'},
  {id:3, title:'Mushroom Village', icon:'🍄', quality:'Kindness',
   intro:'A small rabbit has lost the way home. Can Kristie find her friend before heading to the mushroom cottage?',
   task:'First visit the lost rabbit 🐇, then reach the village cottage 🏡.',
   win:'Helping someone else showed Kristie that kindness can be its own kind of adventure.',
   hedges:[[1,2],[2,2],[3,2],[4,2],[5,2],[6,5],[5,5],[3,7],[4,7],[5,7],[6,7],[1,6]],
   mud:[[2,4],[2,5],[2,6],[5,3],[5,4],[6,4],[6,6]],
   start:[7,0],goal:[0,9],waypoint:[4,5],waypointIcon:'🐇',goalIcon:'🏡'},
  {id:4, title:'Whispering Woods', icon:'🌲', quality:'Adaptability',
   intro:'The woods are full of whispers. When the wind blows, new hedges grow and familiar paths may disappear.',
   task:'Find the lantern. Press the wind button to change the maze, then plan again.',
   win:'The world changed, but Kristie did not give up. She learned to find a new way forward.',
   hedges:[[1,1],[2,1],[3,1],[4,1],[5,1],[6,3],[5,3],[4,3],[2,4],[3,5],[4,5],[5,5],[6,7],[5,7],[4,7],[1,7]],
   mud:[[2,2],[3,3],[4,4],[4,6],[5,6],[6,6]],
   start:[7,0],goal:[0,9],windTiles:[[0,4],[3,4]],goalIcon:'🏮'},
  {id:5, title:'Starlight Garden', icon:'🌙', quality:'Confidence',
   intro:'Beyond the last garden gate, tiny lights shine across the night. Everything Kristie learned is needed one more time.',
   task:'Reach the lost star and finish Kristie’s first great adventure.',
   win:'Kristie followed the stars, one patient step at a time. From far beyond the garden, a distant island glimmered in the sky.',
   hedges:[[1,1],[2,1],[3,1],[4,1],[5,1],[2,3],[3,3],[4,3],[5,3],[6,3],[1,5],[2,5],[3,5],[4,5],[5,7],[4,7],[3,7],[2,7],[1,7]],
   mud:[[6,1],[6,2],[6,4],[6,5],[5,6],[4,6],[3,6],[2,8],[1,8]],
   start:[7,0],goal:[0,9],goalIcon:'⭐'}
];
const chapterById=id=>CHAPTERS[id-1];
let activeChapter=1;
let waypoint=null;
let windTriggered=false;


let terrain;
let start;
let goal;
let robot;
let selectedTool = 'hedge';
let visitedVisual = new Set();
let pathVisual = new Set();
let runToken = 0;
let busy = false;
let training = null;
let qValues = null;
let trainingHistory = [];
let episodeCount = 0;
let trained = false;
const diaryEvents = [];

function initMap() {
  const chapter=chapterById(activeChapter);
  terrain = Array(WIDTH*HEIGHT).fill('grass');
  for(const [r,c] of chapter.hedges) terrain[idOf(r,c)]='hedge';
  for(const [r,c] of chapter.mud) terrain[idOf(r,c)]='mud';
  start=idOf(...chapter.start);
  goal=idOf(...chapter.goal);
  waypoint=chapter.waypoint?idOf(...chapter.waypoint):null;
  terrain[start]='grass';terrain[goal]='grass';
  if(waypoint!==null)terrain[waypoint]='grass';
  windTriggered=false;
  robot=start;
}
function terrainCost(i) { return terrain[i] === 'mud' ? 3 : 1; }
function distance(a,b) {
  const [ar,ac]=rcOf(a),[br,bc]=rcOf(b);
  return Math.abs(ar-br)+Math.abs(ac-bc);
}
function nextPosition(i,action) {
  const [r,c]=rcOf(i), [dr,dc]=DIRECTIONS[action];
  const nr=r+dr,nc=c+dc;
  if(nr<0||nr>=HEIGHT||nc<0||nc>=WIDTH) return -1;
  const next=idOf(nr,nc);
  return terrain[next]==='hedge' ? -1 : next;
}
function neighbors(i) {
  const result=[];
  for(let action=0;action<4;action++) {
    const next=nextPosition(i,action);
    if(next!==-1) result.push(next);
  }
  return result;
}
function renderMap() {
  const frag=document.createDocumentFragment();
  for(let i=0;i<terrain.length;i++) {
    const cell=document.createElement('button');
    cell.type='button';
    cell.className='garden-cell '+terrain[i]+(i===goal?' goal':'')+(i===start?' start':'')+(visitedVisual.has(i)?' visited':'')+(pathVisual.has(i)?' path':'')+(i===robot?' robot-here':'');
    const [r,c]=rcOf(i);
    const label=`Row ${r+1}, column ${c+1}: ${i===robot?'Kristie, ':''}${i===goal?'destination, ':''}${i===waypoint?'lost friend, ':''}${i===start?'start, ':''}${terrain[i]}`;
    cell.setAttribute('aria-label',label);
    cell.dataset.index=String(i);
    if(i===robot) {
      const bot=document.createElement('span');bot.className='tile-robot';
      bot.innerHTML='<span class="tile-robot-scarf"></span><span class="tile-robot-heart"></span><span class="tile-robot-face"><i></i><i></i><b></b></span>';
      cell.appendChild(bot);
    } else if(i===goal) {
      const icon=document.createElement('span');icon.className='tile-icon';icon.textContent=chapterById(activeChapter).goalIcon;cell.appendChild(icon);
    } else if(i===waypoint) {
      const icon=document.createElement('span');icon.className='tile-icon';icon.textContent=chapterById(activeChapter).waypointIcon;cell.appendChild(icon);
    } else if(terrain[i]==='hedge') {
      const icon=document.createElement('span');icon.className='tile-icon';icon.textContent='🌳';cell.appendChild(icon);
    } else if(terrain[i]==='mud') {
      const icon=document.createElement('span');icon.className='tile-icon';icon.textContent='🟤';cell.appendChild(icon);
    } else if ((r*13+c*7)%17===2 || (r*3+c*5)%29===7) {
      const icon=document.createElement('span');icon.className='tile-icon';icon.style.opacity='.83';icon.textContent=(r+c)%3===0?'🌷':'🌱';cell.appendChild(icon);
    }
    frag.appendChild(cell);
  }
  garden.replaceChildren(frag);
}
function message(text){ status.textContent=text; }
function resetMetrics(){
  document.querySelector('#stat-explored').textContent='—';
  document.querySelector('#stat-steps').textContent='—';
  document.querySelector('#stat-cost').textContent='—';
}
function setMetrics(explored,steps,cost){
  document.querySelector('#stat-explored').textContent=explored ?? '—';
  document.querySelector('#stat-steps').textContent=steps ?? '—';
  document.querySelector('#stat-cost').textContent=cost ?? '—';
}
function addDiaryEntry(text){
  diaryEvents.unshift(text);
  diaryEvents.splice(4);
  renderDiaryEvents();
  saveProgress();
}
function renderDiaryEvents(){
  diary.replaceChildren(...(diaryEvents.length ? diaryEvents : ['Every adventure starts with a first step.']).map(s=>{
    const p=document.createElement('p');p.textContent='✿ '+s;return p;
  }));
}
function setBusy(value,mode=''){
  busy=value;
  algorithmButtons.forEach(b=>{ b.disabled=value; b.classList.toggle('running',value&&b.dataset.algorithm===mode); });
  trainButton.disabled=value;
  trainButton.classList.toggle('running',value&&mode==='training');
  learnedButton.disabled=value||!trained;
  document.querySelectorAll('.garden-cell').forEach(b=>b.disabled=value);
  windButton.disabled=value;
}
function cancelRun(){ runToken++; busy=false; setBusy(false); }
function clearVisualization(){ visitedVisual.clear();pathVisual.clear();robot=start; }
function clearLearning(){
  qValues=null;
  trained=false;
  trainingHistory=[];
  episodeCount=0;
  document.querySelector('#episode-label').textContent='0 episodes';
  document.querySelector('#success').textContent='—';
  document.querySelector('#reward').textContent='—';
  learnedButton.disabled=true;
  drawChart();
}
function onMapChange(){
  cancelRun();clearVisualization();clearLearning();resetMetrics();renderMap();
  message('A new path awaits. Choose a method to explore this garden! 🌷');
  saveProgress();
}
function editTile(i){
  if(busy) return;
  if(i===waypoint){message('This is where a little friend waits. Please leave this square open. 🐇');return;}
  if(selectedTool==='start'){
    if(i===goal||terrain[i]==='hedge') {message('Kristie needs an empty square, away from the flower and hedges. 🌿');return;}
    start=i;
  } else if(selectedTool==='goal') {
    if(i===start||terrain[i]==='hedge') {message('The flower needs a clear square, away from Kristie and hedges. 🌼');return;}
    goal=i;
  } else {
    if(i===start||i===goal) {message('Move Kristie or the flower before editing their squares. 🌱');return;}
    terrain[i]=selectedTool==='erase'?'grass':selectedTool;
  }
  onMapChange();
}
// Reconstruct a route from predecessor pointers. Returns null if goal unreachable.
function reconstruct(parent,from=start,to=goal){
  if(from===to) return [from];
  if(parent[to]===-1) return null;
  const path=[to];let current=to;
  for(let j=0;j<WIDTH*HEIGHT;j++){
    if(current===from)break;
    current=parent[current];
    if(current<0)return null;
    path.push(current);
  }
  return path[path.length-1]===from?path.reverse():null;
}
function searchBFS(from=start,to=goal){
  const seen=new Set([from]), queue=[from],parent=Array(WIDTH*HEIGHT).fill(-1),order=[];
  let head=0;
  while(head<queue.length){
    const current=queue[head++];order.push(current);
    if(current===to)break;
    for(const neighbor of neighbors(current)){
      if(seen.has(neighbor))continue;
      seen.add(neighbor);parent[neighbor]=current;queue.push(neighbor);
    }
  }
  return {order,path:reconstruct(parent,from,to)};
}
function searchWeighted(type,from=start,to=goal){
  const count=WIDTH*HEIGHT,parent=Array(count).fill(-1),best=Array(count).fill(Infinity),order=[];
  const opened=[{node:from,dist:0,priority:0}];best[from]=0;
  const settled=new Set();
  while(opened.length){
    opened.sort((a,b)=>a.priority-b.priority || a.dist-b.dist);
    const item=opened.shift(),current=item.node;
    if(settled.has(current)||item.dist!==best[current])continue;
    settled.add(current);order.push(current);
    if(current===to)break;
    for(const neighbor of neighbors(current)){
      const d=best[current]+terrainCost(neighbor);
      if(d>=best[neighbor])continue;
      best[neighbor]=d;parent[neighbor]=current;
      opened.push({node:neighbor,dist:d,priority:d+(type==='astar'?distance(neighbor,to):0)});
    }
  }
  return {order,path:reconstruct(parent,from,to)};
}
function planRoute(kind){
  const planner=(from,to)=>kind==='bfs'?searchBFS(from,to):searchWeighted(kind,from,to);
  if(waypoint===null)return planner(start,goal);
  const first=planner(start,waypoint);
  if(!first.path)return {order:first.order,path:null};
  const second=planner(waypoint,goal);
  return {order:[...first.order,...second.order],path:second.path?[...first.path,...second.path.slice(1)]:null};
}
function pathCost(path){
  if(!path)return null;
  return path.slice(1).reduce((sum,position)=>sum+terrainCost(position),0);
}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
function visualDelay(){return Math.max(12,155-Number(speedInput.value)*1.35);}
async function animatePath(result,label){
  cancelRun();const token=runToken;
  clearVisualization();renderMap();setBusy(true,label);
  message(`${label.toUpperCase()} is exploring the garden... ✨`);
  for(const node of result.order){
    if(token!==runToken)return;
    visitedVisual.add(node);renderMap();
    await sleep(visualDelay()/2.8);
  }
  if(token!==runToken)return;
  if(!result.path){
    setMetrics(result.order.length,'—','—');message('Oh no! The flower is unreachable. Try erasing a hedge. 🌱');
    addDiaryEntry(`${label.toUpperCase()}: no path to the flower yet.`);setBusy(false);return;
  }
  for(const node of result.path){
    if(token!==runToken)return;
    pathVisual.add(node);renderMap();await sleep(visualDelay()/2);
  }
  for(const node of result.path){
    if(token!==runToken)return;
    robot=node;renderMap();await sleep(visualDelay());
  }
  if(token!==runToken)return;
  const steps=result.path.length-1,cost=pathCost(result.path);
  setMetrics(result.order.length,steps,cost);
  message(`Hooray! Kristie found the flower in ${steps} steps using ${label.toUpperCase()}. 🌼`);
  addDiaryEntry(`${label.toUpperCase()}: ${steps} steps, cost ${cost}, explored ${result.order.length} tiles.`);
  setBusy(false);
  completeChapter(steps,cost,label);
}
function bestAction(values,randomTie=false){
  let max=-Infinity,candidates=[];
  for(let a=0;a<4;a++){
    if(values[a]>max+1e-9){max=values[a];candidates=[a];}
    else if(Math.abs(values[a]-max)<1e-9)candidates.push(a);
  }
  return candidates[randomTie?Math.floor(Math.random()*candidates.length):0];
}
function qIndex(pos,hasFriend){return pos+(hasFriend&&waypoint!==null?WIDTH*HEIGHT:0);}
function simulateEpisode(q,epsilon){
  let position=start,total=0,reached=false,steps=0,hasFriend=waypoint===null;
  const alpha=.21,gamma=.95;
  for(let t=0;t<220;t++){
    const state=qIndex(position,hasFriend);
    const action=Math.random()<epsilon?Math.floor(Math.random()*4):bestAction(q[state],true);
    const next=nextPosition(position,action);
    const blocked=next===-1;
    const actual=blocked?position:next;
    const gotFriend=waypoint!==null&&!hasFriend&&actual===waypoint;
    const nextHasFriend=hasFriend||gotFriend;
    const done=actual===goal&&nextHasFriend;
    const oldTarget=hasFriend?goal:waypoint;
    const reward=done?20:(blocked?-1.25:-.07-(terrain[actual]==='mud'?.20:0)
      +.24*(distance(position,oldTarget)-distance(actual,oldTarget))+(gotFriend?7:0));
    const nextMax=Math.max(...q[qIndex(actual,nextHasFriend)]);
    q[state][action]+=alpha*(reward+(done?0:gamma*nextMax)-q[state][action]);
    total+=reward;steps++;position=actual;hasFriend=nextHasFriend;
    if(done){reached=true;break;}
  }
  return {success:reached,reward:total,steps};
}
function updateTrainingSummary(results){
  const last=results.slice(-100),sum=last.reduce((n,r)=>n+(r.success?1:0),0);
  const mean=last.reduce((n,r)=>n+r.reward,0)/(last.length||1);
  document.querySelector('#episode-label').textContent=`${episodeCount} episodes`;
  document.querySelector('#success').textContent=`${Math.round(100*sum/(last.length||1))}%`;
  document.querySelector('#reward').textContent=mean.toFixed(1);
}
async function trainKristie(){
  cancelRun();const token=runToken;
  clearVisualization();renderMap();setBusy(true,'training');
  resetMetrics();trained=false;qValues=Array.from({length:WIDTH*HEIGHT*(waypoint===null?1:2)},()=>[0,0,0,0]);
  trainingHistory=[];episodeCount=0;let results=[];
  const TOTAL=waypoint===null?1200:2000;
  message('Kristie is practicing! A little wrong turn can teach a lot... 🌱');
  for(let ep=0;ep<TOTAL;ep++){
    if(token!==runToken)return;
    const epsilon=Math.max(.05,.92*Math.pow(.992,ep));
    const result=simulateEpisode(qValues,epsilon);results.push(result);episodeCount++;
    if((ep+1)%20===0){
      const recent=results.slice(-100);
      const fraction=recent.filter(x=>x.success).length/recent.length;
      trainingHistory.push({episode:ep+1,success:fraction});
    }
    if((ep+1)%60===0){
      updateTrainingSummary(results);drawChart();
      await sleep(1);
    }
  }
  if(token!==runToken)return;
  trained=true;
  updateTrainingSummary(results);drawChart();setBusy(false);
  saveProgress();
  const wins=results.slice(-100).filter(r=>r.success).length;
  message(`Practice complete! Kristie reached the flower in ${wins} of her last 100 attempts. Try her learned route! 🌼`);
  addDiaryEntry(`Q-Learning: trained ${episodeCount} episodes; last-100 success ${wins}%.`);
}
function learnedRoute(){
  if(!qValues||!trained)return null;
  const path=[start],seen=new Set();let position=start,hasFriend=waypoint===null;
  for(let step=0;step<WIDTH*HEIGHT*4;step++){
    if(position===goal&&hasFriend)return path;
    const state=qIndex(position,hasFriend);
    if(seen.has(state))return null;
    seen.add(state);
    const action=bestAction(qValues[state]);
    const next=nextPosition(position,action);
    if(next===-1)return null;
    position=next;
    if(position===waypoint)hasFriend=true;
    path.push(position);
  }
  return position===goal&&hasFriend?path:null;
}
async function showLearnedRoute(){
  const path=learnedRoute();
  if(!path){
    message('Kristie is still unsure of the route. Try training again! 🌱');
    addDiaryEntry('Learned route was incomplete; another practice session may help.');
    return;
  }
  await animatePath({order:[...new Set(path)],path},'Q-Learning');
}
function drawChart(){
  const ctx=chart.getContext('2d');if(!ctx)return;
  const w=chart.width,h=chart.height;
  ctx.clearRect(0,0,w,h);
  ctx.strokeStyle='#e6ead9';ctx.lineWidth=1;
  for(let j=0;j<=4;j++){
    const y=13+(h-27)*j/4;ctx.beginPath();ctx.moveTo(31,y);ctx.lineTo(w-14,y);ctx.stroke();
  }
  ctx.fillStyle='#ab9d87';ctx.font='11px sans-serif';ctx.fillText('100%',3,17);ctx.fillText('0%',13,h-11);
  if(trainingHistory.length<2){
    ctx.fillStyle='#aca694';ctx.font='italic 13px Georgia';ctx.fillText('Kristie’s learning journey will appear here ✿',49,h/2+4);return;
  }
  const x0=32,y0=h-14,iw=w-48,ih=h-27;
  ctx.beginPath();
  trainingHistory.forEach((p,i)=>{
    const x=x0+i/(trainingHistory.length-1)*iw;
    const y=y0-p.success*ih;
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  });
  ctx.strokeStyle='#81b291';ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
  const last=trainingHistory[trainingHistory.length-1];
  const y=y0-last.success*ih;
  ctx.beginPath();ctx.arc(x0+iw,y,4,0,Math.PI*2);ctx.fillStyle='#da9da1';ctx.fill();
}

garden.addEventListener('click',e=>{
  const cell=e.target.closest('[data-index]');
  if(cell)editTile(Number(cell.dataset.index));
});
toolButtons.forEach(button=>button.addEventListener('click',()=>{
  selectedTool=button.dataset.tool;
  toolButtons.forEach(b=>{const chosen=b===button;b.classList.toggle('active',chosen);b.setAttribute('aria-pressed',String(chosen));});
  document.querySelector('#map-help').textContent=`${button.textContent.trim()} selected — click a garden square.`;
}));
algorithmButtons.forEach(button=>button.addEventListener('click',()=>{
  if(busy)return;
  const kind=button.dataset.algorithm;
  const result=planRoute(kind);
  animatePath(result,kind==='astar'?'A*':kind);
}));
trainButton.addEventListener('click',()=>{if(!busy)trainKristie();});
learnedButton.addEventListener('click',()=>{if(!busy)showLearnedRoute();});
resetButton.addEventListener('click',()=>{
  cancelRun();initMap();clearLearning();clearVisualization();resetMetrics();renderMap();
  message('The chapter garden is fresh again. Where shall Kristie go next? 🌷');
  addDiaryEntry('A new garden adventure begins.');
});
speedInput.addEventListener('input',()=>{
  const value=Number(speedInput.value);
  document.querySelector('#speed-label').textContent=value<30?'Slow':value>72?'Fast':'Medium';
});
// === Season One: chapter progression, safe local saves, menu and story pages ===
const STORE_KEY='little-steps-kristie-v03';
const LEGACY_STORE_KEY='little-steps-kristie-v02';
const screenNames=['menu','game','chapters','diary','settings'];
const defaultProgress=()=>({hasStarted:false,xp:0,completedChapters:[],chapterBest:{},activeChapter:1,lastPlayed:null});
let progress=defaultProgress();
let storageWorking=true;

function readProgress(){
  try{
    const fresh=localStorage.getItem(STORE_KEY);
    if(fresh)return JSON.parse(fresh);
    const old=localStorage.getItem(LEGACY_STORE_KEY);
    if(!old)return null;
    const legacy=JSON.parse(old);
    if(!legacy.hasStarted)return null;
    // Import v0.2 Chapter 1 progress without erasing old saves.
    return {...legacy,activeChapter:1,completedChapters:legacy.completed?[1]:[],
      chapterBest:legacy.completed?{1:{steps:legacy.bestSteps,cost:legacy.bestCost}}:{},
      xp:legacy.completed?Math.max(50,Number(legacy.xp)||0):0};
  }catch(e){storageWorking=false;return null;}
}
function saveProgress(){
  if(!progress.hasStarted)return;
  const state={...progress,activeChapter,terrain:[...terrain],start,goal,waypoint,windTriggered,
    qValues:trained?qValues:null,trained,
    trainingHistory:trained?trainingHistory:[],episodeCount:trained?episodeCount:0,
    diaryEvents:[...diaryEvents],speed:Number(speedInput.value),lastPlayed:new Date().toISOString()};
  try{localStorage.setItem(STORE_KEY,JSON.stringify(state));storageWorking=true;}
  catch(e){storageWorking=false;}
  updateMenuStatus();
}
function restoreFromSave(saved){
  if(!saved||!saved.hasStarted)return false;
  const chapter=Number.isInteger(saved.activeChapter)&&saved.activeChapter>=1&&saved.activeChapter<=5?saved.activeChapter:1;
  activeChapter=chapter;
  initMap();
  const posOk=i=>Number.isInteger(i)&&i>=0&&i<WIDTH*HEIGHT;
  if(Array.isArray(saved.terrain)&&saved.terrain.length===WIDTH*HEIGHT&&posOk(saved.start)&&posOk(saved.goal)&&saved.start!==saved.goal){
    terrain=saved.terrain.map(t=>['grass','hedge','mud'].includes(t)?t:'grass');
    start=saved.start;goal=saved.goal;
    terrain[start]='grass';terrain[goal]='grass';
    if(waypoint!==null)terrain[waypoint]='grass';
    windTriggered=!!saved.windTriggered;
  }
  clearVisualization();clearLearning();resetMetrics();
  const expected=WIDTH*HEIGHT*(waypoint===null?1:2);
  if(saved.trained&&Array.isArray(saved.qValues)&&saved.qValues.length===expected
    &&saved.qValues.every(q=>Array.isArray(q)&&q.length===4&&q.every(Number.isFinite))){
    qValues=saved.qValues;trained=true;
    trainingHistory=Array.isArray(saved.trainingHistory)?saved.trainingHistory.filter(x=>Number.isFinite(x.episode)&&Number.isFinite(x.success)).slice(-100):[];
    episodeCount=Number.isInteger(saved.episodeCount)?saved.episodeCount:0;
    document.querySelector('#episode-label').textContent=`${episodeCount} episodes`;
    learnedButton.disabled=false;
  }
  diaryEvents.splice(0,diaryEvents.length,...(Array.isArray(saved.diaryEvents)?saved.diaryEvents.filter(x=>typeof x==='string').slice(0,4):[]));
  renderDiaryEvents();
  if(Number.isFinite(saved.speed))speedInput.value=Math.max(1,Math.min(100,saved.speed));
  renderChapterHeader();syncSpeed();renderMap();drawChart();
  message(`Welcome back, Kristie! Chapter ${activeChapter} remembers you. ♡`);
  return true;
}
function updateMenuStatus(){
  document.querySelector('#continue-game').disabled=!progress.hasStarted;
  document.querySelector('#continue-hint').textContent=progress.hasStarted?`Return to Chapter ${activeChapter} · ${chapterById(activeChapter).title}`:'No saved adventure yet';
  document.querySelector('#storage-note').textContent=storageWorking?'Your progress is saved in this browser only (not GitHub or other devices).':'This browser is blocking local storage; your progress may not survive a refresh.';
}
function renderChapters(){
  chapterCards.replaceChildren();
  for(const chapter of CHAPTERS){
    const completed=progress.completedChapters.includes(chapter.id);
    const unlocked=chapter.id===1||progress.completedChapters.includes(chapter.id-1);
    const item=document.createElement('article');item.className='chapter-card '+(unlocked?'chapter-open':'chapter-locked');
    if(completed)item.classList.add('chapter-completed');
    const number=document.createElement('span');number.className='chapter-number';number.textContent=`CHAPTER ${String(chapter.id).padStart(2,'0')} · ${completed?'COMPLETE':unlocked?'READY':'LOCKED'}`;
    const art=document.createElement('div');art.className='chapter-art';art.textContent=chapter.icon;
    const title=document.createElement('h2');title.textContent=chapter.title;
    const quality=document.createElement('span');quality.className='chapter-quality';quality.textContent=`✦ ${chapter.quality}`;
    const story=document.createElement('p');story.textContent=chapter.intro;
    item.append(number,art,title,quality,story);
    if(unlocked){
      const button=document.createElement('button');button.type='button';button.className='storybook-button '+(completed?'':'main-action');
      button.textContent=completed?'Revisit Chapter '+String(chapter.id).padStart(2,'0'):'Play Chapter '+String(chapter.id).padStart(2,'0');
      button.addEventListener('click',()=>openChapter(chapter.id));item.append(button);
    } else {
      const locked=document.createElement('span');locked.className='locked-label';locked.textContent=`✧ Finish Chapter ${chapter.id-1} to unlock`;item.append(locked);
    }
    chapterCards.append(item);
  }
}
function showScreen(which){
  if(!screenNames.includes(which))return;
  if(which!=='game')cancelRun();
  closeFinish();
  screenNames.forEach(n=>document.getElementById(`${n}-screen`).hidden=n!==which);
  if(which==='chapters')renderChapters();
  if(which==='diary')renderJournal();
  if(which==='settings')syncSpeed();
  if(which==='menu')updateMenuStatus();
  window.scrollTo({top:0,behavior:'instant'});
}
function renderChapterHeader(){
  const ch=chapterById(activeChapter);
  document.querySelector('#chapter-pill-number').textContent=`Chapter ${String(activeChapter).padStart(2,'0')}`;
  document.querySelector('#chapter-pill-name').textContent=ch.title;
  document.querySelector('#story-chapter-icon').textContent=ch.icon;
  document.querySelector('#story-chapter-kicker').textContent=`CHAPTER ${String(activeChapter).padStart(2,'0')} · ${ch.quality.toUpperCase()}`;
  document.querySelector('#story-chapter-title').textContent=ch.title;
  document.querySelector('#story-chapter-text').textContent=ch.intro;
  document.querySelector('#story-chapter-task').textContent=`✧ ${ch.task}`;
  document.querySelector('#game-level-title').textContent=`${ch.icon} ${ch.title}`;
  document.querySelector('#game-level-subtitle').textContent=ch.task;
  document.querySelector('#game-level-tag').textContent=`Level ${String(activeChapter).padStart(2,'0')} ♥`;
  windButton.hidden=activeChapter!==4;
  windButton.textContent=windTriggered?'🍃 The wind settles (restore hedges)':'🍃 The wind rearranges the woods';
  document.querySelector('#game-screen').dataset.chapter=String(activeChapter);
}
function openChapter(number){
  if(!Number.isInteger(number)||number<1||number>5)return;
  if(number>1&&!progress.completedChapters.includes(number-1))return;
  cancelRun();activeChapter=number;progress.hasStarted=true;progress.activeChapter=number;
  initMap();clearLearning();clearVisualization();resetMetrics();
  renderMap();renderChapterHeader();
  message(`Chapter ${number} — ${chapterById(number).title}. ${chapterById(number).task}`);
  addDiaryEntry(`A new page opens: Chapter ${number} — ${chapterById(number).title}.`);
  saveProgress();showScreen('game');
}
function newAdventure(){
  if(progress.hasStarted&&!window.confirm('Start again from Chapter 1? This resets your saved journey, chapters and stars.'))return;
  progress=defaultProgress();diaryEvents.splice(0);
  openChapter(1);
}
function continueAdventure(){
  if(!progress.hasStarted){newAdventure();return;}
  cancelRun();const saved=readProgress();
  if(saved)restoreFromSave(saved);
  else{renderChapterHeader();renderMap();}
  showScreen('game');
}
function completeChapter(steps,cost,label){
  if(!progress.hasStarted)return;
  const chapter=chapterById(activeChapter);
  const isNew=!progress.completedChapters.includes(activeChapter);
  if(isNew){progress.completedChapters.push(activeChapter);progress.completedChapters.sort((a,b)=>a-b);progress.xp+=50;}
  const previous=progress.chapterBest[activeChapter]||{};
  progress.chapterBest[activeChapter]={steps:Number.isInteger(previous.steps)?Math.min(previous.steps,steps):steps,
    cost:Number.isInteger(previous.cost)?Math.min(previous.cost,cost):cost};
  addDiaryEntry(`Chapter ${activeChapter}: ${chapter.title} complete via ${label}. ${steps} steps, cost ${cost}${isNew?' · +50 XP ✨':''}`);
  message(`Chapter ${activeChapter} complete! ${chapter.quality} grows with every step. ${isNew?'+50 XP ✨':'♡'}`);
  saveProgress();showChapterFinish(isNew);
}
function showChapterFinish(newlyComplete){
  const ch=chapterById(activeChapter);
  document.querySelector('#finish-illustration').textContent=activeChapter===5?'🌙 ✨ 🏝️':ch.icon;
  document.querySelector('#finish-kicker').textContent=activeChapter===5?'THE END OF A FIRST ADVENTURE':'A LITTLE STEP FORWARD';
  document.querySelector('#finish-title').textContent=activeChapter===5?'A sky full of possibilities':'Chapter '+activeChapter+' complete!';
  document.querySelector('#finish-description').textContent=ch.win;
  const quote=document.querySelector('#finish-quote');
  quote.hidden=activeChapter!==5;
  quote.textContent='“The world is bigger than I ever imagined.”';
  document.querySelector('#finish-reward').textContent=activeChapter===5
    ?`✦ Season One complete! ${newlyComplete?'+50 XP · ':''}Beyond the Garden awaits someday.`
    :newlyComplete?'✦ +50 XP · The next chapter is now unlocked':'✦ A familiar adventure, a little wiser this time';
  const next=document.querySelector('#finish-next');
  next.hidden=activeChapter===5;
  if(activeChapter<5)next.textContent=`Chapter ${activeChapter+1} · ${chapterById(activeChapter+1).title} ›`;
  finishOverlay.hidden=false;
  document.querySelector('#finish-chapters').focus();
}
function closeFinish(){finishOverlay.hidden=true;}
function renderJournal(){
  document.querySelector('#journal-xp').textContent=String(progress.xp||0);
  document.querySelector('#journal-best').textContent=progress.chapterBest[activeChapter]?.steps??'—';
  document.querySelector('#journal-episodes').textContent=episodeCount;
  const done=progress.completedChapters.length;
  document.querySelector('#journal-progress').textContent=done===5?'Five chapters complete! Kristie sees a new horizon beyond the garden.':done?`${done} of 5 chapters complete. Kristie is learning to grow through each little adventure.`:progress.hasStarted?'The first chapter has begun. Every little step matters.':'Kristie’s story is waiting to begin.';
  const badges=document.querySelector('#journal-badges');badges.replaceChildren();
  for(const ch of CHAPTERS){
    const badge=document.createElement('span');badge.className='journal-badge '+(progress.completedChapters.includes(ch.id)?'earned':'not-earned');
    badge.textContent=`${ch.icon} ${ch.quality}`;
    badges.append(badge);
  }
  const entries=document.querySelector('#journal-entries');
  entries.replaceChildren(...(diaryEvents.length?diaryEvents:['Every adventure starts with a first step.']).map(s=>{
    const p=document.createElement('p');p.textContent='✿ '+s;return p;
  }));
}
function syncSpeed(){
  const n=Number(speedInput.value);const word=n<30?'Slow':n>72?'Fast':'Medium';
  document.querySelector('#speed-label').textContent=word;
  document.querySelector('#menu-speed-label').textContent=word;
  document.querySelector('#menu-speed').value=String(n);
}
function shiftWind(){
  if(activeChapter!==4||busy)return;
  const ch=chapterById(4);
  const next=!windTriggered;
  for(const [r,c] of ch.windTiles){
    const idx=idOf(r,c);
    if(idx!==start&&idx!==goal)terrain[idx]=next?'hedge':'grass';
  }
  windTriggered=next;
  onMapChange();renderChapterHeader();
  message(next?'A strong breeze rearranged the hedges! The old plan may no longer work. 🍃':'The wind grew quiet and the woodland paths opened again. 🍃');
  addDiaryEntry(next?'Whispering Woods: the wind changed the map. Kristie can plan again.':'Whispering Woods: the wind settled.');
  saveProgress();
}

// Events: menu, chapter progression, settings and the story finale.
document.querySelector('#new-game').addEventListener('click',newAdventure);
document.querySelector('#continue-game').addEventListener('click',continueAdventure);
document.querySelector('#journal-play').addEventListener('click',()=>progress.hasStarted?continueAdventure():newAdventure());
document.querySelector('#builder-entry').addEventListener('click',()=>{
  progress.hasStarted?continueAdventure():newAdventure();
  message('Garden Builder: choose Hedge, Mud, Erase, Start or Destination to design your world! ✿');
});
document.querySelector('#back-to-menu').addEventListener('click',()=>showScreen('menu'));
document.querySelector('#story-back-chapters').addEventListener('click',()=>showScreen('chapters'));
document.querySelectorAll('[data-open-screen]').forEach(btn=>btn.addEventListener('click',()=>showScreen(btn.dataset.openScreen)));
document.querySelector('#finish-chapters').addEventListener('click',()=>showScreen('chapters'));
document.querySelector('#finish-next').addEventListener('click',()=>openChapter(activeChapter+1));
windButton.addEventListener('click',shiftWind);
document.querySelector('#menu-speed').addEventListener('input',e=>{speedInput.value=e.target.value;syncSpeed();saveProgress();});
speedInput.addEventListener('change',()=>{syncSpeed();saveProgress();});
document.querySelector('#erase-save').addEventListener('click',()=>{
  if(!window.confirm('Erase Kristie’s saved adventure on this browser? This cannot be undone.'))return;
  try{localStorage.removeItem(STORE_KEY);localStorage.removeItem(LEGACY_STORE_KEY);}catch(e){storageWorking=false;}
  progress=defaultProgress();activeChapter=1;
  cancelRun();initMap();clearLearning();clearVisualization();resetMetrics();renderMap();
  diaryEvents.splice(0);renderDiaryEvents();renderChapterHeader();updateMenuStatus();showScreen('menu');
});

// Bootstrap. Migrate older V0.2 progress where available.
initMap();
const stored=readProgress();
if(stored?.hasStarted){
  const chapters=Array.isArray(stored.completedChapters)?stored.completedChapters.filter(x=>Number.isInteger(x)&&x>=1&&x<=5):[];
  const best=stored.chapterBest&&typeof stored.chapterBest==='object'&&!Array.isArray(stored.chapterBest)?stored.chapterBest:{};
  progress={...defaultProgress(),hasStarted:true,xp:Number(stored.xp)||0,
    completedChapters:[...new Set(chapters)].sort((a,b)=>a-b),chapterBest:best,
    activeChapter:Number.isInteger(stored.activeChapter)?stored.activeChapter:1,lastPlayed:stored.lastPlayed||null};
  if(!restoreFromSave(stored))progress=defaultProgress();
}
renderChapterHeader();renderMap();drawChart();renderDiaryEvents();syncSpeed();updateMenuStatus();showScreen('menu');
