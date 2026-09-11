type Props = {
  kind: 'loading' | 'error';
  message?: string;
  onRetry?: () => void;
};

export function FullScreenStatus({ kind, message, onRetry }: Props) {
  return (
    <div className="full-screen-status">
      {kind === 'loading' ? (
        <>
          <div className="spinner" aria-hidden="true" />
          <p>Загрузка…</p>
        </>
      ) : (
        <>
          <p role="alert">{message ?? 'Что-то пошло не так.'}</p>
          {onRetry && (
            <button type="button" onClick={onRetry}>
              Повторить
            </button>
          )}
        </>
      )}
    </div>
  );
}
