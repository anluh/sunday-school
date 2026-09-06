export function createRandomToken(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `token-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export function createStableIdPart(input: string): string {
  // FNV-1a 32-bit hash. Used only for deterministic Firestore document ids.
  // Web Crypto `crypto.subtle.digest` is not available on plain HTTP LAN URLs.
  let hash = 0x811c9dc5
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}
