const cacheStore = new Map();

const cloneValue = (value) => {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
};

export const cache = {
  get(key) {
    const entry = cacheStore.get(key);
    if (!entry) return null;

    if (entry.expiresAt <= Date.now()) {
      cacheStore.delete(key);
      return null;
    }

    return cloneValue(entry.value);
  },

  set(key, value, ttlMs) {
    cacheStore.set(key, {
      value: cloneValue(value),
      expiresAt: Date.now() + ttlMs,
    });
  },

  delete(key) {
    cacheStore.delete(key);
  },
};
