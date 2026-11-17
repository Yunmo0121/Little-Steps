
(function(){
  'use strict';
  const A=window.SeasonTwoAdvancedEngine;
  if(!A) return;
  const KEY='little-steps-season2-advanced-v01';
  const METHOD_NAMES=['qlearning','sarsa'];
  const chapters=['misty','windward','starharbor'];
  const envs={}; chapters.forEach(id=>envs[id]=A.createEnvironment(A.chapterConfigs[id]));
  const $=id=>document.getElementById(id);

  function freshModel(env,seed=42){ return {q:env.emptyQ(), history:[], episodes:0, seed, rngState:seed>>>0}; }
  const state={ current:'misty', storyOpen:false, storyIndex:0, storyReturnFocus:null,
    chapters:Object.fromEntries(chapters.map(id=>[id,{method:'qlearning', models:{qlearning:freshModel(envs[id]), sarsa:freshModel(envs[id])}, chartMetric:'success', selectedBase:envs[id].startBase, inspectExtra:0, manual:false, manualState:envs[id].reset(), manualDiscovered:new Set([envs[id].startBase]), manualVisited:[envs[id].startBase], manualSteps:0, manualReturn:0, experiment:null, route:null, showPolicy:false}])) };

  function chapterState(){ return state.chapters[state.current]; }
  function currentEnv(){ return envs[state.current]; }
  function activeModel(){ const ch=chapterState(); return ch.models[ch.method]; }
  function safeNum(n, fallback){ return Number.isFinite(n)?n:fallback; }
  function save(){
    try{
      const payload={current:state.current, chapters:{}};
      for(const id of chapters){
        const c=state.chapters[id];
        payload.chapters[id]={method:c.method, chartMetric:c.chartMetric, experiment:c.experiment, models:{}};
        for(const m of METHOD_NAMES){ const model=c.models[m]; payload.chapters[id].models[m]={q:model.q,history:model.history.slice(-2600),episodes:model.episodes,seed:model.seed,rngState:model.rngState}; }
      }
      localStorage.setItem(KEY, JSON.stringify(payload));
    }catch(_){ }
  }
  function load(){
    try{
      const raw=JSON.parse(localStorage.getItem(KEY)||'null'); if(!raw) return;
      if(raw.current && chapters.includes(raw.current)) state.current=raw.current;
      for(const id of chapters){
        const env=envs[id], incoming=raw.chapters?.[id]; if(!incoming) continue; const c=state.chapters[id];
        if(METHOD_NAMES.includes(incoming.method)) c.method=incoming.method;
        if(['success','reward'].includes(incoming.chartMetric)) c.chartMetric=incoming.chartMetric;
        c.experiment=incoming.experiment || null;
        for(const m of METHOD_NAMES){
          const model=incoming.models?.[m]; if(!model || !Array.isArray(model.q) || model.q.length!==env.stateCount) continue;
          if(!model.q.every(row=>Array.isArray(row)&&row.length===4&&row.every(Number.isFinite))) continue;
          c.models[m]={ q:model.q, history:Array.isArray(model.history)?model.history.slice(-2600):[], episodes:Number.isFinite(model.episodes)?model.episodes:0, seed:Number.isFinite(model.seed)?model.seed:42, rngState:Number.isFinite(model.rngState)?model.rngState:42 };
        }
      }
    }catch(_){ }
  }

  function chapterLabel(id){ return A.chapterConfigs[id].shortName; }
  function setStatus(msg){ $('s2a-status').textContent=msg; }
  function setHelp(msg){ $('s2a-help').textContent=msg; }
  function terrainName(ch){ return ({'.':'Calm water','S':'Harbor','G':state.current==='windward'?'Safe sea passage':'Lighthouse','K':'Silver sea bell','#':'Reef','~':'Rough sea','>':'Wind lane','A':'Beacon A','B':'Beacon B','C':'Beacon C'})[ch] || 'Sea'; }
  function formatMask(mask){ return currentEnv().labelMask(mask); }

  function openChapter(id, fromEl){
    if(!chapters.includes(id)) return;
    state.current=id; const ch=chapterState(); const env=currentEnv();
    ch.selectedBase = env.startBase;
    ch.inspectExtra = 0;
    $('s2a-lab').hidden=false;
    renderChapter();
    openStory(fromEl);
    save();
  }

  function openStory(fromEl){
    state.storyOpen=true; state.storyIndex=0; state.storyReturnFocus=fromEl?.currentTarget || fromEl || null;
    $('s2a-story').hidden=false; document.body.classList.add('s2-story-is-open'); renderStory(); $('s2a-story-next').focus();
  }
  function closeStory(goToLab=true){
    state.storyOpen=false; $('s2a-story').hidden=true; document.body.classList.remove('s2-story-is-open');
    if(goToLab){ $('s2a-lab').scrollIntoView({behavior:'instant',block:'start'}); $('s2a-manual').focus({preventScroll:true}); }
    else if(state.storyReturnFocus?.isConnected){ state.storyReturnFocus.focus({preventScroll:true}); }
    state.storyReturnFocus=null;
  }
  function renderStory(){
    const pages=A.chapterConfigs[state.current].storyPages; const i=state.storyIndex; const page=pages[i];
    $('s2a-story-chapter').textContent=A.chapterConfigs[state.current].overline.toUpperCase();
    $('s2a-story-counter').textContent=`PAGE ${i+1} OF ${pages.length}`;
    $('s2a-story-title').textContent=page.title;
    $('s2a-story-text').textContent=page.text;
    $('s2a-story-quote').textContent=page.quote;
    const art = $('s2a-story-art'); art.replaceChildren();
    if(page.image){ const img=document.createElement('img'); img.src=page.image; img.alt=`Illustration for ${A.chapterConfigs[state.current].shortName}: ${page.title}`; img.loading='eager'; art.append(img); }
    else if(page.art) art.innerHTML=page.art;
    $('s2a-story-prev').disabled=i===0;
    $('s2a-story-next').textContent=i===pages.length-1?'Begin the voyage →':'Turn the page →';
    $('s2a-story-dots').replaceChildren(...pages.map((_,k)=>{ const dot=document.createElement('span'); if(k===i) dot.className='is-current'; return dot; }));
  }

  function renderChapter(){
    const cfg=A.chapterConfigs[state.current], env=currentEnv(), ch=chapterState(), model=activeModel();
    $('s2a-current-name').textContent=cfg.shortName;
    $('s2a-lab-overline').textContent=cfg.overline;
    $('s2a-lab-title').textContent=cfg.labTitle;
    $('s2a-lab-subtitle').textContent=cfg.subtitle;
    $('s2a-notes').textContent=cfg.notes;
    $('s2a-replay-story').textContent=`↶ Read the ${cfg.shortName} story again`;
    $('s2a-board-title').textContent=cfg.shortName + (state.current==='misty'?' · Find the Silver Bell':'');
    $('s2a-goal-legend').textContent=state.current==='misty'?'Silver sea bell':state.current==='windward'?'Safe passage':'Three beacons + harbor';
    $('s2a-path-1').innerHTML='<strong>1</strong><span>Try the sea yourself</span>';
    $('s2a-path-2').innerHTML='<strong>2</strong><span>Train Q-Learning or SARSA</span>';
    $('s2a-path-3').innerHTML='<strong>3</strong><span>Read the learning curve</span>';
    $('s2a-path-4').innerHTML='<strong>4</strong><span>'+ (state.current==='misty'?'Compare exploration':'Test the policy') +'</span>';
    document.querySelectorAll('input[name="s2a-method"]').forEach(input=>input.checked=input.value===ch.method);
    $('s2a-seed').value=String(model.seed);
    $('s2a-inspector-mask-wrap').hidden=state.current!=='starharbor';
    if(state.current==='starharbor'){
      const labels=['No beacons','Beacon A','Beacon B','Beacon B','A + B','A + C','B + C','A + B + C'];
      $('s2a-inspector-mask').replaceChildren(...Array.from({length:8},(_,i)=>{ const opt=document.createElement('option'); opt.value=String(i); opt.textContent=`Mask ${i} · ${formatMask(i)}`; return opt; }));
      $('s2a-inspector-mask').value=String(ch.inspectExtra||0);
    }
    $('s2a-experiment-btn').textContent=cfg.experimentLabel;
    $('s2a-experiment-caption').textContent=cfg.experimentDescription;
    setStatus(`Ready for ${cfg.shortName}.`);
    renderBoard(); renderStats(); renderInspector(); renderExperiment();
  }

  function renderBoard(){
    const env=currentEnv(), ch=chapterState(); const board=$('s2a-board'); board.dataset.chapter=state.current; const frag=document.createDocumentFragment();
    const visible = ch.manual ? env.visibleBases(env.decode(ch.manualState).base, ch.manualDiscovered) : new Set(Array.from({length:env.baseCount},(_,i)=>i));
    const routeSet = new Set((ch.route?.visited||[]).slice(1));
    for(let b=0;b<env.baseCount;b++){
      const tile=env.tile(b); const btn=document.createElement('button'); btn.type='button'; btn.className='s2a-cell';
      if(tile==='#') btn.classList.add('is-reef');
      if(tile==='~') btn.classList.add('is-rough');
      if(tile==='>') btn.classList.add('is-wind');
      if(tile==='G'||tile==='K') btn.classList.add('is-goal');
      if(tile==='K') btn.classList.add('is-silver-bell');
      if(['A','B','C'].includes(tile)) btn.classList.add('is-beacon');
      if(ch.selectedBase===b) btn.classList.add('is-selected');
      if(ch.route && routeSet.has(b)) btn.classList.add('is-route');
      if(ch.manual && ch.manualVisited.includes(b)) btn.classList.add('is-visited');
      if(!visible.has(b) && tile!=='#'){ btn.classList.add('is-fog'); btn.innerHTML='<span class="fog-dot">?</span>'; }
      else {
        if(ch.showPolicy && tile!=='#'){
          const row=activeModel().q[state.current==='starharbor'?env.encode(b,ch.inspectExtra||0):b];
          if(row && row.some(v=>Math.abs(v)>1e-8)){ const arrow=document.createElement('span'); arrow.className='s2a-arrow'; const actionIndex=row.indexOf(Math.max(...row)); arrow.textContent=env.ACTION_SYMBOLS[actionIndex]; arrow.style.transform=`rotate(${[-90,0,90,180][actionIndex]}deg)`; btn.append(arrow); }
        }
        if(tile==='G'){ const span=document.createElement('span'); span.className='s2a-goal'; span.textContent=''; btn.append(span); }
        if(tile==='K'){ const bell=document.createElement('span'); bell.className='s2a-silver-bell'; bell.setAttribute('aria-hidden','true'); btn.append(bell); }
        if(['A','B','C'].includes(tile)){ const span=document.createElement('span'); span.className='s2a-beacon'; span.textContent=tile; btn.append(span); }
        if(tile==='>'){ const span=document.createElement('span'); span.className='s2a-gust'; span.textContent=''; btn.append(span); }
      }
      if(ch.manual && env.decode(ch.manualState).base===b){ const boat=document.createElement('span'); boat.className='s2a-boat'; boat.setAttribute('aria-hidden','true'); btn.append(boat); }
      if(!ch.manual && b===env.startBase && !ch.route){ const boat=document.createElement('span'); boat.className='s2a-dock'; boat.setAttribute('aria-hidden','true'); btn.append(boat); }
      btn.setAttribute('aria-label', terrainName(tile));
      btn.addEventListener('click',()=>{ ch.selectedBase=b; renderBoard(); renderInspector(); });
      frag.append(btn);
    }
    board.style.gridTemplateColumns=`repeat(${env.W}, 1fr)`;
    board.replaceChildren(frag);
  }

  function chartBuckets(){
    const ch=chapterState(), rows=activeModel().history; const metric=ch.chartMetric; const buckets=[];
    for(let i=0;i<rows.length;i+=20){
      const group=rows.slice(i,i+20);
      if(metric==='success') buckets.push(group.filter(x=>x.success).length/group.length*100);
      else buckets.push(group.reduce((a,x)=>a+x.returnValue,0)/group.length);
    }
    return buckets;
  }
  function renderChart(){
    const svg=$('s2a-chart'); const NS='http://www.w3.org/2000/svg'; svg.replaceChildren();
    const metric=chapterState().chartMetric, data=chartBuckets();
    const add=(tag,attrs,text)=>{ const el=document.createElementNS(NS,tag); for(const [k,v] of Object.entries(attrs)) el.setAttribute(k,v); if(text!==undefined) el.textContent=text; svg.append(el); return el; };
    const yTop=12,yBottom=142; let low=0, high=100;
    if(metric==='reward' && data.length){ low=Math.floor((Math.min(...data,0)-5)/10)*10; high=Math.ceil((Math.max(...data,0)+5)/10)*10; if(high===low) high=low+10; }
    const py=v=>yBottom-(v-low)/(high-low)*(yBottom-yTop);
    for(let i=0;i<=4;i++){ const val=high - i*(high-low)/4; const y=py(val); add('line',{x1:54,x2:504,y1:y,y2:y,stroke:'#dce7e1','stroke-width':1}); add('text',{x:46,y:y+4,'text-anchor':'end',fill:'#7b918a','font-size':11}, metric==='success'?`${Math.round(val)}%`:String(Math.round(val))); }
    if(!data.length){ add('text',{x:280,y:88,'text-anchor':'middle',fill:'#8ea49d','font-size':13},'Train Kristie to reveal the learning curve'); return; }
    const px=i=>data.length===1?279:54+i*450/(data.length-1);
    add('polyline',{points:data.map((v,i)=>`${px(i)},${py(v)}`).join(' '), fill:'none', stroke:metric==='success'?'#6ea39c':'#c78f77', 'stroke-width':3, 'stroke-linecap':'round', 'stroke-linejoin':'round'});
    add('circle',{cx:px(data.length-1), cy:py(data.at(-1)), r:5, fill:metric==='success'?'#6ea39c':'#c78f77'});
  }

  function renderStats(){
    const model=activeModel(), ch=chapterState(), env=currentEnv();
    const tail=model.history.slice(-50);
    $('s2a-episodes').textContent=String(model.episodes);
    $('s2a-success').textContent=tail.length?`${Math.round(tail.filter(x=>x.success).length/tail.length*100)}%`:'—';
    $('s2a-reward').textContent=tail.length?(tail.reduce((a,x)=>a+x.returnValue,0)/tail.length).toFixed(1):'—';
    const epsNow=Math.max(0.05, Number($('s2a-epsilon').value)*Math.pow(0.992,model.episodes));
    $('s2a-epsilon-current').textContent=`${(epsNow*100).toFixed(1)}%`;
    renderChart();
    const greedy = model.episodes? env.rollout(model.q,{seed:73}) : null;
    $('s2a-eval').textContent=!greedy?'Not trained yet':greedy.success?(state.current==='misty'?`Silver bell found in ${greedy.steps} steps`:`Success in ${greedy.steps} steps`):'Not solved yet';
    $('s2a-eval-note').textContent=!greedy?'Train first, then inspect the greedy policy.':state.current==='misty'?`Greedy route discovered ${(greedy.discoveredPct*100).toFixed(0)}% of the map and had ${greedy.collisions} collisions.`:state.current==='windward'?`One seed gave ${greedy.success?'a success':'a failure'} with ${greedy.collisions} collisions. Evaluate over many seeds for a fairer picture.`:`The greedy route finished with ${formatMask(greedy.mask)} after ${greedy.steps} steps.`;
    $('s2a-chart-success').classList.toggle('is-current', ch.chartMetric==='success');
    $('s2a-chart-reward').classList.toggle('is-current', ch.chartMetric==='reward');
  }

  function renderInspector(){
    const env=currentEnv(), ch=chapterState();
    const base=ch.selectedBase; const tile=env.tile(base); const [r,c]=env.rc(base); const stateIndex=state.current==='starharbor'?env.encode(base,ch.inspectExtra||0):base;
    const row=activeModel().q[stateIndex] || [0,0,0,0];
    $('s2a-selected').textContent=`Row ${r+1}, column ${c+1} · ${terrainName(tile)}${state.current==='starharbor' ? ' · '+formatMask(ch.inspectExtra||0):''}`;
    $('s2a-q-values').replaceChildren(...row.map((v,i)=>{ const wrap=document.createElement('div'); const lab=document.createElement('span'); lab.textContent=`${env.ACTION_SYMBOLS[i]} ${env.ACTIONS[i]}`; const val=document.createElement('strong'); val.textContent=v.toFixed(2); wrap.append(lab,val); if(v===Math.max(...row) && row.some(x=>Math.abs(x)>1e-8)) wrap.classList.add('is-best'); return wrap; }));
  }

  function trainEpisodes(n){
    const env=currentEnv(), model=activeModel();
    const out=env.train(model.q,n,chapterState().method,{alpha:Number($('s2a-alpha').value), gamma:Number($('s2a-gamma').value), epsilon:Number($('s2a-epsilon').value), startAt:model.episodes, seed:model.rngState || model.seed});
    model.rngState=out.nextSeed; model.episodes += n; model.history.push(...out.history); if(model.history.length>2600) model.history.splice(0, model.history.length-2600);
    chapterState().showPolicy=true; chapterState().route=null;
    setStatus(`Finished ${n} episodes for ${chapterLabel(state.current)}.`); setHelp(`The learning curve and Q-values now reflect ${chapterState().method==='qlearning'?'Q-Learning':'SARSA'}.`); save(); renderChapter();
  }
  function showRoute(){
    const env=currentEnv(), model=activeModel(); if(!model.episodes){ setHelp('Train the model first.'); return; }
    chapterState().route = env.rollout(model.q,{seed:73}); chapterState().manual=false;
    setStatus(chapterState().route.success?(state.current==='misty'?'Kristie found the Silver Bell and a safe path!':`Greedy route solved ${chapterLabel(state.current)}.`):`This greedy route still struggles.`); renderBoard(); renderStats();
  }
  function resetModel(){
    if(!window.confirm(`Clear only the ${chapterState().method==='qlearning'?'Q-Learning':'SARSA'} model for ${chapterLabel(state.current)}?`)) return;
    const env=currentEnv(); chapterState().models[chapterState().method]=freshModel(env, Number($('s2a-seed').value)||42); chapterState().route=null; chapterState().showPolicy=false; chapterState().experiment=null;
    setHelp('Model cleared.'); save(); renderChapter();
  }
  function startManual(){
    const env=currentEnv(), ch=chapterState(); ch.manual=true; ch.manualState=env.reset(); ch.manualDiscovered=new Set([env.startBase]); ch.manualVisited=[env.startBase]; ch.manualSteps=0; ch.manualReturn=0; ch.route=null; ch.showPolicy=false;
    setStatus('Your turn. Use the arrow buttons or keyboard.'); renderBoard(); renderStats();
  }
  function manualMove(action){
    const env=currentEnv(), ch=chapterState(); if(!ch.manual) startManual();
    const res=env.step(ch.manualState,action,A.createRng((Date.now()%100000)+1),{discovered:ch.manualDiscovered}); ch.manualState=res.state; ch.manualVisited.push(env.decode(ch.manualState).base); ch.manualSteps++; ch.manualReturn+=res.reward;
    if(res.done){ ch.manual=false; setStatus(state.current==='starharbor'?`Voyage complete! ${ch.manualSteps} steps.`:state.current==='misty'?`You found the Silver Bell in ${ch.manualSteps} steps!`:`You reached the safe passage in ${ch.manualSteps} steps.`); }
    else setStatus(res.message || `Voyage step ${ch.manualSteps}. Current return ${ch.manualReturn.toFixed(1)}.`);
    renderBoard(); renderStats();
  }
  function runExperiment(){
    const env=currentEnv();
    if(state.current==='misty') chapterState().experiment={type:'misty', rows:env.compareEpsilons({alpha:Number($('s2a-alpha').value), gamma:Number($('s2a-gamma').value)})};
    else if(state.current==='windward') chapterState().experiment={type:'windward', result:env.evaluateSeeds(activeModel().q)};
    else chapterState().experiment={type:'starharbor', rows:env.generalization(activeModel().q)};
    renderExperiment(); save();
  }
  function renderExperiment(){
    const box=$('s2a-experiment-results'); box.replaceChildren(); const exp=chapterState().experiment;
    if(!exp){ const p=document.createElement('p'); p.className='s2a-empty'; p.textContent='No experiment has been run yet.'; box.append(p); return; }
    const table=document.createElement('table');
    if(exp.type==='misty'){
      table.innerHTML='<thead><tr><th>ε</th><th>Success</th><th>Collisions</th><th>Mean reward</th><th>Map discovered</th></tr></thead>';
      const tbody=document.createElement('tbody'); exp.rows.forEach(r=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${r.epsilon.toFixed(2)}</td><td>${r.success.toFixed(0)}%</td><td>${r.collisions.toFixed(2)}</td><td>${r.reward.toFixed(1)}</td><td>${r.discovery.toFixed(0)}%</td>`; tbody.append(tr); }); table.append(tbody);
    } else if(exp.type==='windward'){
      table.innerHTML='<thead><tr><th>Seed</th><th>Success</th><th>Steps</th><th>Reward</th><th>Collisions</th></tr></thead>';
      const tbody=document.createElement('tbody'); exp.result.rows.forEach(r=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${r.seed}</td><td>${r.success?'Yes':'No'}</td><td>${r.steps}</td><td>${r.reward.toFixed(1)}</td><td>${r.collisions}</td>`; tbody.append(tr); }); table.append(tbody);
      const foot=document.createElement('p'); foot.className='s2a-experiment-summary'; foot.textContent=`Average success ${exp.result.success.toFixed(0)}% · mean reward ${exp.result.reward.toFixed(1)} · mean collisions ${exp.result.collisions.toFixed(2)}`; box.append(table, foot); return;
    } else {
      table.innerHTML='<thead><tr><th>Start</th><th>Success</th><th>Steps</th><th>Reward</th><th>Beacons reached</th></tr></thead>';
      const tbody=document.createElement('tbody'); exp.rows.forEach(r=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${r.label}</td><td>${r.success?'Yes':'No'}</td><td>${r.steps}</td><td>${r.reward.toFixed(1)}</td><td>${r.beacons}</td>`; tbody.append(tr); }); table.append(tbody);
    }
    box.append(table);
  }

  function connect(){
    load();
    document.querySelectorAll('[data-s2a-chapter]').forEach(btn=>btn.addEventListener('click',e=>openChapter(btn.dataset.s2aChapter,e)));
    $('s2a-replay-story').addEventListener('click',e=>openStory(e));
    $('s2a-story-next').addEventListener('click',()=>{ const pages=A.chapterConfigs[state.current].storyPages; if(state.storyIndex<pages.length-1){ state.storyIndex++; renderStory(); } else closeStory(true); });
    $('s2a-story-prev').addEventListener('click',()=>{ if(state.storyIndex>0){ state.storyIndex--; renderStory(); } });
    $('s2a-story-skip').addEventListener('click',()=>closeStory(true));
    $('s2a-chart-success').addEventListener('click',()=>{ chapterState().chartMetric='success'; renderStats(); save(); });
    $('s2a-chart-reward').addEventListener('click',()=>{ chapterState().chartMetric='reward'; renderStats(); save(); });
    document.querySelectorAll('input[name="s2a-method"]').forEach(input=>input.addEventListener('change',e=>{ chapterState().method=e.target.value; save(); renderChapter(); }));
    ['alpha','gamma','epsilon'].forEach(id=>$(`s2a-${id}`).addEventListener('input',e=>{ $(`s2a-${id}-value`).textContent=Number(e.target.value).toFixed(2); if(id==='epsilon') renderStats(); }));
    $('s2a-seed').addEventListener('change',e=>{ const value=Math.max(1,Math.min(4294967295,Math.floor(Number(e.target.value)||42))); e.target.value=String(value); const model=activeModel(); if(model.episodes){ e.target.value=String(model.seed); setHelp('Clear the current model before changing its seed.'); return; } model.seed=value; model.rngState=value; save(); });
    $('s2a-train-200').addEventListener('click',()=>trainEpisodes(200));
    $('s2a-train-800').addEventListener('click',()=>trainEpisodes(800));
    $('s2a-show-policy').addEventListener('click',()=>{ chapterState().showPolicy=!chapterState().showPolicy; chapterState().route=null; renderBoard(); });
    $('s2a-show-route').addEventListener('click',showRoute);
    $('s2a-clear').addEventListener('click',resetModel);
    $('s2a-manual').addEventListener('click',startManual);
    $('s2a-manual-reset').addEventListener('click',startManual);
    document.querySelectorAll('[data-s2a-action]').forEach(btn=>btn.addEventListener('click',()=>manualMove(Number(btn.dataset.s2aAction))));
    $('s2a-experiment-btn').addEventListener('click',runExperiment);
    $('s2a-inspector-mask').addEventListener('change',e=>{ chapterState().inspectExtra=Number(e.target.value)||0; renderInspector(); renderBoard(); });
    window.addEventListener('keydown',event=>{ if($('season2-screen')?.hidden || $('s2a-lab').hidden || state.storyOpen || !chapterState().manual || event.ctrlKey || event.metaKey || event.altKey) return; const tag=event.target?.tagName?.toLowerCase(); if(['input','textarea','select'].includes(tag)) return; const map={arrowup:0,w:0,arrowright:1,d:1,arrowdown:2,s:2,arrowleft:3,a:3}; const action=map[event.key.toLowerCase()]; if(action===undefined) return; event.preventDefault(); manualMove(action); });
    renderChapter();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', connect, {once:true}); else connect();
})();
