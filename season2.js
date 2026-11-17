/* Little Steps — Season Two · Lantern Bay interactive interface.
   Actual Q-learning/SARSA, learned policies and training metrics, not animated stand-ins. */
(function(){
  'use strict';
  const E=window.SeasonTwoEngine;
  if(!E)return;
  const KEY='little-steps-season-two-lab-v01'; // Keep Alpha1 saves compatible
  const $=id=>document.getElementById(id);
  const methods=['qlearning','sarsa'];
  function freshModel(seed=42){return {q:E.emptyQ(),history:[],episodes:0,seed,rngState:seed>>>0};}
  const state={models:{qlearning:freshModel(),sarsa:freshModel()},method:'qlearning',manual:false,boat:E.START,manualPath:[E.START],manualSteps:0,manualCost:0,selected:E.START,route:null,showPolicy:false,chartMetric:'success',storyIndex:0,storyOpen:false,storyReturnFocus:null};
  function active(){return state.models[state.method];}
  function number(n){return Number.isFinite(n)?Number(n.toFixed(2)):0;}
  function save(){
    try{
      localStorage.setItem(KEY,JSON.stringify({version:1,method:state.method,models:state.models}));
    }catch(_){/* file and private-browsing storage may be unavailable */}
  }
  function load(){
    try{
      const raw=JSON.parse(localStorage.getItem(KEY)||'null');
      if(!raw||raw.version!==1)return;
      for(const method of methods){
        const item=raw.models?.[method];
        if(!item||!Array.isArray(item.q)||item.q.length!==E.STATE_COUNT)return;
        if(!item.q.every(row=>Array.isArray(row)&&row.length===4&&row.every(Number.isFinite)))return;
        if(!Array.isArray(item.history))return;
        state.models[method]={q:item.q,history:item.history.slice(-2400),episodes:Number.isSafeInteger(item.episodes)&&item.episodes>=0?item.episodes:0,seed:Number.isSafeInteger(item.seed)?item.seed:42,rngState:Number.isSafeInteger(item.rngState)?item.rngState:42};
      }
      if(methods.includes(raw.method))state.method=raw.method;
    }catch(_){/* malformed saves are ignored, never touch Season One saves */}
  }
  const STORY_PAGES=[
    {
      title:'A letter by the sea',
      text:'After the Starlight Garden, Kristie returned to her cottage. One morning, a folded map appeared beside the garden gate. It showed five little islands—and a harbor with a boat just her size.',
      quote:'“I know the paths in my garden. But I’ve never sailed across the sea!”',
      art:'assets/s2-story-harbour.webp',label:'The little harbour',alt:'Watercolor storybook illustration of Kristie with her sea map at a flower-lined harbor beside her little sailboat.'
    },
    {
      title:'Not every wave is gentle',
      text:'The water looked calm at first, but rocky reefs blocked some passages. Shallows slowed her down, and an eastward current could carry the boat farther than expected. There was no single obvious route.',
      quote:'“What if I choose the wrong way? I suppose I could try again...”',
      art:'assets/s2-story-currents.webp',label:'Currents and reefs',alt:'Watercolor storybook illustration of Kristie steering a wooden sailboat through choppy sea currents and rocky reefs.'
    },
    {
      title:'Learning the way to Lantern Bay',
      text:'A lighthouse blinked on the horizon. Kristie could steer the boat herself—or practice again and again, learning which choices lead to a better outcome. One small voyage could become a thousand lessons.',
      quote:'“Maybe I don’t need to know everything yet. Let me learn by trying!”',
      art:'assets/s2-story-lighthouse.webp',label:'The first lighthouse',alt:'Watercolor storybook illustration of Kristie sailing safely toward a warm lighthouse on a flower-covered island.'
    }
  ];
  function showStoryPage(){
    const i=state.storyIndex;
    const page=STORY_PAGES[i];
    $('s2-story-title').textContent=page.title;
    $('s2-story-text').textContent=page.text;
    $('s2-story-quote').textContent=page.quote;
    $('s2-story-counter').textContent=`Page ${i+1} of ${STORY_PAGES.length}`;
    $('s2-story-art').src=page.art;
    $('s2-story-art').alt=page.alt;
    $('s2-story-image-label').textContent=page.label;
    $('s2-story-prev').disabled=i===0;
    $('s2-story-next').textContent=i===STORY_PAGES.length-1?'Begin the voyage →':'Turn the page →';
    $('s2-story-dots').replaceChildren(...STORY_PAGES.map((_,k)=>{
      const dot=document.createElement('span');dot.className=k===i?'is-current':'';return dot;
    }));
    $('s2-story-dots').setAttribute('aria-label',`Story page ${i+1} of ${STORY_PAGES.length}`);
  }
  function openStory(event){
    state.storyIndex=0;
    state.storyOpen=true;
    state.storyReturnFocus=(event?.currentTarget instanceof HTMLElement)?event.currentTarget:null;
    $('s2-story').hidden=false;
    showStoryPage();
    document.body.classList.add('s2-story-is-open');
    $('s2-story-next').focus();
  }
  function closeStory(goToLab=true){
    if(!state.storyOpen)return;
    state.storyOpen=false;
    $('s2-story').hidden=true;
    document.body.classList.remove('s2-story-is-open');
    if(goToLab){
      const lab=$('s2-lab');
      lab.scrollIntoView({behavior:'instant',block:'start'});
      $('s2-manual').focus({preventScroll:true});
    }else if(state.storyReturnFocus?.isConnected){state.storyReturnFocus.focus({preventScroll:true});}
    state.storyReturnFocus=null;
  }
  function nextStory(){
    if(state.storyIndex<STORY_PAGES.length-1){state.storyIndex++;showStoryPage();}
    else closeStory();
  }
  function prevStory(){if(state.storyIndex>0){state.storyIndex--;showStoryPage();}}
  const terrainNames={'.':'Calm water','S':'Starting harbor','G':'The lighthouse','#':'Reef','~':'Rough sea','^':'Shallow water','>':'Eastward current'};
  const directionSymbols=['↑','→','↓','←'];
  const directionClasses={'.':'water','S':'dock','G':'goal','#':'reef','~':'rough','^':'shallow','>':'current'};
  function setStatus(message){$('s2-status').textContent=message;}
  function info(message){$('s2-console-help').textContent=message;}
  function drawGrid(){
    const board=$('s2-board');
    if(!board)return;
    const fragment=document.createDocumentFragment();
    const trace=new Set((state.route?.visits||[]).slice(1));
    const manuallyVisited=new Set(state.manualPath);
    const model=active();
    for(let s=0;s<E.STATE_COUNT;s++){
      const t=E.tile(s),cell=document.createElement('button');
      const [r,c]=E.rc(s);
      cell.type='button';
      cell.className=`s2-cell s2-${directionClasses[t]||'water'}`;
      if(state.route && trace.has(s))cell.classList.add('s2-route');
      if(state.manual && manuallyVisited.has(s))cell.classList.add('s2-visited');
      if(state.selected===s)cell.classList.add('s2-selected');
      cell.dataset.s2Cell=String(s);
      cell.setAttribute('role','gridcell');
      cell.setAttribute('aria-label',`Row ${r+1}, column ${c+1}. ${terrainNames[t]}. ${s===state.boat&&state.manual?'Boat here. ':''}`);
      cell.addEventListener('click',()=>{state.selected=s;drawGrid();renderInspector();});
      if(s===E.GOAL){const light=document.createElement('span');light.className='s2-lighthouse';light.setAttribute('aria-hidden','true');cell.append(light);}
      if((state.manual?state.boat:E.START)===s){const boat=document.createElement('span');boat.className='s2-boat';boat.setAttribute('aria-hidden','true');cell.append(boat);}
      if(state.showPolicy&&t!=='#'&&t!=='G'){
        const q=model.q[s];
        if(q.some(v=>Math.abs(v)>1e-8)){
          const arrow=document.createElement('span');arrow.className='s2-policy-arrow';
          arrow.textContent=directionSymbols[E.bestAction(model.q,s,()=>0.15)];
          arrow.setAttribute('aria-hidden','true');cell.append(arrow);
        }
      }
      fragment.append(cell);
    }
    board.replaceChildren(fragment);
    board.setAttribute('aria-rowcount',String(E.HEIGHT));board.setAttribute('aria-colcount',String(E.WIDTH));
  }
  function renderInspector(){
    const [r,c]=E.rc(state.selected);
    const t=E.tile(state.selected);
    $('s2-selected').textContent=`Row ${r+1}, column ${c+1} · ${terrainNames[t]}`;
    const values=active().q[state.selected];
    const min=Math.min(...values),max=Math.max(...values);
    const den=Math.max(1e-6,max-min);
    const best=Math.max(...values);
    $('s2-q-values').replaceChildren(...E.ACTIONS.map((d,i)=>{
      const div=document.createElement('div');
      const label=document.createElement('span');label.textContent=`${directionSymbols[i]} ${d}`;
      const score=document.createElement('strong');score.textContent=values[i].toFixed(2);
      const track=document.createElement('i');track.className='s2-q-track';
      const fill=document.createElement('span');fill.style.width=`${Math.round(8+92*(max===min?0:(values[i]-min)/den))}%`;
      track.append(fill);div.append(label,score,track);
      if(Math.abs(values[i]-best)<1e-9&&values.some(v=>Math.abs(v)>1e-8))div.classList.add('s2-q-best');
      return div;
    }));
  }
  function chart(){
    const svg=$('s2-chart'),NS='http://www.w3.org/2000/svg';svg.replaceChildren();
    const add=(tag,attrs,text)=>{const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;svg.append(el);return el;};
    const rows=active().history;
    const isSuccess=state.chartMetric==='success';
    const buckets=[];
    for(let i=0;i<rows.length;i+=20){
      const group=rows.slice(i,i+20);
      buckets.push(isSuccess?group.filter(item=>item.success).length/group.length*100:group.reduce((a,item)=>a+item.returnValue,0)/group.length);
    }
    const yTop=13,yBottom=141;
    let low=0,high=100;
    if(!isSuccess&&buckets.length){
      low=Math.floor((Math.min(...buckets,0)-5)/10)*10;
      high=Math.ceil((Math.max(...buckets,0)+5)/10)*10;
      if(high===low)high=low+10;
    }
    const py=v=>yBottom-(v-low)/(high-low)*(yBottom-yTop);
    const tick=v=>isSuccess?`${Math.round(v)}%`:Number(v.toFixed(0)).toString();
    for(let i=0;i<=4;i++){
      const val=high-i*(high-low)/4;
      const pos=py(val);
      add('line',{x1:52,x2:500,y1:pos,y2:pos,stroke:'#dbe5df','stroke-width':1});
      add('text',{x:45,y:pos+4,'text-anchor':'end',fill:'#79908a','font-size':12},tick(val));
    }
    if(!buckets.length){
      add('text',{x:279,y:85,'text-anchor':'middle',fill:'#8ea5a0','font-size':13},'Train Kristie to reveal her real learning curve');
      svg.setAttribute('aria-label','No training episodes yet');return;
    }
    const px=i=>buckets.length===1?278:52+i*448/(buckets.length-1);
    add('polyline',{points:buckets.map((v,i)=>`${px(i)},${py(v)}`).join(' '),fill:'none',stroke:isSuccess?'#528a87':'#bd8e76','stroke-width':3,'stroke-linejoin':'round','stroke-linecap':'round'});
    add('circle',{cx:px(buckets.length-1),cy:py(buckets.at(-1)),r:5,fill:isSuccess?'#639d97':'#c79177',stroke:'#fffdf7','stroke-width':2});
    add('text',{x:52,y:160,fill:'#7a918c','font-size':11},'Start');
    add('text',{x:500,y:160,'text-anchor':'end',fill:'#7a918c','font-size':11},`${active().episodes} episodes`);
    svg.setAttribute('aria-label',`${isSuccess?'Training success percentage':'Mean training reward'} across ${buckets.length} batches, last batch ${buckets.at(-1).toFixed(1)}${isSuccess?' percent':''}`);
  }
  function switchChart(metric){
    if(!['success','reward'].includes(metric))return;
    state.chartMetric=metric;
    for(const [id,type] of [['s2-chart-success','success'],['s2-chart-reward','reward']]){
      const btn=$(id);btn.classList.toggle('is-current',type===metric);btn.setAttribute('aria-pressed',String(type===metric));
    }
    $('s2-chart-caption').textContent=metric==='success'?'Training success rate · 20-episode batches':'Mean training reward · 20-episode batches (higher is better)';
    chart();
  }
  function renderStats(){
    const model=active();
    $('s2-seed').value=String(model.seed);
    $('s2-episodes').textContent=String(model.episodes);
    const tail=model.history.slice(-50);
    $('s2-winrate').textContent=tail.length?`${Math.round(tail.filter(x=>x.success).length/tail.length*100)}%`:'—';
    $('s2-reward').textContent=tail.length?(tail.reduce((a,x)=>a+x.returnValue,0)/tail.length).toFixed(1):'—';
    const nextEps=Math.max(.045, Number($('s2-epsilon').value)*Math.pow(.992,model.episodes));
    $('s2-epsilon-current').textContent=`${(nextEps*100).toFixed(1)}%`;
    const evalResult=model.episodes?E.rollout(model.q,()=>0.15):null;
    $('s2-eval-result').textContent=!evalResult?'Not evaluated yet':evalResult.success?`Lighthouse reached · ${evalResult.steps} moves`:'Not reached yet · keep practising';
    $('s2-eval-note').textContent=!evalResult?'After training, evaluate the greedy policy with exploration turned off.':evalResult.success?`Greedy route cost: ${evalResult.cost}. Compare with Dijkstra below. This is one deterministic policy test, not an average over many runs.`:`The current greedy route got stuck after ${evalResult.steps} moves. A good training success rate does not guarantee a successful greedy rollout.`;
    chart();
    const bfs=E.search(false),opt=E.search(true);
    const learned=model.episodes?E.rollout(model.q,()=>0.15):null;
    const qModel=state.models.qlearning;
    const sModel=state.models.sarsa;
    const qRoute=qModel.episodes?E.rollout(qModel.q,()=>0.15):null;
    const sRoute=sModel.episodes?E.rollout(sModel.q,()=>0.15):null;
    const rows=[
      ['BFS · fewest moves',bfs],['Dijkstra · least cost',opt],
      ['Q-Learning · greedy',qRoute?.success?qRoute:null],
      ['SARSA · greedy',sRoute?.success?sRoute:null]
    ];
    $('s2-compare').replaceChildren(...rows.map(([label,data])=>{
      const tr=document.createElement('tr');
      [label,data?String(data.steps):'—',data?String(data.cost):'—'].forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.append(td);});
      return tr;
    }));
    $('s2-comparison-note').textContent=learned?learned.success?
      `Her greedy policy reaches the lighthouse in ${learned.steps} moves (cost ${learned.cost}). Dijkstra's lowest-cost route costs ${opt.cost}. Try more episodes or change the parameters.`:
      'This policy still gets stuck. More learning may help; the chart above is training performance, not a guarantee that the greedy route succeeds.':
      'BFS and Dijkstra know the transition model. Kristie starts with Q values of zero and learns by trial and error.';
  }
  function render(){
    drawGrid();renderStats();renderInspector();
    const methodInput=document.querySelector(`input[name="s2-method"][value="${state.method}"]`);
    if(methodInput)methodInput.checked=true;
  }
  function train(n){
    const model=active();
    const options={startAt:model.episodes,alpha:Number($('s2-alpha').value),gamma:Number($('s2-gamma').value),epsilon:Number($('s2-epsilon').value)};
    const rng=E.createRng(model.rngState);
    const rows=E.train(model.q,n,state.method,options,rng);
    model.rngState=rng.state();
    model.episodes+=n;
    model.history.push(...rows);
    if(model.history.length>2400)model.history.splice(0,model.history.length-2400);
    state.showPolicy=true;state.route=null;
    const recent=rows.slice(-50),rate=Math.round(recent.filter(r=>r.success).length/recent.length*100);
    info(`${n} actual episodes finished. Success in the last ${recent.length} training episodes: ${rate}%. The chart and the policy arrows now reflect learned Q values.`);
    setStatus('Learning complete. Select a sea square to inspect her choices.');
    save();render();
  }
  function showRoute(){
    const model=active();
    if(!model.episodes){info('Train the agent first. An untrained Q table contains only zeros.');return;}
    const route=E.rollout(model.q,()=>0.15);
    state.showPolicy=false;state.manual=false;state.route=route;
    setStatus(route.success?`Kristie reached the lighthouse in ${route.steps} moves. Cost: ${route.cost}.`:'Kristie got stuck on this policy. Try more training.');
    info(route.success?`The highlighted squares show her current greedy rollout. Unlike a planned shortest path, this route is learned from rewards.`:'A learned policy is not automatically a perfect route. Changing α, γ, ε or increasing episodes may improve it.');
    render();
  }
  function startManual(){
    state.manual=true;state.boat=E.START;state.manualPath=[E.START];state.manualCost=0;state.manualSteps=0;state.route=null;state.showPolicy=false;
    $('s2-manual').textContent='Sailing…';
    setStatus('Your turn. Use arrows, WASD or the buttons below.');render();
  }
  function move(action){
    if(!state.manual)startManual();
    const step=E.transition(state.boat,action);
    if(step.hit){setStatus('A reef! Turn around and try another way.');return;}
    state.boat=step.next;state.manualPath.push(step.next);
    state.manualSteps++;state.manualCost+=step.cost;
    const message=step.current?'The eastward current carried you ahead!':`You sailed ${E.ACTIONS[action].toLowerCase()}.`;
    if(step.done){state.manual=false;$('s2-manual').textContent='Take the helm';setStatus(`You reached Lantern Bay! ${state.manualSteps} moves, cost ${state.manualCost}.`);}
    else setStatus(`${message} ${state.manualSteps} moves · cost ${state.manualCost}.`);
    drawGrid();
  }
  function switchMethod(name){
    if(!methods.includes(name))return;
    state.method=name;state.route=null;state.showPolicy=false;
    const episodes=active().episodes;
    info(episodes?`${name==='sarsa'?'SARSA':'Q-Learning'}: showing its own ${episodes} saved training episodes.`:'This learning method has no training yet. The other method keeps its own Q table and learning history.');
    save();render();
  }
  function connect(){
    load();
    $('s2-start')?.addEventListener('click',openStory);
    document.querySelectorAll('[data-s2-go="lab"]').forEach(btn=>btn.addEventListener('click',openStory));
    $('s2-replay-story')?.addEventListener('click',openStory);
    $('s2-story-next').addEventListener('click',nextStory);
    $('s2-story-prev').addEventListener('click',prevStory);
    $('s2-story-skip').addEventListener('click',()=>closeStory());
    $('s2-story').addEventListener('keydown',event=>{
      if(!state.storyOpen)return;
      if(event.key==='Escape'){event.preventDefault();closeStory();}
      if(event.key==='Tab'){
        const controls=[$('s2-story-skip'),$('s2-story-prev'),$('s2-story-next')].filter(b=>!b.disabled);
        if(event.shiftKey&&document.activeElement===controls[0]){event.preventDefault();controls.at(-1).focus();}
        else if(!event.shiftKey&&document.activeElement===controls.at(-1)){event.preventDefault();controls[0].focus();}
      }
    });
    $('s2-chart-success').addEventListener('click',()=>switchChart('success'));
    $('s2-chart-reward').addEventListener('click',()=>switchChart('reward'));
    $('s2-seed').addEventListener('change',e=>{
      const seed=Math.max(1,Math.min(4294967295,Math.floor(Number(e.target.value)||42)));
      e.target.value=String(seed);
      if(active().episodes){e.target.value=String(active().seed);info('To change the experiment seed, clear training for this learning method first.');return;}
      active().seed=seed;active().rngState=seed;save();
    });
    for(const id of ['alpha','gamma','epsilon']){
      $(`s2-${id}`).addEventListener('input',e=>{$(`s2-${id}-value`).textContent=Number(e.target.value).toFixed(2);if(id==='epsilon')renderStats();});
    }
    document.querySelectorAll('input[name="s2-method"]').forEach(input=>input.addEventListener('change',e=>switchMethod(e.target.value)));
    $('s2-train-small').addEventListener('click',()=>train(200));
    $('s2-train-big').addEventListener('click',()=>train(800));
    $('s2-show-policy').addEventListener('click',()=>{
      state.showPolicy=!state.showPolicy;state.route=null;
      info(state.showPolicy?'Arrows show the greedy action for every state that has received a Q update. Click a tile to inspect Q values.':'Policy arrows hidden.');drawGrid();
    });
    $('s2-show-route').addEventListener('click',showRoute);
    $('s2-reset-model').addEventListener('click',()=>{
      if(!window.confirm(`Clear only the ${state.method==='sarsa'?'SARSA':'Q-Learning'} model and its learning chart? Season One saves and the other model will stay untouched.`))return;
      state.models[state.method]=freshModel(Number($('s2-seed').value)||42);state.route=null;state.showPolicy=false;
      info('This learning method has been reset to a blank Q table.');setStatus('The little boat is ready to learn again.');save();render();
    });
    $('s2-manual').addEventListener('click',startManual);
    $('s2-manual-reset').addEventListener('click',startManual);
    document.querySelectorAll('[data-s2-move]').forEach(btn=>btn.addEventListener('click',()=>move(Number(btn.dataset.s2Move))));
    window.addEventListener('keydown',event=>{
      if(!$('season2-screen')||$('season2-screen').hidden||state.storyOpen||!state.manual||event.ctrlKey||event.metaKey||event.altKey)return;
      const tag=event.target?.tagName?.toLowerCase();if(['input','textarea','select'].includes(tag))return;
      const a={arrowup:0,w:0,arrowright:1,d:1,arrowdown:2,s:2,arrowleft:3,a:3}[event.key.toLowerCase()];
      if(a===undefined)return;event.preventDefault();move(a);
    });
    render();
  }
  window.renderSeasonTwo=render;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',connect,{once:true});
  else connect();
})();
