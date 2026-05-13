import '@testing-library/jest-dom'

// Polyfill fetch for Node 16
import { vi } from 'vitest'
global.fetch = vi.fn()

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: key => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: key => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store = {}
  return {
    getItem: key => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: key => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock })

// Mock IndexedDB (basic stub)
global.indexedDB = {
  open: () => ({
    onupgradeneeded: null,
    onsuccess: null,
    onerror: null,
    result: {
      objectStoreNames: { contains: () => false },
      createObjectStore: () => ({ createIndex: () => {} }),
      transaction: () => ({
        objectStore: () => ({
          add: () => ({ onsuccess: null, onerror: null }),
          getAll: () => ({ onsuccess: null, onerror: null }),
          delete: () => ({}),
          put: () => ({}),
          index: () => ({ getAll: () => ({ onsuccess: null, onerror: null }) }),
        }),
        oncomplete: null,
        onerror: null,
      }),
    },
  }),
}

// Mock window.confirm
window.confirm = () => true

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: () => Promise.resolve({
      getTracks: () => [{ stop: () => {} }],
    }),
  },
  configurable: true,
})

// Mock MediaRecorder
global.MediaRecorder = class {
  constructor() { this.state = 'inactive' }
  start() { this.state = 'recording' }
  stop() { this.state = 'inactive'; this.onstop?.() }
  ondataavailable = null
  onstop = null
}
