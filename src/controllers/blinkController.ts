// src/controllers/blinkController.ts

import { Request, Response } from "express";
import {
  BlinkSchema,
  BlinkPurchaseSchema,
  ActionErrorSchema,
  ShyftCallbackSchema,
} from "../schemas/blinkSchemas";
import { ACTIONS_CORS_HEADERS_MIDDLEWARE } from "@solana/actions";

// Placeholders for Solana services
const SolanaService = {
  fetchClickCrate: async () => ({}),
  fetchDasCoreCollection: async () => ({}),
  fetchProductListing: async () => ({}),
  fetchDasCoreCollectionAssets: async () => [],
  createPaymentTransaction: async () => ({}),
  setupShyftCallback: async () => "",
  getPurchaseDetailsByCallbackId: () => ({}),
  verifyTransaction: async () => true,
  makePurchase: async () => ({}),
  signAndSendTransaction: async () => "",
};

// Placeholder for OrderRouter
class OrderRouter {
  constructor(public owner: string) {}
  async routeOrder() {}
}

export const getBlink = async (req: Request, res: Response) => {
  try {
    const { clickcrateId } = req.params;

    if (!clickcrateId || clickcrateId === "") {
      return res
        .status(400)
        .set(ACTIONS_CORS_HEADERS_MIDDLEWARE)
        .json({ message: "ClickCrate not found" });
    }

    // Placeholder for fetching actual data
    const clickcrateAsset = await SolanaService.fetchClickCrate(clickcrateId);
    if (!clickcrateAsset.product) {
      return res
        .status(404)
        .set(ACTIONS_CORS_HEADERS_MIDDLEWARE)
        .json({ message: "Product not found in ClickCrate" });
    }

    const productListingAsset = await SolanaService.fetchDasCoreCollection(
      clickcrateAsset.product
    );
    const productListing = await SolanaService.fetchProductListing(
      clickcrateAsset.product
    );

    if (!productListingAsset || !productListing) {
      return res
        .status(404)
        .set(ACTIONS_CORS_HEADERS_MIDDLEWARE)
        .json({ message: "Product info not found" });
    }

    // Mock data for demonstration
    const icon = "https://example.com/icon.png";
    const productSize = { value: "Medium" };
    const disable = false;
    const buttonText = `Buy for 1 SOL`;

    const blinkResponse = {
      icon,
      label: `Purchase Product`,
      title: `Product Title`,
      description: `IN STOCK: 10 | SIZE: ${productSize.value} | DELIVERY: ~2 weeks 
    \nPRODUCT DESCRIPTION: Sample product description
    \nORDER INFO: Order confirmations and updates will be sent to your provided email address. To avoid delays ensure all provided information is correct.
    \nNOTICE: All sales are FINAL and NON-REFUNDABLE! Please email support@example.com if you have an order issue`,
      disabled: disable,
      links: {
        actions: [
          {
            href: `/blink/purchase?clickcrateId=${clickcrateId}&buyerName={buyerName}&shippingEmail={shippingEmail}&shippingAddress={shippingAddress}&shippingCity={shippingCity}&shippingStateProvince={shippingStateProvince}&shippingCountryRegion={shippingCountryRegion}&shippingZipCode={shippingZipCode}`,
            label: buttonText,
            parameters: [
              { name: "buyerName", label: "First & Last name", required: true },
              { name: "shippingEmail", label: "Email", required: true },
              {
                name: "shippingAddress",
                label: "Address (including Apt., Suite, etc.)",
                required: true,
              },
              { name: "shippingCity", label: "City", required: true },
              {
                name: "shippingStateProvince",
                label: "State/Province",
                required: true,
              },
              {
                name: "shippingCountryRegion",
                label: "Country/Region",
                required: true,
              },
              { name: "shippingZipCode", label: "ZIP code", required: true },
            ],
          },
        ],
      },
    };

    const validatedBlink = BlinkSchema.parse(blinkResponse);
    res.status(200).set(ACTIONS_CORS_HEADERS_MIDDLEWARE).json(validatedBlink);
  } catch (error) {
    console.error("Failed to fetch blink details:", error);
    const validatedError = ActionErrorSchema.parse({ message: "Bad Request" });
    res.status(400).set(ACTIONS_CORS_HEADERS_MIDDLEWARE).json(validatedError);
  }
};

