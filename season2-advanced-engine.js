
(function(root){
  'use strict';
  const ACTIONS=[[-1,0],[0,1],[1,0],[0,-1]];
  const ACTION_LABELS=['North','East','South','West'];
  const ACTION_SYMBOLS=['↑','→','↓','←'];

  function createRng(seed){
    let s=(seed>>>0)||1;
    return {
      next(){ s^=(s<<13); s^=(s>>>17); s^=(s<<5); return ((s>>>0)/4294967296); },
      int(n){ return Math.floor(this.next()*n); },
      state(){ return s>>>0; }
    };
  }
  function clamp(n,a,b){ return Math.max(a,Math.min(b,n)); }
  function emptyQ(stateCount){ return Array.from({length:stateCount},()=>Array(4).fill(0)); }
  function weightedChoice(weighted,rng){
    const x=rng.next();
    let acc=0;
    for(const [value,p] of weighted){ acc+=p; if(x<=acc+1e-12) return value; }
    return weighted[weighted.length-1][0];
  }
  function argmax(values,rng){
    let best=-Infinity, idxs=[];
    values.forEach((v,i)=>{
      if(v>best+1e-9){ best=v; idxs=[i]; }
      else if(Math.abs(v-best)<1e-9){ idxs.push(i); }
    });
    return idxs.length===1?idxs[0]:idxs[rng.int(idxs.length)];
  }
  function epsilonGreedy(q,state,epsilon,rng){
    if(rng.next()<epsilon) return rng.int(4);
    return argmax(q[state],rng);
  }
  function average(arr,selector=x=>x){ return arr.length?arr.reduce((a,x)=>a+selector(x),0)/arr.length:0; }

  function makeArt(svg){ return svg.trim(); }

  const chapterConfigs = {
    misty: {
      id:'misty',
      shortName:'Misty Reef',
      title:'Misty Reef',
      overline:'Chapter 03 / Misty Reef',
      labTitle:'The Secret of the Mist',
      subtitle:'Follow the distant silver bell through hidden coral reefs. Explore nearby waters, reveal safe passages, and learn when to try somewhere new—or trust a route Kristie already knows.',
      notes:'Objective: reach the old silver sea bell, not another lighthouse. This is a fog-of-war teaching mechanic with tabular RL over the underlying full state; the visual fog alone does not make it a POMDP.',
      goalName:'Silver sea bell',
      goalSymbol:'K',
      map:[
        '...#..K',
        '.#..#..',
        '...~...',
        '.##..#.',
        '...#...',
        '.#.....',
        'S..~#..'
      ],
      terrainCosts:{'.':1,'S':1,'K':1,'~':2},
      goalReward:42,
      stepPenalty:-0.55,
      blockedPenalty:-2.8,
      discoveryBonus:0.18,
      maxSteps:36,
      visibleRadius:1,
      kind:'misty',
      experimentLabel:'Compare ε values',
      experimentDescription:'Train three fresh agents with different starting ε values, then compare success, collisions, reward, and map discovery over their final 60 episodes.',
      epsilons:[0.10,0.35,0.70],
      storyPages:[
        {title:'A Bell in the Fog', text:'North of Tidal Island, Kristie heard a soft silver bell ringing through the mist. The sound came from somewhere beyond the coral reefs, but the sea ahead was hidden.', quote:'“I can hear it... but where is it coming from?”', image:'assets/season2-storybook/s2-ch03-story-page-01.webp'},
        {title:'The Hidden Passage', text:'The fog concealed narrow channels and sharp rocks. With every careful turn of her little wooden boat, Kristie uncovered another piece of the sea—and learned which paths were safe.', quote:'“Maybe every wrong turn can teach me something.”', image:'assets/season2-storybook/s2-ch03-story-page-02.webp'},
        {title:'The Silver Bell', text:'At last, the mist lifted to reveal an ancient silver sea bell above a flower-lined cove. Kristie had found both the mysterious sound and a safe way through the reef.', quote:'“I didn’t need to see the whole way. I just needed to keep exploring.”', image:'assets/season2-storybook/s2-ch03-story-page-03.webp'}
      ]
    },
    windward: {
      id:'windward', shortName:'Windward Passage', title:'Windward Passage', overline:'Chapter 04 / Windward Passage',
      labTitle:'Learning when the wind refuses to cooperate',
      subtitle:'A gust can push Kristie away from the square she intended. This chapter focuses on stochastic transitions, robust policies, and evaluation over many random seeds.',
      notes:'This environment is stochastic: the same action can lead to different outcomes under different gust samples. Compare performance over many rollouts, not just one lucky path.',
      map:[
        '...#..G',
        '.>..#..',
        '..~....',
        '.#..>.#',
        '...#...',
        '.#..~..',
        'S...#..'
      ],
      terrainCosts:{'.':1,'S':1,'G':1,'~':2,'>':1}, goalReward:48, stepPenalty:-0.62, blockedPenalty:-3.2, maxSteps:38, visibleRadius:6, kind:'windward',
      experimentLabel:'Evaluate across gust seeds',
      experimentDescription:'Run the learned greedy policy over many random seeds. This reveals how robust the policy is when the wind introduces uncertainty.',
      storyPages:[
        {title:'A narrow passage', text:'South-east of Misty Reef, the sea opened into a long passage between cliffs. The water looked clear—but the wind kept changing its mind.', quote:'“So even the same step can end somewhere unexpected?”', image:'assets/season2-storybook/s2-ch04-story-page-01.webp'},
        {title:'Planning is not enough', text:'In the garden, once Kristie had a route, she could follow it. Here, a gust could nudge the boat sideways. Good learning meant doing well on average—not just on a perfect day.', quote:'“I should judge a route by how often it helps, not only by the happiest accident.”', image:'assets/season2-storybook/s2-ch04-story-page-02.webp'},
        {title:'Testing a sturdy policy', text:'Kristie filled her notebook with repeated voyages. Instead of asking “Did it work once?”, she began asking, “How often does it work across many winds?”', quote:'“A strong learner should stay steady, even when the breeze changes.”', image:'assets/season2-storybook/s2-ch04-story-page-03.webp'}
      ]
    },
    starharbor: {
      id:'starharbor', shortName:'Starharbor', title:'Starharbor', overline:'Chapter 05 / Starharbor',
      labTitle:'A long voyage with many goals',
      subtitle:'Kristie must visit three sea beacons and then return to the harbor. This chapter focuses on multi-goal reinforcement learning, sparse rewards, and simple generalisation probes from different starting docks.',
      notes:'The state includes both position and which beacons have been collected. Reward is sparse: new beacons matter, and the voyage is complete only after Kristie returns home with all three.',
      map:[
        '..A#..B',
        '.#.....',
        '...#...',
        '..S....',
        '...#...',
        '.#.....',
        '..C#...'
      ],
      terrainCosts:{'.':1,'S':1,'A':1,'B':1,'C':1}, goalReward:64, beaconReward:14, stepPenalty:-0.52, blockedPenalty:-2.8, maxSteps:52, visibleRadius:6, kind:'star',
      experimentLabel:'Run generalisation probes',
      experimentDescription:'Evaluate the learned greedy policy from three different dock squares. The agent was trained from the main harbor, but a better representation should transfer to nearby starting positions.',
      probeStartLabels:['Main harbor','North dock','South dock'],
      storyPages:[
        {title:'The harbor of three beacons', text:'At the last island, three sea beacons shimmered in different corners of the harbor. Kristie would have to visit each one—and still find her way back home.', quote:'“This time, I cannot simply sail to one light. I have to remember a whole journey.”', image:'assets/season2-storybook/s2-ch05-story-page-01.webp'},
        {title:'Remembering what matters', text:'A good voyage was no longer about one destination. Kristie now had to remember which beacons she had already visited, so that she would not drift in circles forever.', quote:'“I need a state that remembers more than where I am.”', image:'assets/season2-storybook/s2-ch05-story-page-02.webp'},
        {title:'A map that turns its own pages', text:'When the last beacon glowed and the harbor fell quiet, Kristie found a strange little atlas tucked beneath the pier. Its pages turned by themselves—and beyond the sea she glimpsed a school floating among the clouds.', quote:'“If this map can turn itself... where will it take me next?”', image:'assets/season2-storybook/s2-ch05-story-page-03.webp'}
      ]
    }
  };

  function createEnvironment(cfg){
    const board=cfg.map.map(r=>r.split(''));
    const H=board.length, W=board[0].length;
    const baseCount=W*H;
    function rc(base){ return [Math.floor(base/W), base%W]; }
    function idx(r,c){ return r*W+c; }
    function tile(base){ const [r,c]=rc(base); return board[r][c]; }
    function find(ch){ for(let r=0;r<H;r++) for(let c=0;c<W;c++) if(board[r][c]===ch) return idx(r,c); return -1; }
    const startBase=find('S');
    const goalBase=find(cfg.goalSymbol || 'G');
    const beaconBases=['A','B','C'].map(find).filter(v=>v>=0);
    const accessibleBases=[];
    for(let b=0;b<baseCount;b++) if(tile(b)!=='#') accessibleBases.push(b);
    const accessibleCount=accessibleBases.length;
    const probeBases = cfg.kind==='star' ? [startBase, idx(1,5), idx(5,1)].filter(b=> tile(b)!=='#') : [];
    function encode(base,extra=0){ return cfg.kind==='star' ? base + extra*baseCount : base; }
    function decode(state){
      if(cfg.kind==='star') return {base: state%baseCount, mask: Math.floor(state/baseCount)};
      return {base: state, mask: 0};
    }
    const stateCount = cfg.kind==='star' ? baseCount*8 : baseCount;
    function reset(startOverride){ return encode(startOverride ?? startBase, 0); }
    function inBounds(r,c){ return r>=0 && r<H && c>=0 && c<W; }
    function applyMove(base,action){
      const [r,c]=rc(base); const [dr,dc]=ACTIONS[action]; const nr=r+dr,nc=c+dc;
      if(!inBounds(nr,nc)) return {next:base,hit:true};
      const nb=idx(nr,nc);
      if(tile(nb)==='#') return {next:base,hit:true};
      return {next:nb,hit:false};
    }
    function sampleWindAction(base,intended,rng){
      const t=tile(base);
      if(t==='>') return weightedChoice([[intended,0.45],[1,0.35],[(intended+1)%4,0.10],[(intended+3)%4,0.10]],rng);
      if(t==='~') return weightedChoice([[intended,0.62],[(intended+1)%4,0.19],[(intended+3)%4,0.19]],rng);
      return weightedChoice([[intended,0.72],[(intended+1)%4,0.14],[(intended+3)%4,0.14]],rng);
    }
    function labelMask(mask){
      if(cfg.kind!=='star') return 'No beacons';
      const labels=[]; if(mask&1) labels.push('A'); if(mask&2) labels.push('B'); if(mask&4) labels.push('C');
      return labels.length?`Beacons ${labels.join(', ')}`:'No beacons';
    }
    function step(state,action,rng,episode){
      const meta=decode(state);
      const base=meta.base;
      let mask=meta.mask;
      let actualAction=action;
      if(cfg.kind==='windward') actualAction=sampleWindAction(base,action,rng);
      const moved=applyMove(base,actualAction);
      let next=moved.next;
      let reward=cfg.stepPenalty - 0.18*(cfg.terrainCosts[tile(next)]||1);
      let hit=moved.hit;
      let done=false;
      let message='';
      let discoveredAdded=0;
      if(hit){ reward=cfg.blockedPenalty; next=base; message='A rock or cliff blocked the way.'; }
      else if(cfg.kind==='windward' && actualAction!==action){ message='A gust nudged the boat off the intended route.'; }
      const t=tile(next);
      if(cfg.kind==='misty' && episode?.discovered && !episode.discovered.has(next)){
        episode.discovered.add(next); discoveredAdded=1; reward += cfg.discoveryBonus;
      }
      if(cfg.kind==='star'){
        const beforeMask=mask;
        if(t==='A') mask|=1;
        if(t==='B') mask|=2;
        if(t==='C') mask|=4;
        if(mask!==beforeMask) reward += cfg.beaconReward;
        if(mask===7 && next===startBase){ reward += cfg.goalReward; done=true; }
      } else if(next===goalBase){ reward += cfg.goalReward; done=true; }
      return {state:encode(next,mask), reward, done, hit, actualAction, discoveredAdded, base:next, mask, message};
    }
    function visibleBases(base, discoveredSet){
      if(cfg.kind!=='misty') return new Set(accessibleBases);
      const visible=new Set(discoveredSet||[]);
      const [r0,c0]=rc(base);
      for(let r=0;r<H;r++) for(let c=0;c<W;c++){
        if(Math.abs(r-r0)+Math.abs(c-c0)<=cfg.visibleRadius) visible.add(idx(r,c));
      }
      return visible;
    }
    function rollout(q,opts={}){
      const rng=createRng((opts.seed||42)>>>0);
      let s=reset(opts.startBase);
      const visited=[decode(s).base];
      const discovered=new Set([decode(s).base]);
      let total=0, collisions=0;
      for(let i=0;i<cfg.maxSteps;i++){
        const a=opts.exploreEpsilon?epsilonGreedy(q,s,opts.exploreEpsilon,rng):argmax(q[s],rng);
        const res=step(s,a,rng,{discovered});
        total+=res.reward; if(res.hit) collisions++; s=res.state; visited.push(res.base);
        if(res.done) return {success:true, steps:i+1, returnValue:total, collisions, visited, discoveredPct:discovered.size/accessibleCount, finalState:s, mask:decode(s).mask};
      }
      return {success:false, steps:cfg.maxSteps, returnValue:total, collisions, visited, discoveredPct:discovered.size/accessibleCount, finalState:s, mask:decode(s).mask};
    }
    function train(q,episodes,method,options={}){
      const rng=createRng((options.seed||42)>>>0);
      const history=[];
      const alpha=options.alpha ?? 0.25;
      const gamma=options.gamma ?? 0.96;
      const epsilon0=options.epsilon ?? 0.4;
      const epsilonDecay=options.epsilonDecay ?? 0.992;
      const epsilonMin=options.epsilonMin ?? 0.05;
      const startAt=options.startAt ?? 0;
      for(let ep=0; ep<episodes; ep++){
        let s=reset();
        let total=0, collisions=0;
        const discovered=new Set([decode(s).base]);
        let epsilon=Math.max(epsilonMin, epsilon0*Math.pow(epsilonDecay, startAt+ep));
        let action=method==='sarsa'?epsilonGreedy(q,s,epsilon,rng):null;
        let success=false, steps=0;
        for(let t=0;t<cfg.maxSteps;t++){
          if(method==='qlearning') action=epsilonGreedy(q,s,epsilon,rng);
          const res=step(s,action,rng,{discovered});
          total+=res.reward; if(res.hit) collisions++; steps=t+1;
          const ns=res.state;
          if(method==='qlearning'){
            const target=res.reward + (res.done?0:gamma*Math.max(...q[ns]));
            q[s][action] += alpha*(target-q[s][action]);
          } else {
            const nextAction = res.done ? 0 : epsilonGreedy(q,ns,epsilon,rng);
            const target=res.reward + (res.done?0:gamma*q[ns][nextAction]);
            q[s][action] += alpha*(target-q[s][action]);
            action=nextAction;
          }
          s=ns;
          if(res.done){ success=true; break; }
        }
        history.push({success, returnValue:total, collisions, discoveredPct:discovered.size/accessibleCount, steps});
      }
      return {history, nextSeed:rng.state()};
    }
    function compareEpsilons(params={}){
      const rows=[];
      const alpha=params.alpha ?? 0.25, gamma=params.gamma ?? 0.96;
      for(const eps of cfg.epsilons||[]){
        const q=emptyQ(stateCount);
        const trained=train(q,240,'qlearning',{alpha,gamma,epsilon:eps,epsilonDecay:0.995,epsilonMin:0.04,seed:Math.floor(1000+eps*1000)}).history;
        const sample=trained.slice(-60);
        rows.push({epsilon:eps, success:average(sample,x=>x.success?100:0), collisions:average(sample,x=>x.collisions), reward:average(sample,x=>x.returnValue), discovery:average(sample,x=>x.discoveredPct*100)});
      }
      return rows;
    }
    function evaluateSeeds(q){
      const rows=[];
      for(const seed of [11,23,37,59,83,101]){
        const out=rollout(q,{seed});
        rows.push({seed, success:out.success, steps:out.steps, reward:out.returnValue, collisions:out.collisions});
      }
      return {rows, success:average(rows,x=>x.success?100:0), reward:average(rows,x=>x.reward), collisions:average(rows,x=>x.collisions)};
    }
    function generalization(q){
      const rows=[];
      probeBases.forEach((b,i)=>{
        const out=rollout(q,{seed:71+i*17,startBase:b});
        rows.push({label:cfg.probeStartLabels[i]||`Probe ${i+1}`, success:out.success, steps:out.steps, reward:out.returnValue, beacons:out.success?3:Math.max(0,Math.min(3, (decode(out.finalState).mask&1?1:0)+(decode(out.finalState).mask&2?1:0)+(decode(out.finalState).mask&4?1:0)))});
      });
      return rows;
    }
    return {cfg, board, H, W, baseCount, stateCount, startBase, goalBase, accessibleCount, beaconBases, probeBases, rc, idx, tile, reset, decode, encode, step, rollout, train, compareEpsilons, evaluateSeeds, generalization, visibleBases, labelMask, emptyQ:()=>emptyQ(stateCount), ACTIONS:ACTION_LABELS, ACTION_SYMBOLS};
  }

  const api={chapterConfigs, createRng, createEnvironment};
  root.SeasonTwoAdvancedEngine=api;
})(window);
