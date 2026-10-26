// Keyboard handling, written with React Native's own APIs so it keeps working
// in Expo Go (no native module needed).
//
// Android note: from Expo SDK 54 apps are edge-to-edge by default, and an
// edge-to-edge window is NOT resized when the keyboard opens — the app simply
// draws behind it, and `softwareKeyboardLayoutMode: "resize"` no longer has an
// effect. So we can't assume the layout shrinks on either platform; we measure
// what actually happened and add the missing space ourselves.
import { useEffect, useRef, useState, useCallback } from 'react';
import { Keyboard, Platform, Dimensions } from 'react-native';
import { scrollTarget } from '../lib/keyboard-math';

const SHOW = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
const HIDE = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
const GAP = 24; // breathing room between the field and the top of the keyboard

// --- which field is focused -------------------------------------------------
// Every text field registers itself here, so a scroll container can measure the
// focused one without reaching into React Native internals.
let focused = null;
export const focusRegistry = {
  set(node) { focused = node || null; requestEnsureVisible(); },
  clear(node) { if (focused === node) focused = null; },
  get() { return focused; }
};

// --- who is responsible for scrolling --------------------------------------
// A sheet opened over a screen takes over, then hands control back when it closes.
const handlers = [];
export function pushEnsureVisible(fn) {
  handlers.push(fn);
  return () => { const i = handlers.indexOf(fn); if (i >= 0) handlers.splice(i, 1); };
}
export function requestEnsureVisible() {
  const fn = handlers[handlers.length - 1];
  if (!fn) return;
  // Twice: once as the keyboard animates, once after the layout has settled.
  setTimeout(fn, Platform.OS === 'android' ? 80 : 20);
  setTimeout(fn, 350);
}

// --- hooks ------------------------------------------------------------------
// How much space the keyboard actually steals from our layout.
// `height` is the keyboard itself; `inset` is the padding the content needs —
// zero when the OS already shrank the window for us.
export function useKeyboard() {
  const [state, setState] = useState({ height: 0, inset: 0, open: false });
  const baseWindow = useRef(Dimensions.get('window').height);

  useEffect(() => {
    const dim = Dimensions.addEventListener('change', ({ window }) => {
      // Remember the full height only while the keyboard is closed.
      if (!state.open) baseWindow.current = window.height;
    });
    const show = Keyboard.addListener(SHOW, (e) => {
      const height = e.endCoordinates?.height || 0;
      const now = Dimensions.get('window').height;
      // If the window shrank, the OS made the room already.
      const resized = now < baseWindow.current - 50;
      setState({ height, inset: resized ? 0 : height, open: true });
    });
    const hide = Keyboard.addListener(HIDE, () => {
      baseWindow.current = Dimensions.get('window').height;
      setState({ height: 0, inset: 0, open: false });
    });
    return () => { dim.remove(); show.remove(); hide.remove(); };
  }, [state.open]);

  return state;
}

// Kept for places that only care about the raw height.
export function useKeyboardHeight() { return useKeyboard().height; }

// Keeps the focused field above the keyboard inside a ScrollView.
// `enabled` lets a screen stand down while a sheet is open on top of it.
export function useKeyboardAwareScroll(scrollRef, { enabled = true, gap = GAP } = {}) {
  const offset = useRef(0);
  const kbTop = useRef(null);

  const onScroll = useCallback((e) => { offset.current = e.nativeEvent.contentOffset.y; }, []);

  const ensure = useCallback(() => {
    const node = focusRegistry.get();
    const scroll = scrollRef.current;
    if (!node || !scroll || kbTop.current == null || !node.measureInWindow) return;
    node.measureInWindow((x, y, w, h) => {
      if (!h && !y) return;
      const to = scrollTarget({ currentOffset: offset.current, inputY: y, inputHeight: h, keyboardTop: kbTop.current, gap });
      if (to != null && scroll.scrollTo) scroll.scrollTo({ y: to, animated: true });
    });
  }, [gap]);

  useEffect(() => {
    if (!enabled) return undefined;
    const pop = pushEnsureVisible(ensure);
    const show = Keyboard.addListener(SHOW, (e) => {
      // Where the top of the keyboard sits on screen.
      kbTop.current = e.endCoordinates?.screenY ?? (Dimensions.get('screen').height - (e.endCoordinates?.height || 0));
      requestEnsureVisible();
    });
    const hide = Keyboard.addListener(HIDE, () => { kbTop.current = null; });
    return () => { pop(); show.remove(); hide.remove(); };
  }, [enabled, ensure]);

  return { onScroll, ensureVisible: ensure };
}
