import { useMemo } from 'react';
import { useProducts } from '../hooks/useCatalog';
import { useCart, useSetCartItem } from '../hooks/useCart';
import { QueryState } from '../components/QueryState';
import { formatMoney } from '../lib/money';
import { RequestError, friendlyMessage } from '../api/errors';

export function CatalogPage() {
  const productsQuery = useProducts();
  const cartQuery = useCart();
  const setCartItem = useSetCartItem();

  const quantityByProductId = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of cartQuery.data?.items ?? []) map.set(item.productId, item.quantity);
    return map;
  }, [cartQuery.data]);

  return (
    <div>
      <h1>Каталог</h1>
      <QueryState query={productsQuery}>
        {(products) => (
          <div className="product-grid">
            {products.map((product) => {
              const quantity = quantityByProductId.get(product.id) ?? 0;
              const isOutOfStock = product.stock === 0;
              const atLimit = quantity >= product.stock;
              const pending =
                setCartItem.isPending && setCartItem.variables?.productId === product.id;

              return (
                <article className="product-card" key={product.id}>
                  <h2>{product.title}</h2>
                  <p className="product-description">{product.description}</p>
                  <p className="product-price">{formatMoney(product.price)}</p>
                  {isOutOfStock ? (
                    <p className="product-stock-out">Нет в наличии</p>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={atLimit || pending}
                        onClick={() =>
                          setCartItem.mutate({ productId: product.id, quantity: quantity + 1 })
                        }
                      >
                        {quantity > 0 ? `В корзине: ${quantity}` : 'В корзину'}
                      </button>
                      {atLimit && <p className="product-stock-limit">Достигнут остаток</p>}
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </QueryState>
      {setCartItem.isError && (
        <p role="alert" className="form-error">
          {setCartItem.error instanceof RequestError
            ? friendlyMessage(setCartItem.error)
            : 'Не удалось добавить товар.'}
        </p>
      )}
    </div>
  );
}
