import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { anonymousClient, createApiClient, type ApiClient } from './client';
import { createSession } from './endpoints';
import { RequestError, friendlyMessage } from './errors';
import { readStorage, removeStorage, writeStorage } from '../lib/storage';
import { FullScreenStatus } from '../components/FullScreenStatus';

const SESSION_STORAGE_KEY = 'checkout.session';

type StoredSession = { id: string; token: string };

type SessionContextValue = {
  client: ApiClient;
  sessionId: string;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function clearStoredSession(): void {
  removeStorage(SESSION_STORAGE_KEY);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(() =>
    readStorage<StoredSession>(SESSION_STORAGE_KEY),
  );
  const [error, setError] = useState<RequestError | null>(null);
  const [attempt, setAttempt] = useState(0);
  const startedAttempt = useRef(-1);

  useEffect(() => {
    if (session) return;
    if (startedAttempt.current === attempt) return;
    startedAttempt.current = attempt;
    setError(null);

    createSession(anonymousClient)
      .then((created) => {
        const next = { id: created.id, token: created.token };
        writeStorage(SESSION_STORAGE_KEY, next);
        setSession(next);
      })
      .catch((cause) => {
        setError(
          cause instanceof RequestError
            ? cause
            : new RequestError({ kind: 'network', message: 'Не удалось создать сессию.' }),
        );
      });
  }, [session, attempt]);

  const client = useMemo(() => createApiClient(session?.token), [session?.token]);

  if (error) {
    return (
      <FullScreenStatus
        kind="error"
        message={friendlyMessage(error)}
        onRetry={() => setAttempt((value) => value + 1)}
      />
    );
  }

  if (!session) {
    return <FullScreenStatus kind="loading" />;
  }

  return (
    <SessionContext.Provider value={{ client, sessionId: session.id }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
