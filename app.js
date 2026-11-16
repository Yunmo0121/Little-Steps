'use strict';

// Little Steps Season One v1.0 — complete five-chapter adventure — no libraries, backend, or network required.
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
const storyOverlay=document.querySelector('#story-overlay');

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
   hedges:[[1,3],[2,3],[4,3],[5,3],[6,3],[3,6],[4,6],[5,6],[1,8],[1,7]],
   mud:[[3,1],[3,2],[3,3],[3,4],[3,5],[3,7],[4,5],[2,5],[2,6],[2,7],[4,7],[5,7],[5,1],[4,1],[1,1],[0,6],[0,7]],
   start:[7,1],goal:[0,8],goalIcon:'🌈',bridge:[[6,6],[6,7]],clover:[4,9]},
  {id:3, title:'Mushroom Village', icon:'🍄', quality:'Kindness',
   intro:'A small rabbit has lost the way home. Can Kristie find her friend before heading to the mushroom cottage?',
   task:'Find the lost rabbit 🐇 first, then escort your friend to the mushroom cottage 🏡.',
   win:'Helping someone else showed Kristie that kindness can be its own kind of adventure.',
   hedges:[[1,2],[2,2],[3,2],[4,2],[5,2],[6,5],[5,5],[3,7],[4,7],[5,7],[6,7],[1,6]],
   mud:[[2,4],[2,5],[2,6],[5,3],[5,4],[6,4],[6,6]],
   start:[7,0],goal:[0,9],waypoint:[4,5],waypointIcon:'🐇',goalIcon:'🏡'},
  {id:4, title:'Whispering Woods', icon:'🌲', quality:'Adaptability',
   intro:'The woods are full of whispers. When the wind blows, new hedges grow and familiar paths may disappear.',
   task:'Reach the lantern 🪔. The wind will shift the woods as you walk. Try planning again!',
   win:'The world changed, but Kristie did not give up. She learned to find a new way forward.',
   hedges:[[1,1],[2,1],[3,1],[4,1],[5,1],[6,3],[5,3],[4,3],[2,4],[3,5],[4,5],[5,5],[6,7],[5,7],[4,7],[1,7]],
   mud:[[2,2],[3,3],[4,4],[4,6],[5,6],[6,6]],
   start:[7,0],goal:[0,9],windTiles:[[0,4],[3,4]],goalIcon:'🪔'},
  {id:5, title:'Starlight Garden', icon:'🌙', quality:'Confidence',
   intro:'Beyond the last garden gate, tiny lights shine across the night. Everything Kristie learned is needed one more time.',
   task:'Collect both starlight fragments ✨, then reach the glowing star ⭐.',
   win:'Kristie followed the stars, one patient step at a time. From far beyond the garden, a distant island glimmered in the sky.',
   hedges:[[1,1],[2,1],[3,1],[4,1],[5,1],[2,3],[3,3],[4,3],[5,3],[6,3],[1,5],[2,5],[3,5],[4,5],[5,7],[4,7],[3,7],[2,7],[1,7]],
   mud:[[6,1],[6,2],[6,4],[6,5],[5,6],[4,6],[3,6],[2,8],[1,8]],
   start:[7,0],goal:[0,9],fragments:[[6,6],[2,4]],goalIcon:'⭐'}
];
const chapterById=id=>CHAPTERS[id-1];
let activeChapter=1;
let waypoint=null;
let windTriggered=false;
// v0.6: hands-on wandering and chapter-specific discoveries.
let manualMode=false, manualSteps=0, manualCost=0, manualFriend=false;
let manualClover=false, comparisonVisible=false;
let collectedStarlight=new Set(), manualWindSurvived=false, rabbitFound=false;
const chapterTwoClover = () => activeChapter===2 ? idOf(...chapterById(2).clover) : null;
const fragmentPositions=()=>activeChapter===5 ? chapterById(5).fragments.map(([r,c])=>idOf(r,c)) : [];
const allFragmentsCollected=()=>fragmentPositions().every(i=>collectedStarlight.has(i));
const isFragment=i=>fragmentPositions().includes(i);
const isBridge=i=>activeChapter===2 && (chapterById(2).bridge||[]).some(([r,c])=>idOf(r,c)===i);
const routeSignature=()=>`${activeChapter}|${terrain.join(',')}|${start}|${goal}|${waypoint}`;



