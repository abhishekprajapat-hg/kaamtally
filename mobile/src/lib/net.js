// Connection state, shared by the whole app.
//
// Two separate things matter on a building site:
//   • offline  — the phone has no usable connection at all
//   • slow     — there is a connection, but requests are crawling
// They are tracked separately because they need different messages.
import { useEffect, useState } from 'react';
import { useNetworkState } from 'expo-network';

const SLOW_AFTER_MS = 4500;

let slowCount = 0;
const slowListeners = new Set();
const emitSlow = () => slowListeners.forEach((fn) => fn(slowCount > 0));

// Wrap a request so a long wait flips the app into its "slow" state.
export function trackSlow(promise) {
  let flagged = false;
  const timer = setTimeout(() => { flagged = true; slowCount++; emitSlow(); }, SLOW_AFTER_MS);
  const done = () => {
    clearTimeout(timer);
    if (flagged) { slowCount = Math.max(0, slowCount - 1); emitSlow(); }
  };
  return promise.then((v) => { done(); return v; }, (e) => { done(); throw e; });
}

export function useSlowConnection() {
  const [slow, setSlow] = useState(slowCount > 0);
  useEffect(() => {
    slowListeners.add(setSlow);
    return () => { slowListeners.delete(setSlow); };
  }, []);
  return slow;
}

// `undefined` while we're still finding out — don't shout "offline" before we know.
export function useConnection() {
  const net = useNetworkState();
  const slow = useSlowConnection();
  const known = net.isConnected !== undefined;
  const offline = known && (net.isConnected === false || net.isInternetReachable === false);
  return { offline, slow: slow && !offline, known, type: net.type };
}
