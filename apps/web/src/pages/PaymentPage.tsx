import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Scenario } from '@checkout/contracts';
import { useOrder } from '../hooks/useOrder';
import {
  useLatestPaymentAttempt,
  usePayment,
  useCreatePaymentAttempt,
  useSimulatePayment,
} from '../hooks/usePayment';
import { useSandboxCards } from '../hooks/useCatalog';
import { useIdempotencyKey } from '../hooks/useIdempotencyKey';
import { formatMoney } from '../lib/money';
import { RequestError, friendlyMessage } from '../api/errors';

const DEFAULT_POLL_MS = 1500;

export function PaymentPage() {
  const { orderId = '' } = useParams();
  const navigate = useNavigate();

  const orderQuery = useOrder(orderId);
  const attemptQuery = useLatestPaymentAttempt(orderId);
  const sandboxQuery = useSandboxCards();

  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [attemptIdempotencyKey, rotateAttemptKey] = useIdempotencyKey(`payment:${orderId}`);

  useEffect(() => {
    if (paymentId === null && attemptQuery.data) {
      setPaymentId(attemptQuery.data.id);
    }
  }, [attemptQuery.data, paymentId]);

  const pollIntervalMs = sandboxQuery.data?.settlementDelayMs || DEFAULT_POLL_MS;
  const paymentQuery = usePayment(paymentId, pollIntervalMs);
  const payment = paymentQuery.data;

  const createAttempt = useCreatePaymentAttempt();
  const simulate = useSimulatePayment();

  useEffect(() => {
    if (orderQuery.data && orderQuery.data.paymentMethod !== 'card') {
      navigate(`/orders/${orderId}/success`, { replace: true });
    }
  }, [orderQuery.data, orderId, navigate]);

  useEffect(() => {
    if (payment?.status === 'succeeded') {
      navigate(`/orders/${orderId}/success`, { replace: true });
    }
  }, [payment?.status, orderId, navigate]);

  async function submit(scenario: Scenario) {
    setRetrying(false);
    let id = paymentId;
    if (!id || (payment && payment.status !== 'pending')) {
      const created = await createAttempt.mutateAsync({
        orderId,
        idempotencyKey: attemptIdempotencyKey,
      });
      id = created.id;
      setPaymentId(id);
      rotateAttemptKey();
    }
    await simulate.mutateAsync({ paymentId: id, scenario });
  }

  if (orderQuery.isPending || attemptQuery.isPending) {
    return (
      <div className="state-block">
        <div className="spinner" aria-hidden="true" />
        <p>Загрузка…</p>
      </div>
    );
  }

  if (orderQuery.isError) {
    const message =
      orderQuery.error instanceof RequestError
        ? friendlyMessage(orderQuery.error)
        : 'Заказ не найден.';
    return (
      <div className="state-block" role="alert">
        <p>{message}</p>
      </div>
    );
  }

  const order = orderQuery.data!;
  const status = payment?.status;
  const phase: 'form' | 'waiting' | 'declined' | 'cancelled' =
    retrying || !status || status === 'pending'
      ? 'form'
      : status === 'processing'
        ? 'waiting'
        : status === 'failed'
          ? 'declined'
          : 'cancelled';

  const busy = createAttempt.isPending || simulate.isPending;
  const requestError =
    createAttempt.error instanceof RequestError
      ? createAttempt.error
      : simulate.error instanceof RequestError
        ? simulate.error
        : null;

  return (
    <div>
      <h1>Оплата заказа {order.number}</h1>
      <p className="payment-total">К оплате: {formatMoney(order.total)}</p>

      {phase === 'waiting' && (
        <div className="state-block">
          <div className="spinner" aria-hidden="true" />
          <p>Обрабатываем оплату…</p>
        </div>
      )}

      {phase === 'declined' && (
        <div className="state-block" role="alert">
          <p>Карта отклонена. Попробуйте другую тестовую карту.</p>
          <button type="button" onClick={() => setRetrying(true)}>
            Попробовать снова
          </button>
        </div>
      )}

      {phase === 'cancelled' && (
        <div className="state-block">
          <p>Оплата отменена.</p>
          <button type="button" onClick={() => setRetrying(true)}>
            Повторить оплату
          </button>
        </div>
      )}

      {phase === 'form' && (
        <div className="payment-form">
          {sandboxQuery.isPending && <p>Загружаем тестовые карты…</p>}
          {sandboxQuery.data && (
            <div className="radio-group">
              {sandboxQuery.data.cards.map((card) => (
                <label key={card.id}>
                  <input
                    type="radio"
                    name="card"
                    checked={selectedCardId === card.id}
                    onChange={() => setSelectedCardId(card.id)}
                  />
                  {card.title} · {card.maskedNumber}
                </label>
              ))}
            </div>
          )}

          {requestError && (
            <p role="alert" className="form-error">
              {friendlyMessage(requestError)}
            </p>
          )}

          <div className="payment-actions">
            <button
              type="button"
              className="primary"
              disabled={!selectedCardId || busy}
              onClick={() => {
                const card = sandboxQuery.data?.cards.find((entry) => entry.id === selectedCardId);
                if (card) submit(card.scenario);
              }}
            >
              {busy ? 'Отправляем…' : 'Оплатить'}
            </button>
            <button type="button" disabled={busy} onClick={() => submit('cancel')}>
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