let terrain;
let start;
let goal;
let robot;
let selectedTool = 'hedge';
let visitedVisual = new Set();
let pathVisual = new Set();
let runToken = 0;
let busy = false;
let robotMood = 'idle';
let robotFacing = 'right';
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
  for(const i of fragmentPositions())terrain[i]='grass';
  collectedStarlight=new Set();rabbitFound=false;manualWindSurvived=false;
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
    cell.className='garden-cell '+terrain[i]+(isBridge(i)&&terrain[i]==='grass'?' bridge':'')+(i===goal?' goal':'')+(i===start?' start':'')+(visitedVisual.has(i)?' visited':'')+(pathVisual.has(i)?' path':'')+(i===robot?' robot-here':'');
    const [r,c]=rcOf(i);
    const label=`Row ${r+1}, column ${c+1}: ${i===robot?'Kristie, ':''}${i===goal?'destination, ':''}${i===waypoint?'lost friend, ':''}${isFragment(i)?'starlight fragment, ':''}${i===start?'start, ':''}${terrain[i]}`;
    cell.setAttribute('aria-label',label);
    cell.dataset.index=String(i);
    if(i===robot) {
      const bot=document.createElement('span');
      bot.className=`tile-robot mood-${robotMood} facing-${robotFacing}`;
      bot.innerHTML='<span class="tile-robot-ear ear-left"></span><span class="tile-robot-ear ear-right"></span><span class="tile-robot-bag"></span><span class="tile-robot-scarf"></span><span class="tile-robot-heart"></span><span class="tile-robot-face"><i></i><i></i><b></b></span><span class="tile-robot-foot foot-left"></span><span class="tile-robot-foot foot-right"></span><span class="tile-robot-sparkle">✦</span>';
      if(activeChapter===3&&rabbitFound){const friend=document.createElement('span');friend.className='rabbit-companion';friend.textContent='🐇';bot.appendChild(friend);}
      cell.appendChild(bot);
    } else if(isFragment(i)){
      const sparkle=document.createElement('span');sparkle.className='tile-icon star-fragment'+(collectedStarlight.has(i)?' collected':'');sparkle.textContent=collectedStarlight.has(i)?'✧':'✨';cell.appendChild(sparkle);
    } else if(i===chapterTwoClover()) {
      const icon=document.createElement('span');icon.className='tile-icon clover-icon';icon.textContent='🍀';cell.appendChild(icon);
    } else if(i===goal) {
      const icon=document.createElement('span');icon.className='tile-icon';icon.textContent=chapterById(activeChapter).goalIcon;cell.appendChild(icon);
    } else if(i===waypoint) {
      const icon=document.createElement('span');icon.className='tile-icon';icon.textContent=chapterById(activeChapter).waypointIcon;cell.appendChild(icon);
    } else if(terrain[i]==='hedge') {
      const icon=document.createElement('span');icon.className='tile-icon';icon.textContent=activeChapter===1?'🌿':activeChapter===4?'🌲':activeChapter===3&&i%3===0?'🍄':'🌳';cell.appendChild(icon);
    } else if(terrain[i]==='mud') {
      const icon=document.createElement('span');icon.className='tile-icon';icon.textContent='🟤';cell.appendChild(icon);
    } else if(isBridge(i)&&terrain[i]==='grass') {
      const icon=document.createElement('span');icon.className='bridge-symbol';icon.textContent='≋';cell.appendChild(icon);
    } else if(activeChapter===3&&(i===idOf(1,9)||i===idOf(6,8))){
      const icon=document.createElement('span');icon.className='tile-icon';icon.textContent='🍄';cell.appendChild(icon);
    } else if(activeChapter===2 && (i===idOf(1,9)||i===idOf(7,8))) {
      const icon=document.createElement('span');icon.className='tile-icon';icon.textContent='🪴';cell.appendChild(icon);
    } else if ((r*13+c*7)%17===2 || (r*3+c*5)%29===7) {
      const icon=document.createElement('span');icon.className='tile-icon';icon.style.opacity='.83';icon.textContent=(r+c)%3===0?'🌷':'🌱';cell.appendChild(icon);
    }
    frag.appendChild(cell);
  }
  garden.replaceChildren(frag);
}
function message(text){ status.textContent=text; }
function setSpeech(text){document.querySelector('#kristie-line').textContent=text;}
function setMood(next){robotMood=next;}

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
  document.querySelector('#manual-toggle').disabled=value;
  document.querySelectorAll('[data-move]').forEach(b=>b.disabled=value);
  algorithmButtons.forEach(b=>{ b.disabled=value; b.classList.toggle('running',value&&b.dataset.algorithm===mode); });
  trainButton.disabled=value;
  trainButton.classList.toggle('running',value&&mode==='training');
  learnedButton.disabled=value||!trained;
  document.querySelectorAll('.garden-cell').forEach(b=>b.disabled=value);
  windButton.disabled=value;
}
function cancelRun(){ runToken++; busy=false; setBusy(false); }
function clearVisualization(){ visitedVisual.clear();pathVisual.clear();robot=start;robotMood='idle';robotFacing='right';collectedStarlight.clear();rabbitFound=false; }
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
  cancelRun();resetManualRun();clearVisualization();clearLearning();resetMetrics();renderMap();updateRouteComparison();renderSpecialChapterPanel();
  message('A new path awaits. Choose a method to explore this garden! 🌷');
  setSpeech('Oh! You changed the garden. I can try a new way!');
  saveProgress();
}
function editTile(i){
  if(busy) return;
  if(manualMode){message('Switch off Let Me Try before editing the garden. ✿');return;}
  if(i===chapterTwoClover()){message('Keep this lucky clover safe! 🍀');return;}
  if(i===waypoint){message('This is where a little friend waits. Please leave this square open. 🐇');return;}
  if(isFragment(i)){message('These precious starlight fragments must stay visible! ✨');return;}
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
  const fragments=fragmentPositions();
  // Both orders are valid: compare them, then keep the lower-step (BFS) or lower-cost
  // (Dijkstra/A*) complete route rather than arbitrarily forcing one collectible order.
  const options=fragments.length===2?[[fragments[0],fragments[1]],[fragments[1],fragments[0]]]:[fragments];
  let best=null;
  for(const sequence of options){
    const targets=[...(waypoint!==null?[waypoint]:[]),...sequence,goal];
    let from=start;const route=[from],order=[];
    let valid=true;
    for(const to of targets){
      const part=planner(from,to);order.push(...part.order);
      if(!part.path){valid=false;break;}
      route.push(...part.path.slice(1));from=to;
    }
    if(!valid)continue;
    const metric=kind==='bfs'?route.length-1:pathCost(route);
    if(!best||metric<best.metric)best={order,path:route,metric};
  }
  return best?{order:best.order,path:best.path}:{order:[],path:null};
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
  setMood('thinking');renderMap();
  message(`${label.toUpperCase()} is exploring the garden... ✨`);
  setSpeech('Hmm... I wonder which path will lead me to the flower?');
  for(const node of result.order){
    if(token!==runToken)return;
    visitedVisual.add(node);renderMap();
    await sleep(visualDelay()/2.8);
  }
  if(token!==runToken)return;
  if(!result.path){
    setMood('worried');renderMap();setSpeech('Oh dear... the path is blocked. Could we move a hedge?');
    if(tutorialStep==='searching')setTutorialStep('bfs');
    setMetrics(result.order.length,'—','—');message('Oh no! The flower is unreachable. Try erasing a hedge. 🌱');
    addDiaryEntry(`${label.toUpperCase()}: no path to the flower yet.`);setBusy(false);return;
  }
  for(const node of result.path){
    if(token!==runToken)return;
    pathVisual.add(node);renderMap();await sleep(visualDelay()/2);
  }
  setMood('walking');
  setSpeech('One little step... and another! I can do this!');
  for(const node of result.path){
    if(token!==runToken)return;
    if(node!==robot)robotFacing=rcOf(node)[1]<rcOf(robot)[1]?'left':'right';
    robot=node;
    if(activeChapter===3&&node===waypoint&&!rabbitFound){rabbitFound=true;setSpeech('We found our bunny! Come along, little friend! 🐇');}
    if(activeChapter===5&&isFragment(node)&&!collectedStarlight.has(node)){collectedStarlight.add(node);setSpeech(`A little light! ${collectedStarlight.size}/2 starlight fragments ✨`);}
    renderMap();renderSpecialChapterPanel();await sleep(visualDelay());
  }
  if(token!==runToken)return;
  if(activeChapter===5&&!allFragmentsCollected()){setMood('worried');setBusy(false);setSpeech('The garden needs both fragments before the final star!');return;}
  const steps=result.path.length-1,cost=pathCost(result.path);
  setMood('celebrate');renderMap();setSpeech(activeChapter===3?'We helped our bunny friend get home! 🐇':activeChapter===4?'Even a changed path can lead somewhere beautiful! 🪔':activeChapter===5?'We found all the little lights! The sky is glowing! ✨':'I did it! We found our way together! ✨');
  await sleep(690);if(token!==runToken)return;
  setMetrics(result.order.length,steps,cost);
  message(`Hooray! Kristie completed ${chapterById(activeChapter).title} in ${steps} steps using ${label.toUpperCase()}! ${chapterById(activeChapter).icon}`);
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
function qIndex(pos,hasFriend,mask=0){
  const stage=waypoint!==null?(hasFriend?1:0):0;
  const friendStages=waypoint===null?1:2;
  return pos+WIDTH*HEIGHT*(stage+friendStages*mask);
}
function fragmentMaskAt(pos,mask){
  if(activeChapter!==5)return mask;
  const index=fragmentPositions().indexOf(pos);
  return index<0?mask:mask|(1<<index);
}
function simulateEpisode(q,epsilon){
  let position=start,total=0,reached=false,steps=0,hasFriend=waypoint===null,mask=0;
  const alpha=.21,gamma=.95;
  for(let t=0;t<220;t++){
    const state=qIndex(position,hasFriend,mask);
    const action=Math.random()<epsilon?Math.floor(Math.random()*4):bestAction(q[state],true);
    const next=nextPosition(position,action);
    const blocked=next===-1;
    const actual=blocked?position:next;
    const gotFriend=waypoint!==null&&!hasFriend&&actual===waypoint;
    const nextHasFriend=hasFriend||gotFriend;
    const nextMask=fragmentMaskAt(actual,mask);
    const gotFragment=nextMask!==mask;
    const allCollected=activeChapter!==5||nextMask===3;
    const done=actual===goal&&nextHasFriend&&allCollected;
    const outstanding=fragmentPositions().filter((_,index)=>!(mask&(1<<index)));
    const oldTarget=!hasFriend?waypoint:(outstanding.length?outstanding[0]:goal);
    const reward=done?20:(blocked?-1.25:-.07-(terrain[actual]==='mud'?.20:0)
      +.24*(distance(position,oldTarget)-distance(actual,oldTarget))+(gotFriend?7:0)+(gotFragment?7:0));
    const nextMax=Math.max(...q[qIndex(actual,nextHasFriend,nextMask)]);
    q[state][action]+=alpha*(reward+(done?0:gamma*nextMax)-q[state][action]);
    total+=reward;steps++;position=actual;hasFriend=nextHasFriend;mask=nextMask;
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
  resetMetrics();trained=false;qValues=Array.from({length:WIDTH*HEIGHT*(waypoint===null?1:2)*(activeChapter===5?4:1)},()=>[0,0,0,0]);
  trainingHistory=[];episodeCount=0;let results=[];
  const TOTAL=activeChapter===5?4200:(waypoint===null?1200:2000);
  setMood('thinking');renderMap();
  message('Kristie is practicing! A little wrong turn can teach a lot... 🌱');
  setSpeech('I might make mistakes, but every try teaches me something new.');
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
  trained=true;setMood('idle');renderMap();
  updateTrainingSummary(results);drawChart();setBusy(false);
  saveProgress();
  const wins=results.slice(-100).filter(r=>r.success).length;
  if(tutorialStep==='train')setTutorialStep('trained');
  message(`Practice complete! Kristie finished ${wins} of her last 100 attempts. Try her learned route! 🌷`);
  setSpeech('I practiced so much! Shall we try my new path?');
  addDiaryEntry(`Q-Learning: trained ${episodeCount} episodes; last-100 success ${wins}%.`);
}
function learnedRoute(){
  if(!qValues||!trained)return null;
  const path=[start],seen=new Set();let position=start,hasFriend=waypoint===null,mask=0;
  for(let step=0;step<WIDTH*HEIGHT*4;step++){
    if(position===goal&&hasFriend&&(activeChapter!==5||mask===3))return path;
    const state=qIndex(position,hasFriend,mask);
    if(seen.has(state))return null;
    seen.add(state);
    const action=bestAction(qValues[state]);
    const next=nextPosition(position,action);
    if(next===-1)return null;
    position=next;
    if(position===waypoint)hasFriend=true;
    mask=fragmentMaskAt(position,mask);
    path.push(position);
  }
  return position===goal&&hasFriend&&(activeChapter!==5||mask===3)?path:null;
}
async function showLearnedRoute(){
  const path=learnedRoute();
  if(!path){
    setMood('worried');renderMap();setSpeech('I am still learning. Could we practice a little more?');
    message('Kristie is still unsure of the route. Try training again! 🌱');
    addDiaryEntry('Learned route was incomplete; another practice session may help.');
    return;
  }
  if(tutorialStep==='trained')setTutorialStep('walking-rl');
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

// === v0.6: Try it Yourself, Muddy Meadow, wise choices and route comparison ===
function manualPanel(){return document.querySelector('#manual-panel');}
function refreshManualControls(){
  manualPanel().hidden=!manualMode;
  document.querySelector('#manual-toggle').setAttribute('aria-pressed',String(manualMode));
  document.querySelector('#manual-toggle').textContent=manualMode?'✿ Finish manual exploring':'🎮 Let Me Try · Move Kristie';
  document.querySelector('#garden').classList.toggle('manual-active',manualMode);
  document.querySelector('#tools').classList.toggle('edit-disabled',manualMode);
  updateManualReadout();
}
function resetManualRun(){
  manualSteps=0;manualCost=0;manualFriend=waypoint===null;manualClover=false;manualWindSurvived=false;
  collectedStarlight.clear();rabbitFound=false;
  updateManualReadout();
}
function updateManualReadout(){
  const el=document.querySelector('#manual-readout');
  if(el)el.textContent=`${manualSteps} steps · cost ${manualCost}${activeChapter===2?' · '+(manualClover?'🍀 Clover found':'🍀 Clover hidden'):''}${activeChapter===3?' · '+(manualFriend?'🐇 Bunny found':'🐇 Find the bunny'):''}${activeChapter===4?' · '+(manualWindSurvived?'🍃 Wind survived':'🍃 Listen for wind'):''}${activeChapter===5?' · '+collectedStarlight.size+'/2 star fragments':''}`;
}
function stopManualMode(){
  manualMode=false;refreshManualControls();
}
function startManualMode(){
  if(busy||storyIsOpen||!finishOverlay.hidden)return;
  cancelRun();resetManualRun();clearVisualization();robot=start;
  manualMode=true;visitedVisual.clear();pathVisual.clear();
  renderMap();refreshManualControls();
  setMood('idle');setSpeech(activeChapter===2?'Let’s try the puddle paths! Which way feels best?':activeChapter===3?'Shall we find our bunny friend first? 🐇':activeChapter===4?'The woods sound breezy today... 🍃':activeChapter===5?'Two little lights are waiting for us. ✨':'One little step at a time. You can guide me!');
  message('Let Me Try is ON! Use arrow keys, WASD or the direction buttons. Follow the path yourself. ♡');
}
function walkManually(action){
  if(!manualMode||busy||storyIsOpen||!finishOverlay.hidden||document.querySelector('#game-screen').hidden)return;
  const next=nextPosition(robot,action);
  if(next===-1){setMood('worried');renderMap();setSpeech('Oops, a hedge! Let’s try another way.');return;}
  const old=robot;robot=next;manualSteps++;manualCost+=terrainCost(next);
  if(action===1)robotFacing='right';else if(action===3)robotFacing='left';
  if(waypoint!==null&&next===waypoint&&!manualFriend){manualFriend=true;rabbitFound=true;setSpeech('We found our little friend! Let’s take her home! 🐇');addDiaryEntry('Mushroom Village: Kristie found the lost bunny and promised a safe journey home.');}
  if(activeChapter===5&&isFragment(next)&&!collectedStarlight.has(next)){collectedStarlight.add(next);setSpeech(`We found a starlight fragment! ${collectedStarlight.size}/2 ✨`);addDiaryEntry(`Starlight Garden: fragment ${collectedStarlight.size} of 2 found.`);}
  if(next===chapterTwoClover()&&!manualClover){manualClover=true;setSpeech('A lucky clover! I want to remember this little discovery. 🍀');}
  if(activeChapter===4&&!windTriggered&&manualSteps>=4){
    applyWind(true,false);manualWindSurvived=true;setSpeech('The paths changed! That is okay; I can find another way. 🍃');
  }
  setMood('walking');visitedVisual.add(next);renderMap();updateManualReadout();renderSpecialChapterPanel();
  setMetrics(manualSteps+1,manualSteps,manualCost);
  if(next===goal){
    if(waypoint!==null&&!manualFriend){message('Before going home, we must find our rabbit friend. 🐇');setSpeech('We should not leave our little friend behind!');return;}
    if(activeChapter===5&&!allFragmentsCollected()){message('Find both starlight fragments before the final star! ✨');setSpeech('I want to bring both little lights home.');return;}
    setMood('celebrate');renderMap();
    message(`Hooray! You guided Kristie in ${manualSteps} steps, cost ${manualCost}!`);
    addDiaryEntry(`Manual adventure: ${manualSteps} steps, cost ${manualCost}${manualClover?' · lucky clover 🍀':''}.`);
    const steps=manualSteps,cost=manualCost,found=manualClover;
    stopManualMode();
    completeChapter(steps,cost,'Manual',{collectedClover:found,windSurvived:manualWindSurvived,rabbitRescued:manualFriend,fragments:collectedStarlight.size});
  } else if(next!==old)message(`Exploring by yourself: ${manualSteps} steps, cost ${manualCost}. ${terrain[next]==='mud'?'Splash! The mud is heavy. 🌧️':'Keep going, Kristie! 🐾'}`);
  saveProgress();
}
function mapReferenceRoutes(){
  if(activeChapter!==2)return null;
  const result={};
  for(const name of ['bfs','dijkstra','astar']){
    const planned=planRoute(name);
    result[name]={steps:planned.path?planned.path.length-1:null,cost:pathCost(planned.path),explored:planned.order.length};
  }
  return result;
}
function starTextForChapter(chapter){
  const earned=progress.stars?.[chapter]||[];
  return [1,2,3].map(s=>earned.includes(s)?'⭐':'☆').join(' ');
}
function awardChapterTwoStars(steps,cost,label,extra){
  const earned=new Set(progress.stars[2]||[]);
  earned.add(1);
  const optimal=mapReferenceRoutes()?.dijkstra.cost;
  if(Number.isFinite(optimal)&&cost<=optimal+2)earned.add(2);
  if(extra?.collectedClover)earned.add(3);
  progress.stars[2]=[...earned].sort((a,b)=>a-b);
  if(!progress.routeRecords[2])progress.routeRecords[2]={};
  const key=label==='Manual'?'manual':label.toLowerCase()==='a*'?'astar':label.toLowerCase();
  const previous=progress.routeRecords[2][key];
  if(!previous||previous.signature!==routeSignature()||cost<previous.cost){
    progress.routeRecords[2][key]={steps,cost,signature:routeSignature()};
  }
  const reward=progress.stars[2].length;
  addDiaryEntry(`Muddy Meadow: ${starTextForChapter(2)} (${reward}/3 stars) earned across adventures.`);
}
function updateRouteComparison(){
  const panel=document.querySelector('#route-comparison');if(!panel)return;
  panel.hidden=activeChapter!==2;
  if(activeChapter!==2)return;
  const reveal=document.querySelector('#compare-reveal');
  reveal.setAttribute('aria-expanded',String(comparisonVisible));
  reveal.textContent=comparisonVisible?'Hide reference routes ▴':'Reveal algorithm routes ▾';
  document.querySelector('#comparison-table').hidden=!comparisonVisible;
  document.querySelector('#ch2-star-summary').textContent=`${starTextForChapter(2)}  ${progress.stars?.[2]?.length||0}/3 stars collected`;
  const rows=document.querySelector('#comparison-rows');rows.replaceChildren();
  if(!comparisonVisible)return;
  const refs=mapReferenceRoutes();
  const manual=progress.routeRecords?.[2]?.manual;
  for(const [key,title,desc] of [['manual','Your best walk','Your own adventure'],['bfs','BFS','Fewest steps'],['dijkstra','Dijkstra','Lowest cost'],['astar','A*','Lowest cost + heuristic']]){
    const data=key==='manual'?(manual?.signature===routeSignature()?manual:null):refs[key];
    const tr=document.createElement('tr');
    for(const value of [title,data?.steps??'—',data?.cost??'—']){
      const td=document.createElement('td');td.textContent=String(value);tr.appendChild(td);
    }
    tr.title=desc;rows.appendChild(tr);
  }
}
function renderChapterTwoJournal(){
  const card=document.querySelector('#journal-chapter-two');
  if(!card)return;
  card.hidden=!progress.hasStarted;
  document.querySelector('#journal-ch2-stars').textContent=starTextForChapter(2);
  const earned=progress.stars?.[2]||[];
  const best=progress.routeRecords?.[2]?.manual;
  document.querySelector('#journal-ch2-story').textContent=earned.length?`Kristie learned to choose the route that feels right. ${earned.length}/3 stars collected!`:'A rainy meadow, an old wooden bridge, and a choice still to come.';
  document.querySelector('#journal-ch2-path').textContent=best?`Best manual journey: ${best.steps} steps · cost ${best.cost}.`:'Try walking through Muddy Meadow and discover the lucky clover. 🍀';
}
function encourageKristie(tone){
  const lines={brave:'Even when the path is muddy, we can try one little step!',wise:'Let’s look beyond the shortest path and choose what feels right.'};
  setSpeech(lines[tone]||lines.brave);
  message(`A kind thought for Kristie: “${lines[tone]||lines.brave}” ♡`);
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
  if(manualMode)stopManualMode();
  const result=planRoute(kind);
  if(kind==='bfs'&&tutorialStep==='bfs')setTutorialStep('searching');
  animatePath(result,kind==='astar'?'A*':kind);
}));
trainButton.addEventListener('click',()=>{if(!busy){if(manualMode)stopManualMode();trainKristie();}});
learnedButton.addEventListener('click',()=>{if(!busy){if(manualMode)stopManualMode();showLearnedRoute();}});
resetButton.addEventListener('click',()=>{
  cancelRun();stopManualMode();initMap();clearLearning();clearVisualization();resetMetrics();renderMap();updateRouteComparison();
  setSpeech('A fresh beginning! Where should we go now?');
  message('The chapter garden is fresh again. Where shall Kristie go next? 🌷');
  addDiaryEntry('A new garden adventure begins.');
  if(tutorialStep==='searching'||tutorialStep==='walking-rl')setTutorialStep('bfs');
});
speedInput.addEventListener('input',()=>{
  const value=Number(speedInput.value);
  document.querySelector('#speed-label').textContent=value<30?'Slow':value>72?'Fast':'Medium';
});
// === Season One: chapter progression, safe local saves, menu and story pages ===
const STORE_KEY='little-steps-kristie-v03';
const LEGACY_STORE_KEY='little-steps-kristie-v02';
const screenNames=['menu','game','chapters','diary','settings','homebase'];
const defaultProgress=()=>({hasStarted:false,xp:0,completedChapters:[],chapterBest:{},stars:{},routeRecords:{},storySeen:{},chapter2StorySeen:false,activeChapter:1,lastPlayed:null});
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
// Corner counters intentionally derive from the same completed-chapter and star
// records used by Robot Diary, so existing V0.7 saves remain compatible with the finale.
function renderLittleGardenCorner(){
  const root=document.querySelector('#little-garden-corner');
  if(!root)return;
  let stars=0;
  for(let chapter=2;chapter<=5;chapter++){
    const earned=Array.isArray(progress.stars?.[chapter])?progress.stars[chapter]:[];
    stars+=new Set(earned.filter(n=>[1,2,3].includes(n))).size;
  }
  const clover=Array.isArray(progress.stars?.[2])&&progress.stars[2].includes(3)?1:0;
  const pages=new Set(progress.completedChapters.filter(n=>Number.isInteger(n)&&n>=1&&n<=5)).size;
  document.querySelector('#corner-stars').textContent=`${stars} / 12`;
  document.querySelector('#corner-clovers').textContent=`${clover} / 1`;
  document.querySelector('#corner-pages').textContent=`${pages} / 5`;
  const note=document.querySelector('#corner-progress-note');
  note.textContent=pages===5?'Season One complete ♡':`${pages} of 5 stories remembered`;
  const quotes={
    1:'“Every adventure begins with a little step.”',
    2:'“A longer path can still be the kinder choice.”',
    3:'“We can help each other find our way.”',
    4:'“When the wind changes, I can try again.”',
    5:'“The world is bigger than I ever imagined.”'
  };
  document.querySelector('#corner-message').textContent=quotes[activeChapter]||quotes[1];
  root.dataset.chapter=String(activeChapter);
}
function saveProgress(){
  if(!progress.hasStarted){renderLittleGardenCorner();return;}
  const state={...progress,activeChapter,terrain:[...terrain],start,goal,waypoint,windTriggered,
    qValues:trained?qValues:null,trained,
    trainingHistory:trained?trainingHistory:[],episodeCount:trained?episodeCount:0,
    diaryEvents:[...diaryEvents],speed:Number(speedInput.value),lastPlayed:new Date().toISOString()};
  try{localStorage.setItem(STORE_KEY,JSON.stringify(state));storageWorking=true;}
  catch(e){storageWorking=false;}
  updateMenuStatus();
  renderLittleGardenCorner();
}
function restoreFromSave(saved){
  if(!saved||!saved.hasStarted)return false;
  stopManualMode();
  const chapter=Number.isInteger(saved.activeChapter)&&saved.activeChapter>=1&&saved.activeChapter<=5?saved.activeChapter:1;
  activeChapter=chapter;
  initMap();
  const posOk=i=>Number.isInteger(i)&&i>=0&&i<WIDTH*HEIGHT;
  if(Array.isArray(saved.terrain)&&saved.terrain.length===WIDTH*HEIGHT&&posOk(saved.start)&&posOk(saved.goal)&&saved.start!==saved.goal){
    terrain=saved.terrain.map(t=>['grass','hedge','mud'].includes(t)?t:'grass');
    start=saved.start;goal=saved.goal;
    terrain[start]='grass';terrain[goal]='grass';
    if(waypoint!==null)terrain[waypoint]='grass';
    for(const i of fragmentPositions())terrain[i]='grass';
    windTriggered=!!saved.windTriggered;
  }
  clearVisualization();clearLearning();resetMetrics();
  const expected=WIDTH*HEIGHT*(waypoint===null?1:2)*(activeChapter===5?4:1);
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
  renderChapterHeader();syncSpeed();renderMap();drawChart();updateRouteComparison();
  setSpeech('Welcome back! Every little step still matters.');
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
  if(which!=='game'){cancelRun();closeFirstStory();if(tutorialStep!==null)stopTutorial();}
  closeFinish();
  screenNames.forEach(n=>document.getElementById(`${n}-screen`).hidden=n!==which);
  if(which==='chapters')renderChapters();
  if(which==='diary')renderJournal();
  if(which==='settings')syncSpeed();
  if(which==='menu')updateMenuStatus();
  if(which==='homebase' && typeof renderHomeBase==='function')renderHomeBase();
  window.scrollTo({top:0,behavior:'instant'});
}
// Illustrated story scenes for all five chapters; first-chapter tutorial stays independent.
const FIRST_STORY=[
  {title:'A little garden, a big world',text:'The morning sun warmed the leaves, and a little gate opened with a creak. For the first time, Kristie was ready to explore beyond her cottage.',quote:'“I wonder what is waiting out there...”'},
  {title:'Just one little step',text:'The paths looked unfamiliar. Kristie could see trees, winding trails and places she had never visited. Her heart-shaped light gave a tiny flicker.',quote:'“I’m a little nervous... but maybe I can find my way if I just take one little step!”'},
  {title:'The First Flower',text:'At the far end of the garden, a golden flower began to glow. There was no need to know every answer yet. Kristie only needed someone to help her begin.',quote:'“Will you explore the garden with me?”'}
];
const SECOND_STORY=[
  {title:'A little rain overnight',text:'Soft rain tapped on every leaf. By morning, the meadow was dotted with puddles, and the garden bridge was wet and gleaming.',quote:'“Good morning, meadow! Oh... my boots might get muddy today!”'},
  {title:'The muddy shortcut',text:'One path looked short and familiar, but it was covered in deep mud. A longer way curled past an old wooden bridge.',quote:'“Do you think the shortest way is always the best way?”'},
  {title:'A clever little choice',text:'Some journeys are not about rushing. Kristie could try walking herself, or compare what BFS, Dijkstra and A* discovered.',quote:'“Let’s try, learn, and find a wiser way together!”'}
];
const THIRD_STORY=[
  {title:'A village of little roofs',text:'Kristie followed a trail of mushrooms into a tiny village where every roof looked like a warm red umbrella.',quote:'“What a lovely place! But... who is crying near the path?”'},
  {title:'A friend who needs help',text:'Behind a fallen branch, a little rabbit had lost her way home. Her paws were trembling, and the mushroom cottage was far away.',quote:'“Hello, little bunny. You do not have to find your way alone.”'},
  {title:'Two hearts, one path',text:'Kristie promised to find the rabbit first, then guide her safely to the village cottage. Sometimes the best adventure is helping a friend.',quote:'“Let’s find our friend, then walk home together!”'}
];
const FOURTH_STORY=[
  {title:'The whispering trees',text:'The woods rustled softly. A little oil lamp twinkled far ahead, inviting Kristie down a mossy green path.',quote:'“I think I can find the lantern if I follow this path...”'},
  {title:'A sudden change',text:'A gust of wind moved the leaves and bent the branches. The familiar route was not quite the same anymore.',quote:'“Oh! What if the way I planned changes?”'},
  {title:'Another way forward',text:'Kristie learned that a changed plan does not mean a failed adventure. She could pause, look around, and find another path.',quote:'“Even when things change, I can take another little step.”'}
];
const FIFTH_STORY=[
  {title:'The night garden opens',text:'The last garden gate creaked beneath a silver moon. Two little fragments of starlight were waiting along the winding paths.',quote:'“The night is so big... and the stars look so far away.”'},
  {title:'Collect the little lights',text:'Kristie must gather both glowing fragments before reaching the final star. She remembered every lesson from her earlier adventures.',quote:'“I can be brave, thoughtful, kind, and ready to change.”'},
  {title:'Something beyond the clouds',text:'Across the distant horizon, beyond the starlit garden, a tiny island glimmered through the clouds. The world was wider than Kristie had imagined.',quote:'“Shall we find the last star together?”'}
];
const STORY_BY_CHAPTER={1:FIRST_STORY,2:SECOND_STORY,3:THIRD_STORY,4:FOURTH_STORY,5:FIFTH_STORY};
const storyPages=()=>STORY_BY_CHAPTER[activeChapter]||FIRST_STORY;
let storyIndex=0;
let storyIsReplay=false;
let storyIsOpen=false;
function showStoryPage(){
  const stories=storyPages();
  const item=stories[storyIndex];
  document.querySelector('#story-scene-toolbar-title').textContent=`✧ CHAPTER ${String(activeChapter).padStart(2,'0')} · ${chapterById(activeChapter).quality.toUpperCase()}`;
  storyOverlay.dataset.chapter=String(activeChapter);
  document.querySelector('#story-scene-title').textContent=item.title;
  document.querySelector('#story-scene-text').textContent=item.text;
  document.querySelector('#story-scene-quote').textContent=item.quote;
  document.querySelector('#story-scene-count').textContent=`PAGE ${storyIndex+1} OF ${stories.length}`;
  document.querySelector('#story-next').innerHTML=storyIndex===stories.length-1?'Begin the adventure <span>✦</span>':'Turn the page <span>›</span>';
  const dots=document.querySelector('#story-scene-dots');dots.replaceChildren();
  for(let i=0;i<stories.length;i++){
    const dot=document.createElement('span');dot.className='scene-dot'+(i===storyIndex?' active':'');dots.appendChild(dot);
  }
}
function openFirstStory(replay=false){
  storyIsReplay=replay;
  storyIndex=0;showStoryPage();storyOverlay.hidden=false;storyIsOpen=true;
  document.querySelector('#story-next').focus();
}
function closeFirstStory(){
  const wasOpen=storyIsOpen;
  storyIsOpen=false;
  storyOverlay.hidden=true;
  if(activeChapter===1)setSpeech('I’m a little nervous... but I think we can find the first flower together!');
  if(wasOpen&&activeChapter===2)setSpeech('My little boots are muddy! Do you think the shortest way is always best?');
  if(wasOpen&&activeChapter===3)setSpeech('First we find our bunny friend, then we walk home together. 🐇');
  if(wasOpen&&activeChapter===4)setSpeech('The wind may change things. I can find another path! 🍃');
  if(wasOpen&&activeChapter===5)setSpeech('Two star fragments, then the final star. We can do this! ✨');
  if(wasOpen&&!storyIsReplay&&activeChapter!==1){progress.storySeen[activeChapter]=true;if(activeChapter===2)progress.chapter2StorySeen=true;saveProgress();}
  if(wasOpen&&!storyIsReplay&&activeChapter===1&&!tutorialSeen&&!tutorialStep){
    startTutorial();
  }
  storyIsReplay=false;
}
function advanceFirstStory(){
  if(storyIndex<storyPages().length-1){storyIndex++;showStoryPage();}
  else closeFirstStory();
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
  document.querySelector('#ch2-tips').hidden=activeChapter!==2;
  document.querySelector('#route-comparison').hidden=activeChapter!==2;
  document.querySelector('#garden').setAttribute('aria-label',`Garden map, ${WIDTH} columns by ${HEIGHT} rows; ${activeChapter===2?'rainy meadow':'storybook chapter'}`);
  windButton.textContent=windTriggered?'🍃 The wind settles (restore hedges)':'🍃 The wind rearranges the woods';
  document.querySelector('#replay-story').hidden=false;
  document.querySelector('#chapter-special-panel').hidden=activeChapter<3;
  renderSpecialChapterPanel();
  document.querySelector('#tutorial-open').hidden=activeChapter!==1;
  document.querySelector('#game-screen').dataset.chapter=String(activeChapter);
  document.querySelector('#legend-goal').textContent=ch.goalIcon;
  document.querySelector('#legend-goal-name').textContent=activeChapter===5?'Final star':activeChapter===3?'Cottage':activeChapter===2?'Rainbow':'Goal';
  document.querySelector('#goal-tool').textContent=`${ch.goalIcon} Destination`;
  renderLittleGardenCorner();
}
function openChapter(number){
  if(!Number.isInteger(number)||number<1||number>5)return;
  if(number>1&&!progress.completedChapters.includes(number-1))return;
  if(tutorialStep!==null)stopTutorial();
  cancelRun();activeChapter=number;progress.hasStarted=true;progress.activeChapter=number;
  stopManualMode();initMap();clearLearning();clearVisualization();resetMetrics();
  comparisonVisible=false;updateRouteComparison();
  renderMap();renderChapterHeader();
  setSpeech(number===1?'Hello! I wonder where this new path will lead...':`A new place! ${chapterById(number).quality} grows with every adventure.`);
  message(`Chapter ${number} — ${chapterById(number).title}. ${chapterById(number).task}`);
  addDiaryEntry(`A new page opens: Chapter ${number} — ${chapterById(number).title}.`);
  saveProgress();showScreen('game');
  if(number>1&&!progress.storySeen[number])openFirstStory();
}
function newAdventure(){
  progress=defaultProgress();diaryEvents.splice(0);
  openChapter(1);openFirstStory();
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
  if(activeChapter===2)awardChapterTwoStars(steps,cost,label,arguments[3]);
  if(activeChapter>=3)awardLaterChapterStars(steps,cost,label,arguments[3]);
  const previous=progress.chapterBest[activeChapter]||{};
  progress.chapterBest[activeChapter]={steps:Number.isInteger(previous.steps)?Math.min(previous.steps,steps):steps,
    cost:Number.isInteger(previous.cost)?Math.min(previous.cost,cost):cost};
  addDiaryEntry(`Chapter ${activeChapter}: ${chapter.title} complete via ${label}. ${steps} steps, cost ${cost}${isNew?' · +50 XP ✨':''}`);
  setSpeech(activeChapter===1?'We really did it! I feel a little braver now!':activeChapter===5?'That island... I wonder what lies beyond the garden.':`I did it! I learned a little more about ${chapter.quality.toLowerCase()}.`);
  message(`Chapter ${activeChapter} complete! ${chapter.quality} grows with every step. ${isNew?'+50 XP ✨':'♡'}`);
  renderSpecialChapterPanel();
  if(activeChapter===1&&tutorialStep==='searching'&&label==='bfs')setTutorialStep('celebrate');
  else if(activeChapter===1&&tutorialStep==='walking-rl'&&label==='Q-Learning')setTutorialStep('rl-success');
  comparisonVisible=true;updateRouteComparison();saveProgress();showChapterFinish(isNew);
}
function showChapterFinish(newlyComplete){
  const ch=chapterById(activeChapter);
  document.querySelector('#finish-illustration').textContent=activeChapter===5?'🌙 ✨ 🏝️':ch.icon;
  document.querySelector('#finish-kicker').textContent=activeChapter===5?'THE END OF A FIRST ADVENTURE':'A LITTLE STEP FORWARD';
  document.querySelector('#finish-title').textContent=activeChapter===5?'A sky full of possibilities':'Chapter '+activeChapter+' complete!';
  document.querySelector('#finish-description').textContent=ch.win;
  const quote=document.querySelector('#finish-quote');
  quote.hidden=activeChapter!==5;
  document.querySelector('#season-one-epilogue').hidden=activeChapter!==5;
  quote.textContent='“The world is bigger than I ever imagined.”';
  document.querySelector('#finish-stars').hidden=activeChapter===1;
  document.querySelector('#finish-stars').textContent=activeChapter===2?`Muddy Meadow: ${starTextForChapter(2)} · ⭐ Reach · ⭐ Wise route · ⭐ Lucky clover`:
    activeChapter>=3?`${ch.title}: ${starTextForChapter(activeChapter)} · ${chapterStarGoalText(activeChapter)}`:'';
  document.querySelector('#finish-reward').textContent=activeChapter===5
    ?`✦ Season One complete! ${newlyComplete?'+50 XP · ':''}Beyond the Garden awaits someday.`
    :newlyComplete?'✦ +50 XP · The next chapter is now unlocked':'✦ A familiar adventure, a little wiser this time';
  const next=document.querySelector('#finish-next');
  next.hidden=activeChapter===5;
  if(activeChapter<5)next.textContent=`Chapter ${activeChapter+1} · ${chapterById(activeChapter+1).title} ›`;
  document.querySelector('#finish-practice').hidden=tutorialStep!=='celebrate';
  document.querySelector('#finish-tutorial-end').hidden=tutorialStep!=='rl-success';
  document.querySelector('#tutorial-finish-note').hidden=!['celebrate','rl-success'].includes(tutorialStep);
  document.querySelector('#tutorial-finish-note').textContent=tutorialStep==='rl-success'
    ?'♡ You found a route, and you helped Kristie learn one too. That is what a first adventure is all about!'
    :'✧ Wonderful! You guided Kristie with BFS. Shall we let her practise finding her own way with Q-Learning?';
  finishOverlay.hidden=false;
  // CSS victory animation begins when the overlay becomes visible.
  document.querySelector('#finish-chapters').focus();
}
function closeFinish(){finishOverlay.hidden=true;}
function renderJournal(){
  document.querySelector('#journal-xp').textContent=String(progress.xp||0);
  document.querySelector('#journal-best').textContent=progress.chapterBest[activeChapter]?.steps??'—';
  document.querySelector('#journal-episodes').textContent=episodeCount;
  const done=progress.completedChapters.length;
  renderChapterTwoJournal();renderSeasonOneDiary();renderLittleGardenCorner();
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
function applyWind(next,announce=true){
  if(activeChapter!==4)return;
  const tiles=chapterById(4).windTiles;
  for(const [r,c] of tiles){
    const idx=idOf(r,c);
    if(idx!==start&&idx!==goal&&idx!==waypoint&&idx!==robot)terrain[idx]=next?'hedge':'grass';
  }
  windTriggered=next;
  visitedVisual.clear();pathVisual.clear();
  clearLearning();resetMetrics();renderMap();renderChapterHeader();
  if(announce){
    message(next?'A strong breeze rearranged the woods! Can you find another path? 🍃':'The wind quieted and the woodland paths opened again. 🍃');
    setSpeech(next?'The old route changed! That’s okay — I can adapt. 🍃':'I found my courage in this changing forest.');
    addDiaryEntry(next?'Whispering Woods: wind changed the route — a chance to replan.':'Whispering Woods: the paths settled.');
  }
  saveProgress();
}
function shiftWind(){
  if(activeChapter!==4||busy)return;
  applyWind(!windTriggered);
}
function chapterStarGoalText(id){
  return id===3?'⭐ Cottage · ⭐ Safe rescue · ⭐ Helpful walk':
   id===4?'⭐ Lantern · ⭐ Weathered wind · ⭐ New route':
   id===5?'⭐ Final star · ⭐ Two fragments · ⭐ Explore by yourself':'';
}
function awardLaterChapterStars(steps,cost,label,extra={}){
  const earned=new Set(progress.stars[activeChapter]||[]);
  earned.add(1);
  if(activeChapter===3){if(rabbitFound||extra?.rabbitRescued)earned.add(2);if(label==='Manual')earned.add(3);}
  if(activeChapter===4){if(windTriggered||extra?.windSurvived)earned.add(2);if(label==='Manual'&&extra?.windSurvived)earned.add(3);}
  if(activeChapter===5){if(allFragmentsCollected()||extra?.fragments===2)earned.add(2);if(label==='Manual')earned.add(3);}
  progress.stars[activeChapter]=[...earned].sort((a,b)=>a-b);
}
function renderSpecialChapterPanel(){
  const panel=document.querySelector('#chapter-special-panel');
  if(!panel||activeChapter<3)return;
  const kicker=document.querySelector('#special-kicker');
  const heading=document.querySelector('#special-heading');
  const description=document.querySelector('#special-description');
  const progressEl=document.querySelector('#special-progress');
  if(activeChapter===3){
    kicker.textContent='🍄 A LITTLE ACT OF KINDNESS';heading.textContent='Find the Lost Bunny';
    description.textContent='Find 🐇 before reaching the cottage 🏡. The bunny will follow Kristie home!';
    progressEl.textContent=rabbitFound||manualFriend?'🐇 Bunny found — head home!':'🐇 Bunny waiting for help';
  }else if(activeChapter===4){
    kicker.textContent='🌲 THINGS CAN CHANGE';heading.textContent='The Windy Woods';
    description.textContent='After four manual steps, the wind shifts the hedges. Or press the wind button to change them first, then compare the new route.';
    progressEl.textContent=windTriggered?'🍃 The wind has changed the paths':'🍃 Listen to the leaves';
  }else{
    kicker.textContent='🌙 THE LAST LITTLE JOURNEY';heading.textContent='Collect the Starlight';
    description.textContent='Gather ✨ at both locations before reaching ⭐. Find the two lights yourself, or watch an algorithm plan through both.';
    progressEl.textContent=`✨ ${collectedStarlight.size} / 2 starlight fragments found`;
  }
  document.querySelector('#special-stars').textContent=`${starTextForChapter(activeChapter)} · ${progress.stars?.[activeChapter]?.length||0}/3 stars collected`;
}
function renderSeasonOneDiary(){
  const container=document.querySelector('#journal-later-pages');
  if(!container)return;
  container.replaceChildren();
  const lessons={3:'Kindness means helping a friend find their way.',4:'A changed plan is still a path forward.',5:'The world is bigger than I ever imagined.'};
  for(const chapter of CHAPTERS.slice(2)){
    const card=document.createElement('article');card.className='journal-card journey-page';
    const title=document.createElement('h2');title.textContent=`${chapter.icon} Chapter ${chapter.id} · ${chapter.title}`;
    const overline=document.createElement('span');overline.className='kicker';overline.textContent=chapter.quality.toUpperCase();
    const story=document.createElement('p');story.textContent=progress.completedChapters.includes(chapter.id)?lessons[chapter.id]:chapter.intro;
    const detail=document.createElement('p');detail.className='journal-lesson';
    const best=progress.chapterBest[chapter.id];
    detail.textContent=best?`${starTextForChapter(chapter.id)} · Best ${best.steps} steps · lowest cost ${best.cost}`:'☆ ☆ ☆ · A chapter waiting for Kristie.';
    card.append(overline,title,story,detail);container.append(card);
  }
}

// === v0.5: gentle, optional, action-aware first chapter guide ===
// Tutorial completion lives under its own key to preserve all v0.3/v0.4 game saves.
const TUTORIAL_KEY='little-steps-tutorial-v05';
let tutorialSeen=false;
try{tutorialSeen=localStorage.getItem(TUTORIAL_KEY)!==null;}catch(e){}
const tutorialPanel=document.querySelector('#tutorial-panel');
const tutorialCounter=document.querySelector('#tutorial-counter');
const tutorialTitle=document.querySelector('#tutorial-title');
const tutorialText=document.querySelector('#tutorial-text');
const tutorialHint=document.querySelector('#tutorial-hint');
const tutorialAdvance=document.querySelector('#tutorial-advance');
const TUTORIAL_STEPS={
  meet:{step:'1 / 6',title:'Hello! I’m Kristie ♡',text:'See my little blue face and pink scarf in the garden? That’s me! I’m ready to take my very first step.',hint:'Look at the glowing square with Kristie near the bottom-left.',next:'flower'},
  flower:{step:'2 / 6',title:'Let’s find the first flower 🌼',text:'The golden flower near the top-right is our goal. Hedges block the way, while muddy paths take more effort.',hint:'Look for the yellow square at the other end of the garden.',next:'bfs'},
  bfs:{step:'3 / 6',title:'Could you show me a path?',text:'BFS explores nearby squares step by step. It finds a path with the fewest moves, even if that is not the least muddy route.',hint:'Click the green BFS button in the Explorer Kit →'},
  searching:{step:'4 / 6',title:'Look, the garden is unfolding!',text:'Pale blue squares show where BFS has looked. Golden squares show the route. Then watch Kristie hop along it!',hint:'Watch the search and walk finish. No clicks needed.'},
  celebrate:{step:'4 / 6',title:'We found the first flower!',text:'You did it! Your first completion also earns 50 XP and unlocks Chapter 2. The next lesson is optional.',hint:'Select Practice Q-Learning on the celebration card.'},
  train:{step:'5 / 6',title:'Now I want to try on my own 🌱',text:'BFS knew the garden map. With Q-Learning, I practise many attempts and learn which actions tend to work.',hint:'Click Train Kristie. It runs simulated practice episodes.'},
  trained:{step:'6 / 6',title:'I have been practising!',text:'Look at the learning curve and recent success rate. Now let’s see whether I learned a complete path!',hint:'Click Show Learned Route (or train again if I get stuck).'},
  'walking-rl':{step:'6 / 6',title:'These steps are my own!',text:'This time I am following the decisions I learned through trial and error.',hint:'Watch Kristie finish the learned route.'},
  'rl-success':{step:'6 / 6',title:'We learned together!',text:'You planned a path and helped me learn one. Every little step counts.',hint:'Select Finish my little guide on the celebration card.'},
  done:{step:'6 / 6',title:'Our adventure is just beginning ✨',text:'You’ve learned to guide Kristie with BFS and let her practise with Q-Learning. There are four more gardens to explore!',hint:'You can revisit this guide any time using How to Play.',next:'finish'}
};
let tutorialStep=null;
function saveTutorialSeen(){
  tutorialSeen=true;
  try{localStorage.setItem(TUTORIAL_KEY,'seen');}catch(e){}
}
function renderTutorial(){
  const active=tutorialStep!==null&&activeChapter===1;
  const modalStep=['celebrate','rl-success'].includes(tutorialStep);
  tutorialPanel.hidden=!active||modalStep;
  const screen=document.querySelector('#game-screen');
  if(!active){delete screen.dataset.tutorialStep;return;}
  screen.dataset.tutorialStep=tutorialStep;
  if(modalStep)return;
  const item=TUTORIAL_STEPS[tutorialStep];
  tutorialCounter.textContent=`STEP ${item.step}`;
  tutorialTitle.textContent=item.title;
  tutorialText.textContent=item.text;
  tutorialHint.textContent=item.hint;
  tutorialAdvance.hidden=!item.next;
  tutorialPanel.dataset.waiting=String(!item.next);
  if(item.next)tutorialAdvance.textContent=item.next==='finish'?'Finish tutorial ›':'Next step ›';
}
function setTutorialStep(step){
  if(!TUTORIAL_STEPS[step])return;
  tutorialStep=step;
  renderTutorial();
  if(!['searching','walking-rl','celebrate','rl-success'].includes(step)){
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>{
      if(tutorialStep!==step||tutorialPanel.hidden)return;
      const targets={meet:'.garden-cell.robot-here',flower:'.garden-cell.goal',
        bfs:'.algorithm[data-algorithm="bfs"]',train:'#train',trained:'#learned'};
      const target=document.querySelector(targets[step]||'#tutorial-panel');
      if(target)target.scrollIntoView({block:'center',behavior:'smooth'});
    });
  }
}
function startTutorial(){
  if(activeChapter!==1||busy)return;
  closeFinish();
  saveTutorialSeen();
  setTutorialStep('meet');
  setSpeech('Hello! Let’s learn this little garden together, one step at a time!');
}
function stopTutorial(){
  tutorialStep=null;
  renderTutorial();
}
function openTutorialFromMenu(){
  if(busy)return;
  if(!progress.hasStarted){
    openChapter(1);
  }else if(activeChapter!==1){
    // Only switch chapters on explicit request; current progress stays saved.
    if(!window.confirm('Visit Chapter 1 for the guide? Your saved chapter progress will be kept.'))return;
    openChapter(1);
  }else{
    continueAdventure();
  }
  startTutorial();
}
function practiceAfterVictory(){
  if(tutorialStep!=='celebrate')return;
  closeFinish();clearVisualization();resetMetrics();renderMap();
  setSpeech('Could I learn this path through practice? I’d love to try!');
  setTutorialStep('train');
}
function wrapUpTutorial(){
  if(tutorialStep!=='rl-success')return;
  closeFinish();
  setTutorialStep('done');
  setSpeech('Thank you for believing in me! Every little step helps me grow. ♡');
}
document.querySelector('#tutorial-skip').addEventListener('click',stopTutorial);
document.querySelector('#tutorial-advance').addEventListener('click',()=>{
  if(tutorialStep===null)return;
  const next=TUTORIAL_STEPS[tutorialStep]?.next;
  if(next==='finish'){
    saveTutorialSeen();stopTutorial();setSpeech('All done! Shall we explore another chapter?');
  }else if(next)setTutorialStep(next);
});
document.querySelector('#tutorial-open').addEventListener('click',startTutorial);
document.querySelector('#tutorial-menu').addEventListener('click',openTutorialFromMenu);
document.querySelector('#finish-practice').addEventListener('click',practiceAfterVictory);
document.querySelector('#finish-tutorial-end').addEventListener('click',wrapUpTutorial);

// Events: menu, chapter progression, settings and the story finale.
document.querySelector('#new-game').addEventListener('click',newAdventure);
document.querySelector('#continue-game').addEventListener('click',continueAdventure);
document.querySelector('#journal-play').addEventListener('click',()=>progress.hasStarted?continueAdventure():newAdventure());
document.querySelector('#builder-entry').addEventListener('click',()=>showScreen('homebase'));
document.querySelector('#back-to-menu').addEventListener('click',()=>showScreen('menu'));
document.querySelector('#story-back-chapters').addEventListener('click',()=>showScreen('chapters'));
document.querySelectorAll('[data-open-screen]').forEach(btn=>btn.addEventListener('click',()=>showScreen(btn.dataset.openScreen)));
document.querySelector('#finish-chapters').addEventListener('click',()=>showScreen('chapters'));
document.querySelector('#finish-next').addEventListener('click',()=>openChapter(activeChapter+1));
document.querySelector('#replay-story').addEventListener('click',()=>openFirstStory(true));
document.querySelector('#story-skip').addEventListener('click',closeFirstStory);
document.querySelector('#story-next').addEventListener('click',advanceFirstStory);
windButton.addEventListener('click',shiftWind);
document.querySelector('#menu-speed').addEventListener('input',e=>{speedInput.value=e.target.value;syncSpeed();saveProgress();});
speedInput.addEventListener('change',()=>{syncSpeed();saveProgress();});
document.querySelector('#erase-save').addEventListener('click',()=>{
  if(!window.confirm('Erase Kristie’s saved adventure on this browser? This cannot be undone.'))return;
  try{localStorage.removeItem(STORE_KEY);localStorage.removeItem(LEGACY_STORE_KEY);localStorage.removeItem(TUTORIAL_KEY);localStorage.removeItem('little-steps-home-v11');tutorialSeen=false;
    if(typeof resetHomeBase==='function')resetHomeBase(false);}catch(e){storageWorking=false;}
  progress=defaultProgress();activeChapter=1;
  cancelRun();initMap();clearLearning();clearVisualization();resetMetrics();renderMap();
  diaryEvents.splice(0);renderDiaryEvents();renderChapterHeader();updateMenuStatus();showScreen('menu');
});

// GitHub upload safeguard: if assets/ was accidentally flattened to the repo root,
// retry the existing root image. The preferred upload layout is still assets/*.
document.querySelectorAll('img[src^="assets/"]').forEach(img=>{
  img.addEventListener('error',()=>{
    if(img.dataset.rootFallback)return;
    img.dataset.rootFallback='1';
    img.src=img.getAttribute('src').split('/').pop();
  });
});

document.querySelector('#manual-toggle').addEventListener('click',()=>manualMode?stopManualMode():startManualMode());
document.querySelectorAll('[data-move]').forEach(b=>b.addEventListener('click',()=>walkManually(Number(b.dataset.move))));
window.addEventListener('keydown',e=>{
  if(!manualMode||busy||storyIsOpen||!finishOverlay.hidden||document.querySelector('#game-screen').hidden)return;
  const tag=e.target?.tagName?.toLowerCase();
  if(tag==='input'||tag==='textarea'||tag==='select'||e.ctrlKey||e.metaKey||e.altKey)return;
  const key={'arrowup':0,'w':0,'arrowright':1,'d':1,'arrowdown':2,'s':2,'arrowleft':3,'a':3}[e.key.toLowerCase()];
  if(key===undefined)return;
  e.preventDefault();walkManually(key);
});
document.querySelector('#compare-reveal').addEventListener('click',()=>{comparisonVisible=!comparisonVisible;updateRouteComparison();});
document.querySelectorAll('[data-encourage]').forEach(b=>b.addEventListener('click',()=>encourageKristie(b.dataset.encourage)));

// Bootstrap. Migrate older V0.2 progress where available.
initMap();
const stored=readProgress();
if(stored?.hasStarted){
  const chapters=Array.isArray(stored.completedChapters)?stored.completedChapters.filter(x=>Number.isInteger(x)&&x>=1&&x<=5):[];
  const best=stored.chapterBest&&typeof stored.chapterBest==='object'&&!Array.isArray(stored.chapterBest)?stored.chapterBest:{};
  progress={...defaultProgress(),hasStarted:true,xp:Number(stored.xp)||0,
    completedChapters:[...new Set(chapters)].sort((a,b)=>a-b),chapterBest:best,
    stars:stored.stars&&typeof stored.stars==='object'&&!Array.isArray(stored.stars)?stored.stars:{},
    routeRecords:stored.routeRecords&&typeof stored.routeRecords==='object'&&!Array.isArray(stored.routeRecords)?stored.routeRecords:{},
    storySeen:{...(stored.storySeen&&typeof stored.storySeen==='object'?stored.storySeen:{}),...(stored.chapter2StorySeen?{2:true}:{})},chapter2StorySeen:!!stored.chapter2StorySeen,
    activeChapter:Number.isInteger(stored.activeChapter)?stored.activeChapter:1,lastPlayed:stored.lastPlayed||null};
  if(!restoreFromSave(stored))progress=defaultProgress();
}
renderChapterHeader();renderMap();drawChart();renderDiaryEvents();syncSpeed();updateMenuStatus();refreshManualControls();updateRouteComparison();showScreen('menu');
