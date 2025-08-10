/**
 * Persistence middleware for functional contexts
 * Persists state to localStorage/sessionStorage with exclusions
 * @param key - Storage key
 * @param options - Exclusion options
 */
export const persistenceMiddleware = (
  key: string,
  options?: { exclude?: string[] }
) => {
  return <A, S>(action: A, state: S): S => {
    if (typeof window !== "undefined") {
      const data = { ...state } as any;
      if (options?.exclude) {
        for (const field of options.exclude) {
          if (field in data) delete data[field];
        }
      }
      try {
        window.localStorage.setItem(key, JSON.stringify(data));
      } catch {}
    }
    return state;
  };
};
