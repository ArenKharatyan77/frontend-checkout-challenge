export type FieldError = { path: string; message: string };

export class RequestError extends Error {
  readonly kind: 'http' | 'network' | 'parse';
  readonly status?: number;
  readonly code?: string;
  readonly fields?: FieldError[];
  readonly requestId?: string;

  constructor(params: {
    kind: 'http' | 'network' | 'parse';
    message: string;
    status?: number;
    code?: string;
    fields?: FieldError[];
    requestId?: string;
    cause?: unknown;
  }) {
    super(params.message, { cause: params.cause });
    this.name = 'RequestError';
    this.kind = params.kind;
    this.status = params.status;
    this.code = params.code;
    this.fields = params.fields;
    this.requestId = params.requestId;
  }

  fieldMessage(path: string): string | undefined {
    return this.fields?.find((field) => field.path === path)?.message;
  }
}

export function isAborted(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

const FRIENDLY_MESSAGES: Record<string, string> = {
  CART_EMPTY: 'Корзина пуста, добавьте товар перед оформлением.',
  CART_VERSION_CONFLICT: 'Корзина изменилась, обновляем данные.',
  QUOTE_EXPIRED: 'Расчёт устарел, пересчитываем стоимость.',
  IDEMPOTENCY_CONFLICT: 'Запрос уже был отправлен с другими данными.',
  PAYMENT_IN_PROGRESS: 'Оплата уже обрабатывается.',
  PAYMENT_FINALIZED: 'По этой попытке уже есть результат.',
  ORDER_ALREADY_PAID: 'Заказ уже оплачен.',
  PAYMENT_NOT_REQUIRED: 'Этот заказ не требует онлайн-оплаты.',
  INSUFFICIENT_STOCK: 'Столько товара нет в наличии.',
  PRODUCT_NOT_FOUND: 'Товар больше недоступен.',
  CART_ITEM_NOT_FOUND: 'Этой позиции уже нет в корзине.',
  QUOTE_NOT_FOUND: 'Расчёт не найден, посчитайте стоимость заново.',
  ORDER_NOT_FOUND: 'Заказ не найден.',
  PAYMENT_NOT_FOUND: 'Попытка оплаты не найдена.',
  SESSION_NOT_FOUND: 'Сессия истекла, обновите страницу.',
};

export function fieldErrorFor(
  error: RequestError | null,
  ...pathSegments: string[]
): string | undefined {
  if (!error) return undefined;
  return error.fieldMessage(`body/${pathSegments.join('/')}`);
}

export function friendlyMessage(error: RequestError): string {
  if (error.kind === 'network') return 'Нет соединения с сервером. Проверьте интернет и повторите.';
  if (error.kind === 'parse') return 'Сервер прислал неожиданный ответ. Попробуйте ещё раз.';
  if (error.code && FRIENDLY_MESSAGES[error.code]) return FRIENDLY_MESSAGES[error.code];
  return error.message;
}
