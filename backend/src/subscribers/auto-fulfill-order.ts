import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { type SubscriberArgs, type SubscriberConfig } from "@medusajs/medusa";
import {
  createOrderFulfillmentWorkflow,
  createOrderShipmentWorkflow,
} from "@medusajs/medusa/core-flows";
import DespatchLabFulfillmentService from "src/modules/despatch-lab-fulfillment/service";
import companyFulfillmentProvider from "../links/company-fulfillment-provider";

function generateTrackingCode(countryCode: string = "XX"): string {
  // Generate a random tracking number in the format: XX123456789YY
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const prefix = countryCode.toUpperCase();
  const numbers = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(9, "0");
  const suffix =
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)];
  return `${prefix}${numbers}${suffix}`;
}

export default async function autoFulfillOrder({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderService = container.resolve(Modules.ORDER);
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const orderId = data.id;

  const order = await orderService.retrieveOrder(orderId, {
    select: ["*"],
    relations: ["items", "shipping_address"],
  });

  if (!order.items) {
    logger.error(`Order does not have items. OrderId=${order.id}.`);
    return;
  }

  if (!order.metadata?.despatchlab_customer_id) {
    // If order has a company_id, try to get DespatchLab customer ID for fulfillment
    const companyId = order.metadata?.company_id as string;
    if (!companyId) {
      throw new Error(
        `Order ${order.id} does not have companyId, cannot be fulfilled`
      );
    }

    // Query the company-fulfillment-provider link to get DespatchLab configuration
    const { data: companyProviderLinks } = await query.graph(
      {
        entity: companyFulfillmentProvider.entryPoint,
        filters: {
          company_id: companyId,
          fulfillment_provider_id: DespatchLabFulfillmentService.identifier,
        },
        fields: ["config"],
      },
      { throwIfKeyNotFound: true }
    );

    const despatchLabCustomerId = companyProviderLinks[0].config.customerId;
    if (!despatchLabCustomerId) {
      throw new Error(
        `Order ${order.id} does not have despatchLabCustomerId, cannot be fulfilled`
      );
    }

    // Update order metadata with DespatchLab customer ID
    await orderService.updateOrders(order.id, {
      metadata: {
        ...order.metadata,
        despatchlab_customer_id: despatchLabCustomerId,
      },
    });

    logger.info(
      `Added DespatchLab customer ID to order metadata. OrderId=${order.id}, DespatchLabCustomerId=${despatchLabCustomerId}`
    );
  }

  const { result: fulfillment } = await createOrderFulfillmentWorkflow(
    container
  ).run({
    input: {
      order_id: order.id,
      items: order.items,
    },
  });

  await createOrderShipmentWorkflow(container).run({
    input: {
      order_id: order.id,
      fulfillment_id: fulfillment.id,
      items: order.items,
      labels: [
        {
          label_url: "",
          tracking_number: generateTrackingCode(
            order.shipping_address?.country_code?.toUpperCase()
          ),
          tracking_url: "",
        },
      ],
    },
  });

  logger.info(`Order auto-fulfilled. OrderId=${order.id}.`);
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
