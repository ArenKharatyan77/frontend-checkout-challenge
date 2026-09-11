import type { ReactNode } from 'react';

type Props = {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
};

export function Field({ label, htmlFor, error, children }: Props) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
