const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname,'..');
const sandbox = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'season2-advanced-engine.js'),'utf8'),sandbox);
const {chapterConfigs,createEnvironment}=sandbox.window.SeasonTwoAdvancedEngine;
const cfg=chapterConfigs.misty;
const env=createEnvironment(cfg);
assert.equal(cfg.goalName,'Silver sea bell');
assert.equal(cfg.map[0].at(-1),'K');
assert.equal(env.goalBase,6);
assert.equal(env.tile(env.goalBase),'K');
assert.equal(cfg.storyPages.length,3);
assert.deepEqual(Array.from(cfg.storyPages,p=>p.title),['A Bell in the Fog','The Hidden Passage','The Silver Bell']);
for(const page of cfg.storyPages){
  assert.ok(!/lighthouse/i.test(page.text+page.title+page.quote));
  assert.ok(fs.statSync(path.join(root,page.image)).size>100000);
}
const app=fs.readFileSync(path.join(root,'season2-advanced.js'),'utf8');
assert.ok(app.includes("if(tile==='K') btn.classList.add('is-silver-bell');"));
assert.ok(app.includes('Silver bell found') || app.includes('Silver Bell'));
assert.ok(fs.existsSync(path.join(root,'assets/season2-storybook/silver-sea-bell.svg')));
for (const method of ['qlearning','sarsa']){
  const q=env.emptyQ();
  const out=env.train(q,1500,method,{seed:42,alpha:.24,gamma:.96,epsilon:.55});
  assert.equal(out.history.length,1500);
  const result=env.rollout(q,{seed:73});
  console.log(method,'success',result.success,'steps',result.steps,'reward',result.returnValue.toFixed(1));
  assert.ok(result.success,`${method} greedy path should reach the silver bell`);
  assert.equal(env.decode(result.finalState).base,env.goalBase);
}
for(const chapterId of ['windward','starharbor']){
  const env2=createEnvironment(chapterConfigs[chapterId]);
  assert.ok(env2.stateCount>0);
  assert.equal(chapterConfigs[chapterId].storyPages.length,3);
}
console.log('PASS — chapter 03 silver bell story, images, goal icon and RL training');
