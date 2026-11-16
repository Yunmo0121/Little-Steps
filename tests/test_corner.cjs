// Tests the V1.0 Garden Corner against the same saved-progress representation
// used by the other seasons. No npm dependencies are required.
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const code=fs.readFileSync(require('node:path').join(__dirname,'../app.js'),'utf8');
const match=code.match(/(function renderLittleGardenCorner\(\)\{[\s\S]*?\n\})\nfunction saveProgress\(/);
assert.ok(match,'Garden Corner rendering function exists');
function render(progress,chapter){
  const elems=Object.fromEntries(['#little-garden-corner','#corner-stars','#corner-clovers','#corner-pages','#corner-progress-note','#corner-message'].map(key=>[key,{textContent:'',dataset:{}}]));
  const context={progress,activeChapter:chapter,document:{querySelector:s=>elems[s]}};
  vm.runInNewContext(match[1]+';renderLittleGardenCorner()',context);
  return Object.fromEntries(Object.entries(elems).map(([key,val])=>[key,val.textContent]));
}
let result=render({completedChapters:[],stars:{}},1);
assert.equal(result['#corner-stars'],'0 / 12');
assert.equal(result['#corner-clovers'],'0 / 1');
assert.equal(result['#corner-pages'],'0 / 5');
result=render({completedChapters:[1,2],stars:{2:[1,3]}},2);
assert.equal(result['#corner-stars'],'2 / 12');
assert.equal(result['#corner-clovers'],'1 / 1');
assert.equal(result['#corner-pages'],'2 / 5');
assert.match(result['#corner-message'],/longer path/);
result=render({completedChapters:[1,2,3,4,5],stars:{2:[1,2,3],3:[1,2,3],4:[1,2,3],5:[1,2,3]}},5);
assert.equal(result['#corner-stars'],'12 / 12');
assert.equal(result['#corner-clovers'],'1 / 1');
assert.equal(result['#corner-pages'],'5 / 5');
assert.match(result['#corner-progress-note'],/complete/);
console.log('PASS — Little Garden Corner saved treasures and chapter quotes');
