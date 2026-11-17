const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'season2-advanced-engine.js'),'utf8'),sandbox);
const {chapterConfigs,createEnvironment}=sandbox.window.SeasonTwoAdvancedEngine;
for(const id of ['misty','windward','starharbor']) {
  const cfg = chapterConfigs[id];
  assert.equal(cfg.storyPages.length,3);
  for (const [i,page] of cfg.storyPages.entries()) {
    assert.ok(page.title.length>0 && page.text.length>0 && page.quote.length>0);
    assert.ok(page.image.endsWith(`page-0${i+1}.webp`), `${id} page ${i+1}`);
    assert.ok(fs.statSync(path.join(root,page.image)).size>10_000,`${id} image exists`);
  }
  const env=createEnvironment(cfg);
  assert.ok(env.stateCount>0);
  for(const method of ['qlearning','sarsa']) {
    const q=env.emptyQ();
    const run=env.train(q,60,method,{seed:42});
    assert.equal(run.history.length,60);
    assert.ok(run.history.every(h=>Number.isFinite(h.returnValue) && Number.isFinite(h.discoveredPct)));
  }
}
console.log('PASS — nine story illustrations, chapter mappings, Q-Learning/SARSA training smoke test');
