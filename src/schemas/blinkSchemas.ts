// src/schemas/blinkSchemas.ts

import { z } from "zod";

export const PublicKeyString = z
  .string()
  .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);

export const BlinkSchema = z.object({
  icon: z.string().url(),
  label: z.string(),
  title: z.string(),
  description: z.string(),
  disabled: z.boolean(),
  links: z.object({
    actions: z.array(
      z.object({
        href: z.string(),
        label: z.string(),
        parameters: z
          .array(
            z.object({
              name: z.string(),
              label: z.string(),
              required: z.boolean(),
            })
          )
          .optional(),
      })
    ),
  }),
});

export const BlinkPurchaseSchema = z.object({
  clickcrateId: PublicKeyString,
  buyerName: z.string(),
  shippingEmail: z.string().email(),
  shippingAddress: z.string(),
  shippingCity: z.string(),
  shippingStateProvince: z.string(),
  shippingCountryRegion: z.string(),
  shippingZipCode: z.string(),
  account: PublicKeyString,
});

export const ActionErrorSchema = z.object({
  message: z.string(),
});

export const SolTransferActionSchema = z.object({
  type: z.literal("SOL_TRANSFER"),
  info: z.object({
    sender: z.string(),
    receiver: z.string(),
    amount: z.number(),
  }),
});

export const ShyftCallbackSchema = z.object({
  signature: z.string(),
  timestamp: z.string(),
  fee: z.number(),
  fee_payer: z.string(),
  status: z.literal("Success"),
  type: z.literal("SOL_TRANSFER"),
  actions: z.array(SolTransferActionSchema),
});

export const OrderManager = z.union([
  z.literal("clickcrate"),
  z.literal("shopify"),
  z.literal("square"),
]);

export const OrderStatusEnum = z.enum([
  "Pending", // Product is registered but not placed
  "Placed", // Product is placed in a ClickCrate
  "Confirmed", // Buyer payment for product recieved. Order has been routed & confirmed.
  "Fulfilled", // Order has been fulfilled and is in transit to buyer.
  "Delivered", // Product has been delivered to buyer.
  "Completed", // Product return window has closed. Order is finalized & completed.
  "Cancelled", // Order has been cancelled.
]);

const ShippingDetailsSchema = z.object({
  shippingName: z.string(),
  shippingEmail: z.string().email(),
  shippingPhone: z.string().nullable().optional(),
  shippingAddress: z.string(),
  shippingCity: z.string(),
  shippingStateProvince: z.string(),
  shippingCountryRegion: z.string(),
  shippingZipCode: z.string(),
});

const OrderDataSchema = z
  .object({
    productId: PublicKeyString,
    productName: z.string(),
    buyerId: PublicKeyString,
    sellerId: PublicKeyString,
    quantity: z.number().int().positive(),
    totalPrice: z.number().positive(),
    orderManager: OrderManager,
  })
  .and(ShippingDetailsSchema.partial());

const OrderSchema = z
  .object({
    id: z.string().uuid(),
    productId: PublicKeyString,
    productName: z.string(),
    buyerId: PublicKeyString,
    sellerId: PublicKeyString,
    quantity: z.number().int().positive(),
    totalPrice: z.number().positive(),
    orderManager: OrderManager,
    creatorId: z.string(),
    status: OrderStatusEnum,
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .and(ShippingDetailsSchema);

export type OrderData = z.infer<typeof OrderDataSchema>;
export type Order = z.infer<typeof OrderSchema>;
