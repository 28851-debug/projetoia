const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');

// Simple DOM Mock
class ElementMock {
  constructor(tag, id = '', className = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.className = className;
    this.classList = {
      _classes: new Set(className.split(' ').filter(Boolean)),
      add: (c) => this.classList._classes.add(c),
      remove: (c) => this.classList._classes.delete(c),
      contains: (c) => this.classList._classes.has(c)
    };
    this.attributes = {};
    this.listeners = {};
    this.style = {};
    this.children = [];
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k]; }
  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }
  dispatchEvent(event) {
    const fns = this.listeners[event.type] || [];
    for (const fn of fns) fn(event);
  }
  closest(selector) {
    if (selector === 'button') {
      if (this.tagName === 'BUTTON') return this;
    }
    return null;
  }
  focus() {}
  reset() {}
}

console.log('Testing click logic...');
