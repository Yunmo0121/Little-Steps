/* Little Steps · The Enchanted Isles — self-contained tabular RL environment.
   Works in browsers and Node.js; all values shown in the lab come from this engine. */
(function(root,factory){
  const API=factory();
  if(typeof module==='object' && module.exports) module.exports=API;
  if(root)root.SeasonTwoEngine=API;
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  const ROWS=[
    '.........',
    '...#...G.',
    '..##..~..',
    '..#..~~..',
    '..#......',
    '.S..>....',
    '...^^....'
  ];
  const HEIGHT=ROWS.length, WIDTH=ROWS[0].length;
  const DIRS=[[-1,0],[0,1],[1,0],[0,-1]];
  const ACTIONS=['North','East','South','West'];
  const at=(r,c)=>r*WIDTH+c;
  const rc=s=>[Math.floor(s/WIDTH),s%WIDTH];
  const tile=s=>{ const [r,c]=rc(s); return ROWS[r]?.[c] || '#'; };
  const START=at(5,1), GOAL=at(1,7);
  const ACTION_COUNT=4;
  const STATE_COUNT=WIDTH*HEIGHT;
  const MAX_STEPS=72;
  const terrainCost=t=>t==='~'?4:t==='^'?2:1;
  const inBounds=(r,c)=>r>=0&&r<HEIGHT&&c>=0&&c<WIDTH;
  function transition(s,a){
    const [r,c]=rc(s);
    const [dr,dc]=DIRS[a] || DIRS[0];
    const nr=r+dr,nc=c+dc;
    if(!inBounds(nr,nc)||ROWS[nr][nc]==='#')return {next:s,reward:-3.5,cost:0,hit:true,done:false,current:false};
    let next=at(nr,nc); let current=false;
    // A west-to-east current carries the boat one extra tile when the next tile is safe.
    if(ROWS[nr][nc]==='>'&&nc+1<WIDTH&&ROWS[nr][nc+1]!=='#'){
      next=at(nr,nc+1);current=true;
    }
    const cost=terrainCost(ROWS[nr][nc]);
    const done=next===GOAL;
    return {next,reward:done?40:-0.35*cost-0.15,cost,hit:false,done,current};
  }
  function emptyQ(){return Array.from({length:STATE_COUNT},()=>[0,0,0,0]);}
  const maxQ=(q,s)=>Math.max(...q[s]);
  function bestAction(q,s,rand=Math.random){
    const vals=q[s];const best=Math.max(...vals);
    const candidates=[0,1,2,3].filter(a=>Math.abs(vals[a]-best)<1e-9);
    return candidates[Math.floor(rand()*candidates.length)];
  }
  function runEpisode(q,method='qlearning',params={},rand=Math.random){
    const alpha=params.alpha??0.24,gamma=params.gamma??0.94,epsilon=params.epsilon??0.3;
    let state=START,total=0,cost=0,steps=0,success=false;
    let action=rand()<epsilon?Math.floor(rand()*4):bestAction(q,state,rand);
    for(let i=0;i<MAX_STEPS;i++){
      const step=transition(state,action);steps++;cost+=step.cost;total+=step.reward;
      const nextAction=rand()<epsilon?Math.floor(rand()*4):bestAction(q,step.next,rand);
      const nextValue=step.done?0:(method==='sarsa'?q[step.next][nextAction]:maxQ(q,step.next));
      q[state][action]+=alpha*(step.reward+gamma*nextValue-q[state][action]);
      if(step.done){success=true;state=step.next;break;}
      state=step.next;action=nextAction;
    }
    return {success,steps,cost,returnValue:total};
  }
  function train(q,episodes=400,method='qlearning',options={},rand=Math.random){
    const rows=[];const startAt=options.startAt||0;
    for(let i=0;i<episodes;i++){
      const iteration=startAt+i;
      const epsilon=Math.max(options.minEpsilon??0.045,(options.epsilon??0.6)*Math.pow(options.decay??0.992,iteration));
      rows.push({...runEpisode(q,method,{alpha:options.alpha??0.24,gamma:options.gamma??0.94,epsilon},rand),epsilon});
    }
    return rows;
  }
  function rollout(q,rand=Math.random){
    const visits=[START];let state=START,returnValue=0,cost=0,hits=0,steps=0;
    const seen=new Set();
    for(let i=0;i<MAX_STEPS;i++){
      const a=bestAction(q,state,rand);
      const t=transition(state,a);
      steps++;returnValue+=t.reward;cost+=t.cost;if(t.hit)hits++;
      state=t.next;visits.push(state);
      if(t.done)return {success:true,visits,steps,cost,returnValue,hits};
      // Deterministic policy loop: stop instead of tracing 72 repeated states.
      if(seen.has(`${state}:${a}`)&&i>8)break;
      seen.add(`${state}:${a}`);
    }
    return {success:false,visits,steps,cost,returnValue,hits};
  }
  function search(weighted=false){
    const best=Array(STATE_COUNT).fill(Infinity);
    const predecessor=Array(STATE_COUNT).fill(null);
    best[START]=0;
    const frontier=[{s:START,d:0}];let explored=0;
    while(frontier.length){
      frontier.sort((a,b)=>a.d-b.d);
      const {s,d}=frontier.shift();
      if(d!==best[s])continue;explored++;
      if(s===GOAL)break;
      for(let a=0;a<4;a++){
        const t=transition(s,a);
        if(t.hit)continue;
        const nd=d+(weighted?t.cost:1);
        if(nd>=best[t.next])continue;
        best[t.next]=nd;predecessor[t.next]={prev:s,action:a};
        frontier.push({s:t.next,d:nd});
      }
    }
    if(!Number.isFinite(best[GOAL]))return null;
    let s=GOAL,cost=0;
    const visits=[GOAL],actions=[];
    while(s!==START){
      const prev=predecessor[s];
      if(!prev)return null;
      actions.push(prev.action);cost+=transition(prev.prev,prev.action).cost;
      s=prev.prev;visits.push(s);
    }
    visits.reverse();actions.reverse();
    return {visits,actions,steps:actions.length,cost,explored,success:true};
  }
  function createRng(seed=1){
    let n=seed>>>0;
    const next=()=>{n=(1664525*n+1013904223)>>>0;return n/4294967296;};
    next.state=()=>n;
    return next;
  }
  return {ROWS,WIDTH,HEIGHT,START,GOAL,DIRS,ACTIONS,MAX_STEPS,STATE_COUNT,tile,rc,at,transition,
    emptyQ,bestAction,runEpisode,train,rollout,search,createRng};
});
