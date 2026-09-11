import type {
  Cart,
  CreateOrder,
  Delivery,
  Order,
  Payment,
  Product,
  Quote,
  Scenario,
  Simulation,
} from '@checkout/contracts';
import type { ApiClient, Envelope } from './client';
import type { CartItem, CheckoutOptions, Sandbox, Session } from './types';

export function createSession(client: ApiClient) {
  return client.post<Session>('/api/sessions');
}

export function fetchProducts(client: ApiClient, signal?: AbortSignal) {
  return client.get<Product[]>('/api/products', signal);
}

export function fetchSandbox(client: ApiClient, signal?: AbortSignal) {
  return client.get<Sandbox>('/api/sandbox', signal);
}

export function fetchCart(client: ApiClient, signal?: AbortSignal) {
  return client.get<Cart>('/api/cart', signal);
}

export function setCartItem(client: ApiClient, productId: string, quantity: number) {
  return client.put<CartItem>(`/api/cart/items/${productId}`, { quantity });
}

export function removeCartItem(client: ApiClient, productId: string) {
  return client.del<void>(`/api/cart/items/${productId}`);
}

export function fetchCheckoutOptions(client: ApiClient, signal?: AbortSignal) {
  return client.get<CheckoutOptions>('/api/checkout/options', signal);
}

export function createQuote(client: ApiClient, cartVersion: number, delivery: Delivery) {
  return client.post<Quote>('/api/quotes', { cartVersion, delivery });
}

export function fetchQuote(client: ApiClient, quoteId: string, signal?: AbortSignal) {
  return client.get<Quote>(`/api/quotes/${quoteId}`, signal);
}

export function createOrder(client: ApiClient, body: CreateOrder, idempotencyKey: string) {
  return client.post<Order>('/api/orders', body, idempotencyKey);
}

export function fetchOrder(client: ApiClient, orderId: string, signal?: AbortSignal) {
  return client.get<Order>(`/api/orders/${orderId}`, signal);
}

export function createPaymentAttempt(client: ApiClient, orderId: string, idempotencyKey: string) {
  return client.post<Payment>(`/api/orders/${orderId}/payments`, {}, idempotencyKey);
}

export function fetchOrderPayments(client: ApiClient, orderId: string, signal?: AbortSignal) {
  return client.get<Payment[]>(`/api/orders/${orderId}/payments`, signal);
}

export function fetchPayment(client: ApiClient, paymentId: string, signal?: AbortSignal) {
  return client.get<Payment>(`/api/payments/${paymentId}`, signal);
}

export function simulatePayment(
  client: ApiClient,
  paymentId: string,
  scenario: Scenario,
): Promise<Envelope<Simulation>> {
  return client.postWithMeta<Simulation>(`/api/payments/${paymentId}/simulations`, { scenario });
}
