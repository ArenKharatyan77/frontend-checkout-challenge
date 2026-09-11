import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';

export function Layout({ children }: { children: ReactNode }) {
  const { data: cart } = useCart();

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand">
          Магазин
        </Link>
        <Link to="/cart" className="cart-link">
          Корзина
          {!!cart?.quantity && <span className="cart-badge">{cart.quantity}</span>}
        </Link>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
