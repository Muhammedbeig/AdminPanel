function isPlainObject(x: any) {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

export function deepMerge<T>(base: T, override: any): T {
  if (override === undefined) return base;
  if (override === null) return override as T;

  const b: any = base as any;

  if (Array.isArray(b) && Array.isArray(override)) return override as T;

  if (isPlainObject(b) && isPlainObject(override)) {
    const out: any = { ...b };
    for (const k of Object.keys(override)) out[k] = deepMerge(b?.[k], override[k]);
    return out as T;
  }

  return override as T;
}
