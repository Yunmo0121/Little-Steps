'use strict';
const assert=require('node:assert/strict');
const E=require('../season2-engine.js');
assert.equal(E.ROWS.length,7);
assert.equal(E.WIDTH,9);
assert.equal(E.START,E.at(5,1));
assert.equal(E.GOAL,E.at(1,7));
const collision=E.transition(E.START,3); // west is open: not collision
assert.equal(collision.hit,false);
const reef=E.transition(E.at(1,2),1); // east into reef at 1,3
assert.equal(reef.hit,true);
assert.equal(reef.next,E.at(1,2));
assert.equal(reef.reward,-3.5);
const current=E.transition(E.at(5,3),1); // enter (5,4), carried to (5,5)
assert.equal(current.current,true);
assert.equal(current.next,E.at(5,5));
assert.equal(current.cost,1);
const goal=E.transition(E.at(1,6),1);
assert.equal(goal.done,true);
assert.equal(goal.reward,40);
const bfs=E.search(),dijkstra=E.search(true);
assert.equal(bfs.steps,9);
assert.equal(bfs.cost,12);
assert.equal(dijkstra.steps,9);
assert.equal(dijkstra.cost,9);
assert(dijkstra.cost<bfs.cost);
// Bellman update from a blank table must use the actual reward, no hard-coded animation.
let q=E.emptyQ();
const one=E.runEpisode(q,'qlearning',{alpha:0.3,gamma:0.95,epsilon:1},E.createRng(65));
assert(one.steps>0);
assert(q.some(row=>row.some(v=>v!==0)),'Training did not modify Q');
for(const method of ['qlearning','sarsa']){
  const seed=42;
  const qOne=E.emptyQ(),randomOne=E.createRng(seed);
  const qTwo=E.emptyQ(),randomTwo=E.createRng(seed);
  const options={gamma:.97,alpha:.24,epsilon:.60,decay:.992,minEpsilon:.045};
  const oneBatch=E.train(qOne,1000,method,options,randomOne);
  const chunkA=E.train(qTwo,200,method,{...options,startAt:0},randomTwo);
  const chunkB=E.train(qTwo,800,method,{...options,startAt:200},randomTwo);
  assert.deepEqual(qOne,qTwo,`${method} did not reproduce across training batches`);
  assert.deepEqual(oneBatch,[...chunkA,...chunkB]);
  const final=evaluate(qOne);
  assert(final.success,`${method} did not learn the lighthouse route`);
  assert(oneBatch.slice(-50).filter(row=>row.success).length>=45,`${method} training success too low`);
  console.log(method,`last-50 wins ${oneBatch.slice(-50).filter(row=>row.success).length}, greedy ${final.steps} moves, cost ${final.cost}`);
}
function evaluate(q){return E.rollout(q,()=>0.15);}
console.log('PASS — Season Two environment, currents, BFS/Dijkstra, Q-Learning, SARSA, seeded reproducibility');
