// Build replaces this manifest using the verified V3 research assets. No network at runtime.
export const V4_FX={};
export const V4_TROOP_FRAMES={};
export function v4Effect(kind,event,fallback){const pool=V4_FX[kind]||[];let hash=0;for(const ch of String(event?.artifactId??event?.name??event?.skill??event?.type??''))hash=(Math.imul(hash,31)+ch.charCodeAt(0))>>>0;return pool.length?pool[hash%pool.length]:fallback;}
