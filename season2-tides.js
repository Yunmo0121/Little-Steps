/* Little Steps · Season Two Chapter 02 — Tidal Island UI.
   All numerical outcomes originate from TidalIslandEngine; localStorage is versioned separately. */
(function(){
  'use strict';
  const E=window.TidalIslandEngine;
  if(!E)return;
  const $=id=>document.getElementById(id);
  const KEY='little-steps-tidal-island-alpha14';
  const METHODS=['qlearning','sarsa'];
  function fresh(seed=42){return {q:E.emptyQ(),history:[],episodes:0,seed,rngState:seed>>>0};}
  const game={models:{qlearning:fresh(),sarsa:fresh()},method:'qlearning',manual:false,current:E.INITIAL,manualMoves:0,manualCost:0,manualWaits:0,selected:E.START,inspectedPhase:0,route:null,showPolicy:false,chartMetric:'success',storyIndex:0,storyOpen:false,returnFocus:null};
  const currentModel=()=>game.models[game.method];
  const storyPages=[
    {title:'A path in the sand',text:'On a quiet morning, Kristie found a narrow sandy path stretching towards a tiny lighthouse. It seemed like the easiest way across the island. But the water was still moving.',quote:'“If there is a path, surely I can follow it... right?”',img:'assets/s2-tidal-low-tide.webp',alt:'Kristie discovers a winding sandbar on a flower-covered island at low tide.'},
    {title:'When the sea comes back',text:'Before Kristie could cross, the waves crept over the sand. The path disappeared. She could take the long way around the rocks, or stay somewhere safe until the tide turned.',quote:'“Oh! The path is gone. Perhaps waiting can be a good decision too.”',img:'assets/s2-tidal-high-tide.webp',alt:'Kristie waits by the shore as the high tide covers the sandy crossing.'},
    {title:'The right moment',text:'Kristie began practising. She watched the tide, tried different choices, and learned that the same place could call for a different action at a different time.',quote:'“Maybe knowing when to wait is just as important as knowing where to go.”',img:'assets/s2-tidal-homeward.webp',alt:'Kristie smiles on the path towards a sunny flower-lined island lighthouse.'}
  ];
  function persist(){try{localStorage.setItem(KEY,JSON.stringify({version:1,method:game.method,models:game.models}));}catch{}}
  function restore(){try{
    const raw=JSON.parse(localStorage.getItem(KEY)||'null');if(!raw||raw.version!==1)return;
    for(const method of METHODS){
      const model=raw.models?.[method];if(!model||!Array.isArray(model.q)||model.q.length!==E.STATE_COUNT||!model.q.every(row=>Array.isArray(row)&&row.length===E.ACTION_COUNT&&row.every(Number.isFinite)))return;
      if(!Number.isSafeInteger(model.episodes)||model.episodes<0||!Array.isArray(model.history))return;
      game.models[method]={q:model.q,history:model.history.slice(-3000),episodes:model.episodes,seed:model.seed||42,rngState:model.rngState??42};
    }
    if(METHODS.includes(raw.method))game.method=raw.method;
  }catch{}}
  function setStatus(message){$('tide-status').textContent=message;}
  function setModelStatus(message){$('tide-model-status').textContent=message;}
  function phaseText(phase){return E.PHASES[phase];}
  function setTideClock(){
    const phase=E.decode(game.current).phase;
    const low=E.isLow(phase);
    $('tide-state-label').textContent=low?'LOW TIDE':'HIGH TIDE';
    $('tide-state-name').textContent=phaseText(phase);
    $('tide-next').textContent=`Next: ${phaseText((phase+1)%E.PHASE_COUNT)}`;
    $('tide-grid').dataset.tideLevel=low?'low':'high';
    $('tide-grid').dataset.tidePhase=String(phase);
  }
  const tileNames={'.':'Safe water','#':'Reef','S':'Harbour','G':'Lighthouse','T':'Sandbar','~':'Rough water'};
  const arrows=['↑','→','↓','←','↻'];
  function paintGrid(){
    const board=$('tide-grid'),frag=document.createDocumentFragment();
    const currentPos=E.decode(game.current).pos;
    const trace=new Set((game.route?.visits||[]).map(s=>E.decode(s).pos));
    const active=game.manual || !!game.route;
    for(let p=0;p<E.WIDTH*E.HEIGHT;p++){
      const t=E.tile(p),button=document.createElement('button');
      const [r,c]=E.rc(p);
      button.type='button';button.className=`tide-cell tide-cell-${t==='.'?'open':t==='T'?'sandbar':t==='#'?'reef':t==='~'?'rough':t==='S'?'start':'goal'}`;
      if(game.selected===p)button.classList.add('is-selected');
      if(trace.has(p))button.classList.add('on-route');
      button.setAttribute('role','gridcell');button.setAttribute('aria-label',`Row ${r+1}, column ${c+1}: ${tileNames[t]}`);
      button.addEventListener('click',()=>{game.selected=p;drawInspector();paintGrid();});
      if(t==='G'){const light=document.createElement('span');light.className='tide-goal-symbol';light.textContent='';light.setAttribute('aria-hidden','true');button.append(light);}
      if(t==='T'){const sand=document.createElement('span');sand.className='tide-sand-symbol';sand.textContent='';sand.setAttribute('aria-hidden','true');button.append(sand);}
      if(t==='S'&&!active){const port=document.createElement('span');port.className='tide-port-symbol';port.textContent='';port.setAttribute('aria-hidden','true');button.append(port);}
      if(p===currentPos){const boat=document.createElement('span');boat.className='tide-boat-symbol';boat.setAttribute('aria-hidden','true');button.append(boat);}
      if(game.showPolicy&&t!=='#'&&t!=='G'){
        const qs=currentModel().q[E.encode(p,E.decode(game.current).phase)];
        if(qs.some(n=>Math.abs(n)>1e-7)){
          const mark=document.createElement('span');mark.className='tide-policy-symbol';mark.textContent=arrows[E.bestAction(currentModel().q,E.encode(p,E.decode(game.current).phase),()=>0.12)];mark.setAttribute('aria-hidden','true');button.append(mark);
        }
      }
      frag.append(button);
    }
    board.replaceChildren(frag);setTideClock();
  }
  function drawInspector(){
    const [r,c]=E.rc(game.selected);const phase=game.inspectedPhase;
    $('tide-selected').textContent=`Row ${r+1}, column ${c+1} · ${tileNames[E.tile(game.selected)]} · ${phaseText(phase)}`;
    $('tide-phase-inspect').value=String(phase);
    const q=currentModel().q[E.encode(game.selected,phase)],best=Math.max(...q),low=Math.min(...q);
    const frag=document.createDocumentFragment();
    E.ACTIONS.forEach((action,i)=>{
      const row=document.createElement('div');row.className='tide-q-row';
      if(q[i]===best&&q.some(x=>Math.abs(x)>1e-8))row.classList.add('is-best');
      const label=document.createElement('span');label.textContent=`${arrows[i]} ${action}`;
      const value=document.createElement('strong');value.textContent=q[i].toFixed(2);
      const track=document.createElement('i');const fill=document.createElement('b');
      fill.style.width=`${Math.round(8+92*(best===low?0:(q[i]-low)/(best-low)))}%`;
      track.append(fill);row.append(label,value,track);frag.append(row);
    });
    $('tide-qs').replaceChildren(frag);
  }
  function lineChart(){
    const svg=$('tide-chart');svg.replaceChildren();
    const NS='http://www.w3.org/2000/svg';
    const node=(tag,attrs={},txt)=>{const n=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));if(txt!==undefined)n.textContent=txt;svg.append(n);return n;};
    const metric=game.chartMetric,rows=currentModel().history,points=[];
    for(let i=0;i<rows.length;i+=25){const batch=rows.slice(i,i+25);points.push(metric==='success'?batch.filter(row=>row.success).length/batch.length*100:batch.reduce((s,v)=>s+v.returnValue,0)/batch.length);}
    let min=metric==='success'?0:Math.min(0,...points)-5,max=metric==='success'?100:Math.max(0,...points)+5;
    if(max===min)max=min+10;
    const y=v=>143-(v-min)/(max-min)*122;
    for(let t=0;t<=4;t++){
      const value=min+(max-min)*t/4;const yy=y(value);
      node('line',{x1:36,y1:yy,x2:497,y2:yy,stroke:'#d7e5dd','stroke-width':1});
      node('text',{x:29,y:yy+3,'text-anchor':'end','font-size':10,fill:'#809994'},metric==='success'?`${Math.round(value)}%`:value.toFixed(0));
    }
    if(!points.length){node('text',{x:270,y:86,'text-anchor':'middle','font-size':13,fill:'#899994'},'Train Kristie to reveal the learning curve');return;}
    const x=i=>36+(points.length===1?0:(i/(points.length-1))*461);
    const coords=points.map((v,i)=>`${x(i)},${y(v)}`).join(' ');
    node('polyline',{points:coords,fill:'none',stroke:'#639eaf','stroke-width':3,'stroke-linecap':'round','stroke-linejoin':'round'});
    points.forEach((v,i)=>{if(i===0||i===points.length-1||i%10===0)node('circle',{cx:x(i),cy:y(v),r:3,fill:'#e4a9a2'});});
    node('text',{x:36,y:164,'font-size':10,fill:'#859a9c'},'Start');
    node('text',{x:497,y:164,'text-anchor':'end','font-size':10,fill:'#859a9c'},`${currentModel().episodes} episodes`);
  }
  function table(){
    const q=game.models.qlearning,s=game.models.sarsa;
    const lines=[['BFS · fewest actions',E.search(false)],['Dijkstra · tide-aware',E.search(true)],['Q-Learning · greedy',q.episodes?E.rollout(q.q):null],['SARSA · greedy',s.episodes?E.rollout(s.q):null]];
    const body=$('tide-comparison-rows');body.replaceChildren(...lines.map(([name,result])=>{
      const tr=document.createElement('tr');
      [name,result?.success?result.steps:'—',result?.success?result.waits:'—',result?.success?result.cost:'—'].forEach(value=>{const td=document.createElement('td');td.textContent=String(value);tr.append(td);});return tr;
    }));
    const opt=E.search(true);const learned=currentModel().episodes?E.rollout(currentModel().q):null;
    $('tide-comparison-note').textContent=learned ? (learned.success ? `This greedy policy used ${learned.waits} waits. Tide-aware Dijkstra uses ${opt.waits} waits and has travel cost ${opt.cost}; its timing is planned with full knowledge.`:'Her greedy rollout has not reached the lighthouse yet. Keep training or adjust the parameters.'):'BFS and Dijkstra can see the tide rules in advance. Kristie has to learn a policy from experience.';
  }
  function stats(){
    const m=currentModel();$('tide-episodes').textContent=String(m.episodes);
    const last=m.history.slice(-50);
    $('tide-success').textContent=last.length?`${Math.round(last.filter(x=>x.success).length/last.length*100)}%`:'—';
    $('tide-reward').textContent=last.length?(last.reduce((s,x)=>s+x.returnValue,0)/last.length).toFixed(1):'—';
    $('tide-epsilon-current').textContent=`${(Math.max(.045,Number($('tide-epsilon').value)*Math.pow(.994,m.episodes))*100).toFixed(1)}%`;
    const evalResult=m.episodes?E.rollout(m.q):null;
    $('tide-eval').textContent=!evalResult?'Not trained yet':evalResult.success?`Reached · ${evalResult.steps} actions, ${evalResult.waits} waits`:'Not reached yet';
    $('tide-seed').value=String(m.seed);
    for(const method of METHODS){const input=document.querySelector(`input[name="tide-method"][value="${method}"]`);input.checked=game.method===method;}
    lineChart();table();drawInspector();
  }
  function trainEpisodes(count){
    const m=currentModel();const rng=E.createRng(m.rngState);
    const options={startAt:m.episodes,alpha:Number($('tide-alpha').value),gamma:Number($('tide-gamma').value),epsilon:Number($('tide-epsilon').value),decay:.994,minEpsilon:.045};
    const batch=E.train(m.q,count,game.method,options,rng);
    m.rngState=rng.state();m.episodes+=count;m.history.push(...batch);
    if(m.history.length>3000)m.history.splice(0,m.history.length-3000);
    game.showPolicy=true;game.route=null;game.manual=false;game.current=E.INITIAL;
    const last=batch.slice(-50);const rate=Math.round(last.filter(x=>x.success).length/last.length*100);
    setModelStatus(`${count} real episodes finished. Recent training success: ${rate}%. Inspect different tide phases to see how her choices change.`);
    setStatus('Training complete. Notice which arrows change when the tide changes.');persist();paintGrid();stats();
  }
  function startManual(){game.manual=true;game.current=E.INITIAL;game.route=null;game.manualMoves=0;game.manualCost=0;game.manualWaits=0;setStatus('Use arrows or WASD to sail; press Space or Wait to let the tide change.');paintGrid();}
  function move(action){
    if(!game.manual)startManual();
    const t=E.transition(game.current,action);
    game.current=t.next;game.inspectedPhase=t.phase;game.manualMoves++;game.manualCost+=t.cost;if(action===4)game.manualWaits++;
    if(t.done){game.manual=false;setStatus(`You reached the lighthouse in ${game.manualMoves} actions, with ${game.manualWaits} waits!`);}
    else if(t.swept)setStatus('The high tide swept Kristie back to the harbour! Try watching the tide.');
    else if(t.hit)setStatus(t.reason==='high-tide'?'The sandbar is underwater. Wait or take a different route.':'A rocky reef is blocking the way.');
    else if(action===4)setStatus(`Kristie waits safely. Now: ${phaseText(t.phase)}.`);
    else setStatus(`Sailed ${E.ACTIONS[action].toLowerCase()}. Now: ${phaseText(t.phase)}. ${game.manualMoves} actions.`);
    paintGrid();drawInspector();
  }
  function showRoute(){
    const m=currentModel();if(!m.episodes){setModelStatus('Train a model before following its learned route.');return;}
    const rollout=E.rollout(m.q);game.route=rollout;game.manual=false;game.showPolicy=false;game.current=E.INITIAL;
    setStatus(rollout.success?`The greedy policy reached the lighthouse in ${rollout.steps} actions, including ${rollout.waits} waits.`:'The greedy policy got stuck. More training might help.');
    setModelStatus('Blue route tiles show all visited places; Q values and policy still distinguish the four tide phases.');paintGrid();stats();
  }
  function showStory(){game.storyIndex=0;game.storyOpen=true;$('tide-story').hidden=false;document.body.classList.add('s2-story-is-open');renderStory();$('tide-story-next').focus();}
  function renderStory(){const i=game.storyIndex,p=storyPages[i];
    $('tide-story-art').src=p.img;$('tide-story-art').alt=p.alt;
    $('tide-story-title').textContent=p.title;$('tide-story-text').textContent=p.text;$('tide-story-quote').textContent=p.quote;
    $('tide-story-counter').textContent=`Page ${i+1} of ${storyPages.length}`;
    $('tide-story-prev').disabled=i===0;
    $('tide-story-next').textContent=i===storyPages.length-1?'Begin Chapter 02 →':'Turn the page →';
    $('tide-story-dots').replaceChildren(...storyPages.map((_,j)=>{const node=document.createElement('span');node.className=i===j?'is-current':'';return node;}));
  }
  function closeStory(){game.storyOpen=false;$('tide-story').hidden=true;document.body.classList.remove('s2-story-is-open');$('s2-tide-lab').scrollIntoView({behavior:'instant',block:'start'});$('tide-manual').focus({preventScroll:true});}
  function enterChapter(){
    $('s2-lab').hidden=true;$('s2-tide-lab').hidden=false;game.current=E.INITIAL;game.manual=false;game.route=null;setStatus('The tide is low. Take a look at the sandy crossing.');paintGrid();stats();showStory();
  }
  function backToWorld(){ $('s2-tide-lab').hidden=true;$('s2-lab').hidden=false;$('s2-title').scrollIntoView({behavior:'smooth',block:'start'});}
  function wire(){
    if(!$('tide-grid'))return;
    restore();
    document.querySelectorAll('[data-tide-go="story"]').forEach(button=>button.addEventListener('click',enterChapter));
    $('tide-replay').addEventListener('click',showStory);
    $('tide-back-world').addEventListener('click',backToWorld);
    $('s2-start').addEventListener('click',()=>{$('s2-lab').hidden=false;$('s2-tide-lab').hidden=true;});
    document.querySelectorAll('[data-s2-go="lab"]').forEach(button=>button.addEventListener('click',()=>{$('s2-lab').hidden=false;$('s2-tide-lab').hidden=true;}));
    $('tide-story-skip').addEventListener('click',closeStory);
    $('tide-story-next').addEventListener('click',()=>{if(game.storyIndex<storyPages.length-1){game.storyIndex++;renderStory();}else closeStory();});
    $('tide-story-prev').addEventListener('click',()=>{game.storyIndex=Math.max(0,game.storyIndex-1);renderStory();});
    $('tide-story').addEventListener('keydown',event=>{
      if(!game.storyOpen)return;
      if(event.key==='Escape'){event.preventDefault();closeStory();}
      if(event.key==='Tab'){
        const controls=[$('tide-story-skip'),$('tide-story-prev'),$('tide-story-next')].filter(btn=>!btn.disabled);
        if(event.shiftKey&&document.activeElement===controls[0]){event.preventDefault();controls.at(-1).focus();}
        else if(!event.shiftKey&&document.activeElement===controls.at(-1)){event.preventDefault();controls[0].focus();}
      }
    });
    $('tide-manual').addEventListener('click',startManual);$('tide-manual-reset').addEventListener('click',startManual);
    document.querySelectorAll('[data-tide-action]').forEach(b=>b.addEventListener('click',()=>move(Number(b.dataset.tideAction))));
    window.addEventListener('keydown',event=>{
      if($('season2-screen').hidden||$('s2-tide-lab').hidden||game.storyOpen||!game.manual||event.ctrlKey||event.metaKey||event.altKey)return;
      if(['input','select','textarea'].includes(event.target?.tagName?.toLowerCase()))return;
      const actions={arrowup:0,w:0,arrowright:1,d:1,arrowdown:2,s:2,arrowleft:3,a:3,' ':4};
      const action=actions[event.key.toLowerCase()];if(action!==undefined){event.preventDefault();move(action);}
    });
    for(const name of ['alpha','gamma','epsilon'])$('tide-'+name).addEventListener('input',e=>{$('tide-'+name+'-value').textContent=Number(e.target.value).toFixed(2);if(name==='epsilon')stats();});
    document.querySelectorAll('input[name="tide-method"]').forEach(input=>input.addEventListener('change',()=>{
      game.method=input.value;game.showPolicy=false;game.route=null;game.current=E.INITIAL;
      setModelStatus(`${game.method==='sarsa'?'SARSA':'Q-Learning'} has ${currentModel().episodes} independently saved training episodes.`);
      persist();paintGrid();stats();
    }));
    $('tide-seed').addEventListener('change',e=>{const value=Math.max(1,Math.min(4294967295,Math.floor(Number(e.target.value)||42)));
      if(currentModel().episodes){e.target.value=String(currentModel().seed);setModelStatus('Clear training before changing the random seed.');return;}
      currentModel().seed=value;currentModel().rngState=value;e.target.value=String(value);persist();
    });
    $('tide-train-200').addEventListener('click',()=>trainEpisodes(200));$('tide-train-800').addEventListener('click',()=>trainEpisodes(800));
    $('tide-follow').addEventListener('click',showRoute);
    $('tide-show-policy').addEventListener('click',()=>{game.showPolicy=!game.showPolicy;game.route=null;game.manual=false;game.current=E.INITIAL;setModelStatus(game.showPolicy?'Arrows show the greedy action for the current phase. Use manual controls to advance the tide and watch them change.':'Policy arrows hidden.');paintGrid();});
    $('tide-clear').addEventListener('click',()=>{if(!confirm(`Clear ${game.method==='sarsa'?'SARSA':'Q-Learning'} training for Chapter 02 only?`))return;
      const seed=currentModel().seed;game.models[game.method]=fresh(seed);game.showPolicy=false;game.route=null;game.current=E.INITIAL;persist();setModelStatus('This algorithm is ready for a new experiment.');paintGrid();stats();
    });
    $('tide-phase-inspect').addEventListener('change',e=>{game.inspectedPhase=Number(e.target.value);drawInspector();});
    for(const [id,metric] of [['tide-metric-success','success'],['tide-metric-reward','reward']])$(id).addEventListener('click',()=>{
      game.chartMetric=metric;for(const [other,option] of [['tide-metric-success','success'],['tide-metric-reward','reward']]){
        $(other).classList.toggle('is-active',option===metric);$(other).setAttribute('aria-pressed',String(option===metric));
      }lineChart();
    });
    paintGrid();stats();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire,{once:true});else wire();
})();
