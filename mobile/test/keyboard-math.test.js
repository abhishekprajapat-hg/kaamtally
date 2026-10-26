const { test } = require('node:test');
const assert = require('node:assert/strict');
const { hiddenAmount, scrollTarget } = require('../src/lib/keyboard-math');

// Phone 844 tall, keyboard 336 tall -> its top edge sits at y 508.
const KB_TOP = 508;

test('a field well above the keyboard is left alone', () => {
  assert.equal(scrollTarget({ currentOffset: 0, inputY: 200, inputHeight: 44, keyboardTop: KB_TOP }), null);
});

test('a field hidden behind the keyboard scrolls up by exactly what it needs', () => {
  // bottom = 600 + 44 = 644, plus a 24 gap = 668, which is 160 below the keyboard
  assert.equal(scrollTarget({ currentOffset: 0, inputY: 600, inputHeight: 44, keyboardTop: KB_TOP }), 160);
});

test('scrolling adds to where the list already is', () => {
  assert.equal(scrollTarget({ currentOffset: 300, inputY: 600, inputHeight: 44, keyboardTop: KB_TOP }), 460);
});

test('a field just touching the keyboard still gets the gap', () => {
  // bottom lands exactly on the keyboard top: needs the full 24 gap
  assert.equal(scrollTarget({ currentOffset: 0, inputY: 464, inputHeight: 44, keyboardTop: KB_TOP }), 24);
});

test('never scrolls to a negative offset', () => {
  const t = scrollTarget({ currentOffset: -50, inputY: 520, inputHeight: 44, keyboardTop: KB_TOP });
  assert.ok(t >= 0);
});

test('no keyboard means no scrolling', () => {
  assert.equal(scrollTarget({ currentOffset: 0, inputY: 800, inputHeight: 44, keyboardTop: null }), null);
  assert.equal(hiddenAmount({ inputY: 800, inputHeight: 44, keyboardTop: null }), 0);
});

test('a custom gap is respected', () => {
  assert.equal(scrollTarget({ currentOffset: 0, inputY: 600, inputHeight: 44, keyboardTop: KB_TOP, gap: 16 }), 152);
});

// --- how much room the content needs ---------------------------------------
// Mirrors the rule in ui/keyboard.js: if the OS shrank the window, the room is
// already there; on an edge-to-edge Android window it is not.
function insetFor({ keyboardHeight, windowBefore, windowNow }) {
  const resized = windowNow < windowBefore - 50;
  return resized ? 0 : keyboardHeight;
}

test('edge-to-edge Android: window does not shrink, so we add the room', () => {
  assert.equal(insetFor({ keyboardHeight: 336, windowBefore: 844, windowNow: 844 }), 336);
});

test('older Android with adjustResize: window shrank, no extra room needed', () => {
  assert.equal(insetFor({ keyboardHeight: 336, windowBefore: 844, windowNow: 508 }), 0);
});

test('a small wobble in window height is not treated as a resize', () => {
  assert.equal(insetFor({ keyboardHeight: 336, windowBefore: 844, windowNow: 820 }), 336);
});
