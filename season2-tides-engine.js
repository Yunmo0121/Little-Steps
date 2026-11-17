/* Little Steps · Season Two / Chapter Two — The Tidal Island
   A transparent deterministic, time-expanded MDP. Five actions, including WAIT.
   Public API supports browsers and Node.js for reproducibility tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TidalIslandEngine = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const ROWS = [
    '.........',
    '..##..G..',
    '...#.....',
    'S..T..~..',
    '...#.....',
    '..##.....',
    '.........'
  ];
  const HEIGHT = ROWS.length, WIDTH = ROWS[0].length, PHASE_COUNT = 4;
  const PHASES = ['Low · ebb', 'Low · turning', 'High · rising', 'High · peak'];
  const ACTIONS = ['North', 'East', 'South', 'West', 'Wait'];
  const DIRS = [[-1,0],[0,1],[1,0],[0,-1],[0,0]];
  const ACTION_COUNT = ACTIONS.length;
  const STATE_COUNT = WIDTH * HEIGHT * PHASE_COUNT;
  const MAX_STEPS = 76;
  const position = (r,c) => r * WIDTH + c;
  const rc = p => [Math.floor(p / WIDTH), p % WIDTH];
  const encode = (pos,phase) => pos * PHASE_COUNT + phase;
  const decode = s => ({pos:Math.floor(s / PHASE_COUNT), phase:s % PHASE_COUNT});
  const tile = pos => {const [r,c]=rc(pos);return ROWS[r]?.[c] || '#';};
  const START = position(3,0), GOAL = position(1,6), INITIAL_PHASE = 0;
  const INITIAL = encode(START, INITIAL_PHASE);
  const isLow = phase => phase===0 || phase===1;
  const costFor = kind => kind==='~' ? 2 : 1;
  const inBounds = (r,c) => r>=0 && r<HEIGHT && c>=0 && c<WIDTH;
  function transition(s, action) {
    if(!Number.isInteger(s)||s<0||s>=STATE_COUNT||!Number.isInteger(action)||action<0||action>=ACTION_COUNT) throw Error('Invalid tide state or action');
    const {pos,phase}=decode(s); const after=(phase+1)%PHASE_COUNT;
    const [r,c]=rc(pos), [dr,dc]=DIRS[action];
    const nr=r+dr, nc=c+dc, waiting=action===4;
    let nextPos=pos, reason='move', hit=false, cost=0;
    if(waiting){reason='wait';}
    else if(!inBounds(nr,nc)||ROWS[nr][nc]==='#'){
      hit=true;reason='reef';
    } else if(ROWS[nr][nc]==='T' && !isLow(phase)) {
      hit=true;reason='high-tide';
    } else {
      nextPos=position(nr,nc);cost=costFor(ROWS[nr][nc]);
    }
    const swept=tile(nextPos)==='T' && !isLow(after);
    if(swept){nextPos=START;reason='swept';cost=0;}
    const done=nextPos===GOAL;
    const reward=done ? 40 : swept ? -5.5 : hit ? -2.5 : waiting ? -0.28 : -0.28 - 0.24 * cost;
    return {next:encode(nextPos,after),pos:nextPos,phase:after,reward,cost:waiting?0:cost,done,hit,swept,waiting,reason};
  }
  function emptyQ(){return Array.from({length:STATE_COUNT},()=>Array(ACTION_COUNT).fill(0));}
  const maxQ=(q,s)=>Math.max(...q[s]);
  function bestAction(q,s,random=Math.random){
    const row=q[s],high=Math.max(...row);const actions=[];
    for(let i=0;i<ACTION_COUNT;i++)if(Math.abs(row[i]-high)<1e-9) actions.push(i);
    return actions[Math.floor(random()*actions.length)];
  }
  function epsilonChoice(q,s,eps,random){return random()<eps ? Math.floor(random()*ACTION_COUNT) : bestAction(q,s,random);}
  function runEpisode(q,method='qlearning',options={},random=Math.random){
    if(method!=='qlearning'&&method!=='sarsa') throw Error('Unknown RL method');
    const alpha=options.alpha??0.24,gamma=options.gamma??0.97,epsilon=options.epsilon??0.5;
    let s=INITIAL,steps=0,returnValue=0,cost=0,waits=0,success=false;
    let a=epsilonChoice(q,s,epsilon,random);
    for(let t=0;t<MAX_STEPS;t++){
      const result=transition(s,a);steps++;cost+=result.cost;returnValue+=result.reward;
      if(a===4)waits++;
      const nextAction=result.done?null:epsilonChoice(q,result.next,epsilon,random);
      const future=result.done?0:(method==='sarsa'?q[result.next][nextAction]:maxQ(q,result.next));
      q[s][a]+=alpha*(result.reward+gamma*future-q[s][a]);
      s=result.next;
      if(result.done){success=true;break;}
      a=nextAction;
    }
    return {success,steps,cost,waits,returnValue};
  }
  function train(q,episodes=500,method='qlearning',options={},random=Math.random){
    const history=[],startAt=options.startAt??0;
    for(let i=0;i<episodes;i++){
      const epsilon=Math.max(options.minEpsilon??.045,(options.epsilon??.65)*Math.pow(options.decay??.994,startAt+i));
      history.push({...runEpisode(q,method,{...options,epsilon},random),epsilon});
    }
    return history;
  }
  function rollout(q,random=()=>0.11){
    let s=INITIAL,total=0,cost=0,waits=0;const route=[s],actions=[];
    const seen=new Set();
    for(let i=0;i<MAX_STEPS;i++){
      const a=bestAction(q,s,random);const key=`${s}/${a}`;
      if(seen.has(key))return {success:false,visits:route,actions,steps:actions.length,cost,waits,returnValue:total,loop:true};
      seen.add(key);
      const t=transition(s,a);cost+=t.cost;total+=t.reward;if(a===4)waits++;
      s=t.next;route.push(s);actions.push(a);
      if(t.done)return {success:true,visits:route,actions,steps:actions.length,cost,waits,returnValue:total};
    }
    return {success:false,visits:route,actions,steps:actions.length,cost,waits,returnValue:total};
  }
  /* Full tide-aware graph searches; WAIT is a genuine graph edge. Does not teach the agent the answer. */
  function search(weighted=false){
    const distance=Array(STATE_COUNT).fill(Infinity),prev=Array(STATE_COUNT).fill(null);
    const frontier=[{s:INITIAL,d:0}];distance[INITIAL]=0;
    let finalState=null,explored=0;
    while(frontier.length){
      frontier.sort((a,b)=>a.d-b.d);const {s,d}=frontier.shift();
      if(d>distance[s]+1e-10)continue;
      explored++;
      if(decode(s).pos===GOAL){finalState=s;break;}
      for(let a=0;a<ACTION_COUNT;a++){
        const t=transition(s,a);if(t.hit||t.swept)continue;
        const edge=weighted?(a===4?.65:Math.max(1,t.cost)):1;
        const nd=d+edge;
        if(nd+1e-9<distance[t.next]){
          distance[t.next]=nd;prev[t.next]={s,a};frontier.push({s:t.next,d:nd});
        }
      }
    }
    if(finalState===null)return null;
    const visits=[finalState],actions=[];let s=finalState,waits=0,cost=0;
    while(s!==INITIAL){const p=prev[s];if(!p)return null;
      actions.push(p.a);if(p.a===4)waits++;cost+=transition(p.s,p.a).cost;s=p.s;visits.push(s);
    }
    visits.reverse();actions.reverse();
    return {success:true,visits,actions,steps:actions.length,waits,cost,effort:distance[finalState],explored};
  }
  function createRng(seed=1){let n=seed>>>0;const rand=()=>{n=(1664525*n+1013904223)>>>0;return n/4294967296;};rand.state=()=>n;return rand;}
  return {ROWS,HEIGHT,WIDTH,PHASES,PHASE_COUNT,ACTIONS,ACTION_COUNT,STATE_COUNT,DIRS,MAX_STEPS,START,GOAL,INITIAL,INITIAL_PHASE,encode,decode,rc,position,tile,isLow,transition,emptyQ,bestAction,runEpisode,train,rollout,search,createRng};
});
