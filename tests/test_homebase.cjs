// Little Steps v1.2.3 — Cozy Cottage view-switching smoke test.
// Uses the Node.js built-in VM; no browser or third-party packages required.
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');

class MockElement {
  constructor(dataset = {}) {
    this.dataset = dataset;
    this.textContent = '';
    this.hidden = false;
    this.attrs = {};
    this.listeners = {};
    this.classes = new Set();
    this.classList = {
      add: name => this.classes.add(name),
      remove: name => this.classes.delete(name),
      toggle: (name, on) => on ? this.classes.add(name) : this.classes.delete(name)
    };
  }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); }
  emit(name, event = {}) { for (const fn of this.listeners[name] || []) fn(event); }
  focus() { this.focused = true; }
}

const shell = new MockElement({homeView: 'outdoor'});
const buttons = [new MockElement({homeViewButton: 'outdoor'}), new MockElement({homeViewButton: 'indoor'})];
const panels = [new MockElement({homePanel: 'outdoor'}), new MockElement({homePanel: 'indoor'})];
const ids = new Map();
const getId = id => { if (!ids.has(id)) ids.set(id, new MockElement()); return ids.get(id); };
const storage = new Map();
const navigations = [];
const document = {
  readyState: 'complete',
  body: {dataset: {}},
  getElementById: getId,
  querySelector: selector => selector === '.cozy-home-shell' ? shell :
    (selector === '[data-home-view-button="indoor"]' ? buttons[1] :
      selector === '[data-home-view-button="outdoor"]' ? buttons[0] : null),
  querySelectorAll: selector => selector === '[data-home-view-button]' ? buttons :
    selector === '[data-home-panel]' ? panels : []
};
const progress = {stars: {}};
const context = vm.createContext({
  document, progress, console, Set,
  localStorage: {getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value)},
  showScreen: screen => navigations.push(screen)
});
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'home.js'), 'utf8'), context);

assert.equal(shell.dataset.homeView, 'outdoor');
assert.equal(getId('homebase-stars').textContent, '0 / 12');
assert.equal(panels[0].hidden, false);
assert.equal(panels[1].hidden, true);
assert.equal(document.body.dataset.gardenTime, 'day');

buttons[1].emit('click');
assert.equal(shell.dataset.homeView, 'indoor', 'Indoor Loft button should switch views');
assert.equal(buttons[1].attrs['aria-selected'], 'true');
assert.equal(panels[0].hidden, true);
assert.equal(panels[1].hidden, false);
assert.equal(getId('home-note-title').textContent, 'Indoor Loft');
assert.match(getId('home-note-quote').textContent, /dreams grow/i);
assert.equal(storage.get('little-steps-home-view'), 'indoor', 'Chosen home view should be saved');

buttons[1].emit('keydown', {key: 'ArrowLeft', preventDefault() {}});
assert.equal(shell.dataset.homeView, 'outdoor', 'Arrow key should switch view tabs');
assert.equal(panels[0].hidden, false);

progress.stars = {2: [1,2,3], 3: [1,2,3], 4: [1,2,3], 5: [1,2,3]};
vm.runInContext('renderHomeBase()', context);
assert.equal(getId('homebase-stars').textContent, '12 / 12');

getId('corner-visit-home').emit('click');
assert.equal(navigations.at(-1), 'homebase');
getId('home-back').emit('click');
assert.equal(navigations.at(-1), 'menu');
getId('home-visit-chapters').emit('click');
assert.equal(navigations.at(-1), 'chapters');
getId('home-open-roadmap').emit('click');
assert.equal(navigations.at(-1), 'diary');

assert.equal(document.body.dataset.gardenTime, 'day', 'Night mode is not present in v1.2.3');
console.log('PASS — Cozy Cottage outdoor/indoor tabs, keyboard, quote, stars, storage and navigation');
