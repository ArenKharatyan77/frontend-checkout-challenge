import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { CreateOrder, Delivery, Quote } from '@checkout/contracts';
import { useCheckoutOptions, useCreateQuote } from '../hooks/useCheckout';
import { useCreateOrder } from '../hooks/useOrder';
import { useIdempotencyKey } from '../hooks/useIdempotencyKey';
import { cartKey } from '../hooks/useCart';
import { QueryState } from '../components/QueryState';
import { Field } from '../components/Field';
import { formatMoney } from '../lib/money';
import { RequestError, fieldErrorFor, friendlyMessage } from '../api/errors';

export function CheckoutPage() {
  const checkoutOptionsQuery = useCheckoutOptions();
  const createQuote = useCreateQuote();
  const createOrder = useCreateOrder();
  const [orderIdempotencyKey, rotateOrderKey] = useIdempotencyKey('order');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);

  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'courier'>('pickup');
  const [pickupPointId, setPickupPointId] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [house, setHouse] = useState('');
  const [apartment, setApartment] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<CreateOrder['paymentMethod']>('card');
  const [quote, setQuote] = useState<Quote | null>(null);

  const delivery: Delivery | null = useMemo(() => {
    if (deliveryMethod === 'pickup') {
      return pickupPointId ? { method: 'pickup', pickupPointId } : null;
    }
    if (city.trim().length >= 2 && street.trim().length >= 2 && house.trim().length >= 1) {
      return {
        method: 'courier',
        address: {
          city: city.trim(),
          street: street.trim(),
          house: house.trim(),
          apartment: apartment.trim() || undefined,
        },
      };
    }
    return null;
  }, [deliveryMethod, pickupPointId, city, street, house, apartment]);

  const cartVersion = checkoutOptionsQuery.data?.cart.version;

  useEffect(() => {
    if (!delivery || cartVersion === undefined) {
      setQuote(null);
      return;
    }
    const timer = setTimeout(() => {
      createQuote.mutate(
        { cartVersion, delivery },
        { onSuccess: (nextQuote) => setQuote(nextQuote) },
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delivery, cartVersion]);

  const orderError = createOrder.error instanceof RequestError ? createOrder.error : null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!formRef.current?.reportValidity() || !quote) return;

    createOrder.mutate(
      {
        body: {
          quoteId: quote.id,
          customer: { name: name.trim(), email: email.trim(), phone: phone.trim() },
          paymentMethod,
        },
        idempotencyKey: orderIdempotencyKey,
      },
      {
        onSuccess: (order) => {
          rotateOrderKey();
          navigate(
            order.paymentMethod === 'card'
              ? `/orders/${order.id}/payment`
              : `/orders/${order.id}/success`,
          );
        },
        onError: (error) => {
          if (
            error instanceof RequestError &&
            (error.code === 'CART_VERSION_CONFLICT' || error.code === 'QUOTE_EXPIRED')
          ) {
            queryClient.invalidateQueries({ queryKey: ['checkout-options'] });
            queryClient.invalidateQueries({ queryKey: cartKey });
            setQuote(null);
          }
        },
      },
    );
  }

  return (
    <div>
      <h1>Оформление заказа</h1>
      <QueryState query={checkoutOptionsQuery}>
        {(options) => {
          if (options.cart.items.length === 0) {
            return (
              <div className="state-block">
                <p>Корзина пуста, оформить заказ нельзя.</p>
                <Link to="/">Перейти в каталог</Link>
              </div>
            );
          }

          const pickup = options.deliveryMethods.find((method) => method.id === 'pickup');
          const courier = options.deliveryMethods.find((method) => method.id === 'courier');

          return (
            <form
              ref={formRef}
              className="checkout-form"
              onSubmit={handleSubmit}
              noValidate={false}
            >
              <section>
                <h2>Получатель</h2>
                <Field
                  label="Имя"
                  htmlFor="name"
                  error={fieldErrorFor(orderError, 'customer', 'name')}
                >
                  <input
                    id="name"
                    name="name"
                    required
                    minLength={2}
                    maxLength={100}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </Field>
                <Field
                  label="Email"
                  htmlFor="email"
                  error={fieldErrorFor(orderError, 'customer', 'email')}
                >
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    maxLength={150}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </Field>
                <Field
                  label="Телефон"
                  htmlFor="phone"
                  error={fieldErrorFor(orderError, 'customer', 'phone')}
                >
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    pattern="^\+[1-9]\d{9,14}$"
                    placeholder="+79990000000"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </Field>
              </section>

              <section>
                <h2>Доставка</h2>
                <div className="radio-group">
                  {pickup && (
                    <label>
                      <input
                        type="radio"
                        name="deliveryMethod"
                        checked={deliveryMethod === 'pickup'}
                        onChange={() => setDeliveryMethod('pickup')}
                      />
                      {pickup.title}
                    </label>
                  )}
                  {courier && (
                    <label>
                      <input
                        type="radio"
                        name="deliveryMethod"
                        checked={deliveryMethod === 'courier'}
                        onChange={() => setDeliveryMethod('courier')}
                      />
                      {courier.title}
                    </label>
                  )}
                </div>

                {deliveryMethod === 'pickup' && pickup && (
                  <Field label="Пункт выдачи" htmlFor="pickupPoint">
                    <select
                      id="pickupPoint"
                      required
                      value={pickupPointId}
                      onChange={(event) => setPickupPointId(event.target.value)}
                    >
                      <option value="" disabled>
                        Выберите пункт
                      </option>
                      {pickup.pickupPoints.map((point) => (
                        <option key={point.id} value={point.id}>
                          {point.title} — {point.address}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}

                {deliveryMethod === 'courier' && (
                  <>
                    <Field
                      label="Город"
                      htmlFor="city"
                      error={fieldErrorFor(orderError, 'delivery', 'address', 'city')}
                    >
                      <input
                        id="city"
                        required
                        minLength={2}
                        maxLength={100}
                        value={city}
                        onChange={(event) => setCity(event.target.value)}
                      />
                    </Field>
                    <Field
                      label="Улица"
                      htmlFor="street"
                      error={fieldErrorFor(orderError, 'delivery', 'address', 'street')}
                    >
                      <input
                        id="street"
                        required
                        minLength={2}
                        maxLength={150}
                        value={street}
                        onChange={(event) => setStreet(event.target.value)}
                      />
                    </Field>
                    <div className="field-row">
                      <Field
                        label="Дом"
                        htmlFor="house"
                        error={fieldErrorFor(orderError, 'delivery', 'address', 'house')}
                      >
                        <input
                          id="house"
                          required
                          maxLength={20}
                          value={house}
                          onChange={(event) => setHouse(event.target.value)}
                        />
                      </Field>
                      <Field label="Квартира" htmlFor="apartment">
                        <input
                          id="apartment"
                          maxLength={20}
                          value={apartment}
                          onChange={(event) => setApartment(event.target.value)}
                        />
                      </Field>
                    </div>
                  </>
                )}
              </section>

              <section>
                <h2>Оплата</h2>
                <div className="radio-group">
                  {options.paymentMethods.map((method) => (
                    <label key={method.id}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                      />
                      {method.title}
                    </label>
                  ))}
                </div>
              </section>

              <section className="checkout-summary">
                {createQuote.isPending && <p>Считаем стоимость…</p>}
                {quote && (
                  <>
                    <div className="summary-row">
                      <span>Товары</span>
                      <span>{formatMoney(quote.subtotal)}</span>
                    </div>
                    <div className="summary-row">
                      <span>Доставка</span>
                      <span>
                        {quote.shipping === 0 ? 'Бесплатно' : formatMoney(quote.shipping)}
                      </span>
                    </div>
                    <div className="summary-row summary-total">
                      <span>Итого</span>
                      <span>{formatMoney(quote.total)}</span>
                    </div>
                  </>
                )}
              </section>

              {orderError && !orderError.fields?.length && (
                <p role="alert" className="form-error">
                  {friendlyMessage(orderError)}
                </p>
              )}

              <button type="submit" className="primary" disabled={!quote || createOrder.isPending}>
                {createOrder.isPending ? 'Оформляем…' : 'Оформить заказ'}
              </button>
            </form>
          );
        }}
      </QueryState>
    </div>
  );
}
