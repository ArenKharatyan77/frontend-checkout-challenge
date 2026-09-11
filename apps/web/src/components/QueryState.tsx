import type { ReactNode } from 'react';
import { RequestError, friendlyMessage } from '../api/errors';

type QueryLike<T> = {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  data: T | undefined;
  refetch: () => void;
};

type Props<T> = {
  query: QueryLike<T>;
  children: (data: T) => ReactNode;
};

export function QueryState<T>({ query, children }: Props<T>) {
  if (query.isPending) {
    return (
      <div className="state-block">
        <div className="spinner" aria-hidden="true" />
        <p>Загрузка…</p>
      </div>
    );
  }

  if (query.isError) {
    const message =
      query.error instanceof RequestError
        ? friendlyMessage(query.error)
        : 'Не удалось загрузить данные.';
    return (
      <div className="state-block" role="alert">
        <p>{message}</p>
        <button type="button" onClick={() => query.refetch()}>
          Повторить
        </button>
      </div>
    );
  }

  return <>{children(query.data as T)}</>;
}
