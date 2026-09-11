import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart, useRemoveCartItem, useSetCartItem } from '../hooks/useCart';
import { useProducts } from '../hooks/useCatalog';
import { QueryState } from '../components/QueryState';
import { formatMoney } from '../lib/money';
import { RequestError, friendlyMessage } from '../api/errors';

export function CartPage() {
  const cartQuery = useCart();
  const productsQuery = useProducts();
  const setCartItem = useSetCartItem();
  const removeCartItem = useRemoveCartItem();
  const navigate = useNavigate();

  const stockByProductId = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of productsQuery.data ?? []) map.set(product.id, product.stock);
    return map;
  }, [productsQuery.data]);

  return (
    <div>
      <h1>Корзина</h1>
      <QueryState query={cartQuery}>
        {(cart) => {
          if (cart.items.length === 0) {
            return (
              <div className="state-block">
                <p>Корзина пуста.</p>
                <Link to="/">Перейти в каталог</Link>
              </div>
            );
          }

          return (
            <>
              <ul className="cart-list">
                {cart.items.map((item) => {
                  const stock = stockByProductId.get(item.productId);
                  const atLimit = stock !== undefined && item.quantity >= stock;
                  const isItemPending =
                    (setCartItem.isPending &&
                      setCartItem.variables?.productId === item.productId) ||
                    (removeCartItem.isPending && removeCartItem.variables === item.productId);

                  return (
                    <li className="cart-row" key={item.productId}>
                      <span className="cart-row-title">{item.title}</span>
                      <div className="cart-row-quantity">
                        <button
                          type="button"
                          aria-label="Уменьшить количество"
                          disabled={isItemPending}
                          onClick={() =>
                            item.quantity <= 1
                              ? removeCartItem.mutate(item.productId)
                              : setCartItem.mutate({
                                  productId: item.productId,
                                  quantity: item.quantity - 1,
                                })
                          }
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          aria-label="Увеличить количество"
                          disabled={isItemPending || atLimit}
                          onClick={() =>
                            setCartItem.mutate({
                              productId: item.productId,
                              quantity: item.quantity + 1,
                            })
                          }
                        >
                          +
                        </button>
                      </div>
                      <span className="cart-row-total">{formatMoney(item.lineTotal)}</span>
                      <button
                        type="button"
                        className="cart-row-remove"
                        disabled={isItemPending}
                        onClick={() => removeCartItem.mutate(item.productId)}
                      >
                        Удалить
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="cart-summary">
                <span>Итого</span>
                <strong>{formatMoney(cart.subtotal)}</strong>
              </div>
              <button type="button" className="primary" onClick={() => navigate('/checkout')}>
                Оформить заказ
              </button>
            </>
          );
        }}
      </QueryState>
      {(setCartItem.isError || removeCartItem.isError) && (
        <p role="alert" className="form-error">
          {(() => {
            const error = setCartItem.error ?? removeCartItem.error;
            return error instanceof RequestError
              ? friendlyMessage(error)
              : 'Не удалось обновить корзину.';
          })()}
        </p>
      )}
    </div>
  );
}