export const createPurchase = async (req: Request, res: Response) => {
  try {
    const { account } = req.body;
    const {
      clickcrateId,
      buyerName,
      shippingEmail,
      shippingPhone,
      shippingAddress,
      shippingCity,
      shippingStateProvince,
      shippingCountryRegion,
      shippingZipCode,
    } = req.query;

    // Validate input parameters
    if (
      !account ||
      !clickcrateId ||
      !buyerName ||
      !shippingEmail ||
      !shippingAddress ||
      !shippingCity ||
      !shippingStateProvince ||
      !shippingCountryRegion ||
      !shippingZipCode
    ) {
      return res
        .status(400)
        .set(ACTIONS_CORS_HEADERS_MIDDLEWARE)
        .json({ message: "Missing required parameters" });
    }

    const paymentAmount = 1000000000; // 1 SOL in lamports
    const paymentTransaction = await SolanaService.createPaymentTransaction(
      paymentAmount,
      account,
      process.env.SERVER_WALLET_ADDRESS!
    );

    const callbackId = await SolanaService.setupShyftCallback(
      {
        productId: "mock-product-id",
        productName: "Mock Product",
        quantity: 1,
        orderManager: "clickcrate",
        buyerId: account,
        sellerId: "mock-seller-id",
        totalPrice: paymentAmount,
        shippingName: buyerName as string,
        shippingEmail: shippingEmail as string,
        shippingPhone: shippingPhone as string | undefined,
        shippingAddress: shippingAddress as string,
        shippingCity: shippingCity as string,
        shippingStateProvince: shippingStateProvince as string,
        shippingCountryRegion: shippingCountryRegion as string,
        shippingZipCode: shippingZipCode as string,
      },
      "mock-product-listing-id",
      clickcrateId as string
    );

    const serializedPaymentTx = Buffer.from(
      JSON.stringify(paymentTransaction)
    ).toString("base64");
    console.log(`Mock Product callbackId: `, callbackId);

    res
      .status(200)
      .set(ACTIONS_CORS_HEADERS_MIDDLEWARE)
      .json({
        transaction: serializedPaymentTx,
        message: `Purchase successful! \n Order confirmation emailed to: ${shippingEmail}`,
      });
  } catch (error) {
    console.error("Failed to create purchase transaction:", error);
    const validatedError = ActionErrorSchema.parse({ message: "Bad Request" });
    res.status(400).set(ACTIONS_CORS_HEADERS_MIDDLEWARE).json(validatedError);
  }
};

export const handleCallback = async (req: Request, res: Response) => {
  console.log("Callback received:", req);

  try {
    const callbackId = req.headers["callback-id"] as string;
    if (!callbackId) {
      return res.status(400).json({ message: "Missing callbackId in headers" });
    }
    console.log("Callback ID received:", callbackId);

    const callbackData = ShyftCallbackSchema.parse(req.body);
    console.log("CallbackData:", callbackData);

    const purchaseDetails =
      SolanaService.getPurchaseDetailsByCallbackId(callbackId);
    if (!purchaseDetails) {
      return res.status(404).json({ message: "Purchase details not found" });
    }
    const clickcrateBuyer = process.env.SERVER_WALLET_ADDRESS!;
    if (!clickcrateBuyer) {
      console.error("Buyer not found");
      return res.status(400).json({ message: "Failed to verify tx buyer" });
    }
    console.log("purchaseDetails:", purchaseDetails);

    const isValid = await SolanaService.verifyTransaction(
      callbackData,
      purchaseDetails.price,
      process.env.SERVER_WALLET_ADDRESS!
    );
    console.log("Exited purchase validation!");

    if (!isValid) {
      console.log("Purchase is not valid! isValid is: ", isValid);
      return res.status(400).json({ message: "Invalid transaction" });
    }
    console.log("Purchase isValid:", callbackData);

    const transaction = await SolanaService.makePurchase(
      purchaseDetails.productListingId,
      purchaseDetails.clickcrateId,
      purchaseDetails.productId,
      1,
      clickcrateBuyer,
      purchaseDetails.owner
    );
    if (!transaction) {
      throw Error("Make purchase transaction undefined");
    }
    console.log("ClickCrate purchase tx:", transaction);

    const devnetPurchaseTxSig = await SolanaService.signAndSendTransaction(
      transaction,
      []
    );
    console.log(
      "ClickCrate purchase tx sent and confirmed, devnetPurchaseTxSig:",
      devnetPurchaseTxSig
    );

    const orderRouter = new OrderRouter(purchaseDetails.owner);
    await orderRouter.routeOrder(
      {
        productId: purchaseDetails.productId,
        productName: purchaseDetails.productName,
        quantity: 1,
        orderManager: purchaseDetails.orderManager,
        buyerId: purchaseDetails.buyerAccount,
        sellerId: purchaseDetails.owner,
        totalPrice: purchaseDetails.price / 1000000000, // Convert lamports to SOL
        shippingName: purchaseDetails.buyerName,
        shippingEmail: purchaseDetails.shippingEmail,
        shippingPhone: purchaseDetails.shippingPhone,
        shippingAddress: purchaseDetails.shippingAddress,
        shippingCity: purchaseDetails.shippingCity,
        shippingStateProvince: purchaseDetails.shippingStateProvince,
        shippingCountryRegion: purchaseDetails.shippingCountryRegion,
        shippingZipCode: purchaseDetails.shippingZipCode,
      },
      purchaseDetails.owner
    );
    console.log("Purchase made! Order routed & placed");

    res.status(200).json({
      message: "Purchase made! Order routed & placed",
      devnetTxId: devnetPurchaseTxSig,
    });
  } catch (error) {
    console.error("Failed to process callback:", error);
    res.status(400).json({ message: "Bad Request" });
  }
};
