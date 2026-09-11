import { useCallback, useState } from 'react';
import { readStorage, writeStorage } from '../lib/storage';

function loadOrCreate(storageKey: string): string {
  const existing = readStorage<string>(storageKey);
  if (existing) return existing;
  const created = crypto.randomUUID();
  writeStorage(storageKey, created);
  return created;
}

export function useIdempotencyKey(scope: string) {
  const storageKey = `checkout.idempotency.${scope}`;
  const [key, setKey] = useState(() => loadOrCreate(storageKey));

  const rotate = useCallback(() => {
    const next = crypto.randomUUID();
    writeStorage(storageKey, next);
    setKey(next);
  }, [storageKey]);

  return [key, rotate] as const;
}
