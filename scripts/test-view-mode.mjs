import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source = readFileSync(new URL('../assets/view-mode.js', import.meta.url), 'utf8');
const key = 'heycheng:view-mode';

class Element {
  constructor(tag) { this.tag = tag; this.dataset = {}; this.children = []; this.handlers = new Map(); this.attributes = {}; this.value = ''; this.textContent = ''; }
  append(...nodes) { this.children.push(...nodes); }
  setAttribute(name, value) { this.attributes[name] = value; }
  addEventListener(type, listener) { this.handlers.set(type, listener); }
  querySelector(selector) { return descendants(this).find(node => matches(node, selector)) || null; }
}
const descendants = node => node.children.flatMap(child => [child, ...descendants(child)]);
const matches = (node, selector) => Object.hasOwn(node.dataset, {
  '[data-view-mode-host]': 'viewModeHost',
  '[data-view-mode-select]': 'viewModeSelect',
  '[data-view-mode-status]': 'viewModeStatus'
}[selector]);

function fixture({width = 900, saved = null, loading = false, blockRead = false, blockWrite = false, hosts = 2} = {}) {
  const body = new Element('body');
  for (let i = 0; i < hosts; i++) { const host = new Element('div'); host.dataset.viewModeHost = ''; body.append(host); }
  const events = new Map(), documentEvents = new Map(), writes = [], reads = [], changes = [];
  const contract = {price: 32000, fields: {client: 'QA fixture'}, signatures: ['client-stroke', 'provider-stroke'], consent: [true, true]};
  const document = {
    documentElement: {dataset: {}}, readyState: loading ? 'loading' : 'complete', contract,
    createElement: tag => new Element(tag),
    querySelectorAll: selector => descendants(body).filter(node => matches(node, selector)),
    addEventListener(type, listener, options) { documentEvents.set(type, {listener, options}); }
  };
  const media = {
    get matches() { return width <= 900; },
    addEventListener(type, listener) { assert.equal(type, 'change'); this.listener = listener; }
  };
  const window = {
    matchMedia(query) { assert.equal(query, '(max-width: 900px)'); return media; },
    addEventListener(type, listener) { events.set(type, listener); },
    dispatchEvent(event) { if (event.type === 'heycheng:viewchange') changes.push(event.detail); events.get(event.type)?.(event); }
  };
  const localStorage = {
    getItem(name) { reads.push(name); if (blockRead) throw new Error('Storage unavailable'); return saved; },
    setItem(name, value) { if (blockWrite) throw new Error('Storage unavailable'); writes.push([name, value]); saved = value; }
  };
  runInNewContext(source, {document, window, localStorage, CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } }});
  return {
    document, body, reads, writes, changes, contract,
    controls: () => document.querySelectorAll('[data-view-mode-select]'),
    statuses: () => document.querySelectorAll('[data-view-mode-status]'),
    choose(value, index = 0) { const select = this.controls()[index]; select.value = value; select.handlers.get('change')(); },
    resize(next) { const previous = media.matches; width = next; if (previous !== media.matches) media.listener(); },
    storage(name, value) { events.get('storage')({key: name, newValue: value}); },
    ready() { const event = documentEvents.get('DOMContentLoaded'); if (!event) return; if (event.options?.once) documentEvents.delete('DOMContentLoaded'); event.listener(); }
  };
}

test('applies the initial mode before DOM ready and mounts hosts only once', () => {
  const f = fixture({loading: true, saved: 'desktop'});
  assert.equal(f.document.documentElement.dataset.view, 'desktop');
  assert.equal(f.controls().length, 0);
  f.ready(); f.ready();
  assert.equal(f.controls().length, 2);
  assert.deepEqual(f.controls().map(select => select.value), ['desktop', 'desktop']);
  assert.deepEqual(f.writes, []);
});

test('auto mode follows the 899/900/901 boundary in both directions', () => {
  const f = fixture({width: 899});
  assert.equal(f.document.documentElement.dataset.view, 'mobile');
  f.resize(900); assert.equal(f.document.documentElement.dataset.view, 'mobile');
  f.resize(901); assert.equal(f.document.documentElement.dataset.view, 'desktop');
  f.resize(900); assert.equal(f.document.documentElement.dataset.view, 'mobile');
  assert.equal(f.changes.length, 3);
  assert.deepEqual(f.statuses().map(status => status.textContent), ['目前：手機版', '目前：手機版']);
});

test('manual mode survives viewport changes and selecting auto restores responsive behavior', () => {
  const f = fixture({width: 390});
  f.choose('desktop'); f.resize(1280); f.resize(320);
  assert.equal(f.document.documentElement.dataset.view, 'desktop');
  assert.equal(f.document.documentElement.dataset.viewPreference, 'desktop');
  f.choose('auto');
  assert.equal(f.document.documentElement.dataset.view, 'mobile');
  assert.deepEqual(f.writes, [[key, 'desktop'], [key, 'auto']]);
});

test('either host synchronizes every selector and manual status without duplicate events', () => {
  const f = fixture({width: 1280});
  f.choose('mobile', 1);
  assert.deepEqual(f.controls().map(select => select.value), ['mobile', 'mobile']);
  assert.deepEqual(f.statuses().map(status => status.textContent), ['', '']);
  const count = f.changes.length;
  f.choose('mobile', 0);
  assert.equal(f.changes.length, count);
});

test('missing, corrupt and unsupported saved preferences safely default to auto', () => {
  for (const saved of [null, '', 'tablet', '{bad json}', '__proto__']) {
    const f = fixture({saved, width: 1024});
    assert.equal(f.document.documentElement.dataset.viewPreference, 'auto');
    assert.equal(f.document.documentElement.dataset.view, 'desktop');
    assert.deepEqual(f.reads, [key]);
    assert.deepEqual(f.writes, []);
  }
});

test('blocked storage never prevents initialization or a same-page manual choice', () => {
  const f = fixture({width: 390, blockRead: true, blockWrite: true});
  assert.equal(f.document.documentElement.dataset.view, 'mobile');
  f.choose('desktop', 1);
  assert.equal(f.document.documentElement.dataset.view, 'desktop');
  assert.deepEqual(f.controls().map(select => select.value), ['desktop', 'desktop']);
});

test('cross-tab preference updates apply without writing back; unrelated keys are ignored', () => {
  const f = fixture({width: 1200});
  f.storage('heycheng-portal-auth', 'ignored');
  assert.equal(f.document.documentElement.dataset.viewPreference, 'auto');
  f.storage(key, 'mobile');
  assert.equal(f.document.documentElement.dataset.view, 'mobile');
  f.storage(key, 'invalid');
  assert.equal(f.document.documentElement.dataset.viewPreference, 'auto');
  f.storage(key, 'mobile'); f.storage(null, null);
  assert.equal(f.document.documentElement.dataset.view, 'desktop');
  assert.deepEqual(f.writes, []);
});

test('changing layout does not modify contract values, signatures or consent', () => {
  const f = fixture(); const before = JSON.stringify(f.contract);
  f.choose('desktop'); f.resize(1280); f.choose('mobile'); f.storage(key, 'auto');
  assert.equal(JSON.stringify(f.contract), before);
  assert.ok(f.writes.every(([name]) => name === key));
});

test('controls keep native labeled select semantics and an accurate selected value', () => {
  const f = fixture({saved: 'mobile'});
  for (const select of f.controls()) {
    assert.equal(select.tag, 'select');
    assert.equal(select.attributes['aria-label'], '顯示模式');
    assert.deepEqual(select.children.map(option => option.value), ['auto', 'desktop', 'mobile']);
    assert.equal(select.value, 'mobile');
  }
});
