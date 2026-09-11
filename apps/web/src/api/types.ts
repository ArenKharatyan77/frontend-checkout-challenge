import type { Static } from '@sinclair/typebox';
import {
  CheckoutOptionsSchema,
  SandboxSchema,
  SessionSchema,
  type Cart,
} from '@checkout/contracts';

export type CheckoutOptions = Static<typeof CheckoutOptionsSchema>;
export type Sandbox = Static<typeof SandboxSchema>;
export type Session = Static<typeof SessionSchema>;
export type CartItem = Cart['items'][number];
export type DeliveryMethodOption = CheckoutOptions['deliveryMethods'][number];
export type SandboxCard = Sandbox['cards'][number];
