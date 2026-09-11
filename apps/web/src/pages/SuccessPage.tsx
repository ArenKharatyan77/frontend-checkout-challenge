import { Link, useParams } from 'react-router-dom';
import { useOrder } from '../hooks/useOrder';
import { QueryState } from '../components/QueryState';
import { formatMoney } from '../lib/money';

export function SuccessPage() {
  const { orderId = '' } = useParams();
  const orderQuery = useOrder(orderId, true);

  return (
    <div>
      <QueryState query={orderQuery}>
        {(order) => {
          const isPaidCard = order.paymentMethod === 'card';
          const isConfirmed = order.status === 'paid' || order.status === 'confirmed';

          if (!isConfirmed) {
            return (
              <div className="state-block">
                <div className="spinner" aria-hidden="true" />
                <p>Подтверждаем оплату…</p>
              </div>
            );
          }

          return (
            <div className="success-page">
              <h1>Заказ {order.number} оформлен</h1>
              <p>
                {isPaidCard ? 'Оплата прошла успешно.' : 'Заказ оформлен, оплата при получении.'}
              </p>

              <ul className="order-items">
                {order.items.map((item) => (
                  <li key={item.productId}>
                    <span>
                      {item.title} × {item.quantity}
                    </span>
                    <span>{formatMoney(item.lineTotal)}</span>
                  </li>
                ))}
              </ul>

              <div className="order-delivery">
                {order.delivery.method === 'pickup' ? (
                  <p>Самовывоз: {order.delivery.pickupPointId}</p>
                ) : (
                  <p>
                    Курьером: {order.delivery.address.city}, {order.delivery.address.street}{' '}
                    {order.delivery.address.house}
                    {order.delivery.address.apartment
                      ? `, кв. ${order.delivery.address.apartment}`
                      : ''}
                  </p>
                )}
              </div>

              <div className="summary-row">
                <span>Товары</span>
                <span>{formatMoney(order.subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Доставка</span>
                <span>{order.shipping === 0 ? 'Бесплатно' : formatMoney(order.shipping)}</span>
              </div>
              <div className="summary-row summary-total">
                <span>Итого</span>
                <span>{formatMoney(order.total)}</span>
              </div>

              <Link to="/">Вернуться в каталог</Link>
            </div>
          );
        }}
      </QueryState>
    </div>
  );
}
