import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackSlow } from './net';

// API address: EXPO_PUBLIC_API_URL wins. Otherwise use the computer running `expo start`
// (same Wi-Fi) on port 4000, so a real phone can reach the backend without config.
function guessBase() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  if (Platform.OS === 'web' && typeof window !== 'undefined') return `${window.location.protocol}//${window.location.hostname}:4000/api`;
  const host = (Constants.expoConfig && Constants.expoConfig.hostUri) || '';
  const ip = host.split(':')[0];
  if (ip) return `http://${ip}:4000/api`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:4000/api' : 'http://localhost:4000/api';
}
export const API_BASE = guessBase();
const KEY = 'kh.token';
let token = null;

export const session = {
  async load() { try { token = await AsyncStorage.getItem(KEY); } catch { token = null; } return token; },
  async save(t) { token = t; try { await AsyncStorage.setItem(KEY, t); } catch {} },
  async clear() { token = null; try { await AsyncStorage.removeItem(KEY); } catch {} },
  get token() { return token; }
};

export class ApiError extends Error {
  // status 0 means the request never reached the server (no internet, server down).
  constructor(message, status, fields) { super(message); this.status = status; this.fields = fields; }
  get offline() { return this.status === 0; }
}

async function req(method, path, body) {
  let res;
  try {
    res = await trackSlow(fetch(API_BASE + path, {
      method,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) },
      body: body ? JSON.stringify(body) : undefined
    }));
  } catch {
    throw new ApiError("No internet — check your connection and try again.", 0);
  }
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new ApiError(data.error || 'Something went wrong. Please try again.', res.status, data.fields);
  return data;
}

export const api = {
  checkMobile: (mobile) => req('POST', '/auth/check', { mobile }),
  signup: (b) => req('POST', '/auth/signup', b),
  login: (b) => req('POST', '/auth/login', b),
  changePin: (b) => req('POST', '/auth/change-pin', b),
  bootstrap: () => req('GET', '/bootstrap'),
  updateMe: (b) => req('PATCH', '/me', b),
  addWorker: (b) => req('POST', '/workers', b),
  updateWorker: (id, b) => req('PATCH', '/workers/' + id, b),
  addSite: (b) => req('POST', '/sites', b),
  updateSite: (id, b) => req('PATCH', '/sites/' + id, b),
  saveAttendance: (date, entries) => req('PUT', '/attendance/' + date, { entries }),
  clearAttendance: (date, worker) => req('DELETE', '/attendance/' + date + '/' + worker),
  addTx: (b) => req('POST', '/transactions', b),
  activity: () => req('GET', '/activity')
};
