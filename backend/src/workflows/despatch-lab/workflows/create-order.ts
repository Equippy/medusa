import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { updateOrdersStep } from "@medusajs/medusa/core-flows";
import countryMappings from "../../../modules/despatch-lab/data/country-mappings.json";
import {
  DespatchLabOrderCreateRequest,
  DespatchLabOrderProduct,
} from "../../../modules/despatch-lab/types";
import {
  createDespatchLabOrderStep,
  CreateOrderInput,
  CreateOrderOutput,
} from "../steps/create-order";
import { getMedusaOrder } from "../steps/get-medusa-order";

export interface CreateDespatchLabOrderWorkflowInput {
  orderId: string;
}

export const createDespatchLabOrderWorkflow = createWorkflow(
  {
    name: "create-despatch-lab-order",
    store: true,
  },
  (
    input: CreateDespatchLabOrderWorkflowInput
  ): WorkflowResponse<CreateOrderOutput> => {
    const order = getMedusaOrder(input.orderId);

    // Transform all data into DespatchLab order format
    const createOrderInput = transform({ order }, ({ order }) => {
      // Get DespatchLab customer ID from order metadata (added by auto-fulfill-order subscriber)
      const customerId = order.metadata?.despatchlab_customer_id as string;

      if (!customerId) {
        throw new Error(
          `Order ${order.id} is missing DespatchLab customer ID in metadata. Ensure the company has DespatchLab configured.`
        );
      }

      // Transform items to DespatchLab products
      const products: DespatchLabOrderProduct[] = (order.items || []).map(
        (item) => ({
          sku: item.variant_sku || undefined,
          quantity: item.quantity || 1,
        })
      );

      // Combine recipient name from shipping address
      const recipientName =
        `${order.shipping_address?.first_name || ""} ${
          order.shipping_address?.last_name || ""
        }`.trim() || "Customer";

      // Helper function to get country ID
      const getCountryId = (countryCode?: string): number | undefined => {
        if (!countryCode) return undefined;
        return countryMappings[countryCode.toUpperCase()] || undefined;
      };

      const orderData: DespatchLabOrderCreateRequest = {
        customerId,
        customerReference: `#${order.display_id} ${order.id}`,
        printDespatchNote: true,
        addPackagingToOrder: false,
        deliveryType: "Overnight",
        serviceTypeId: "fde829cd-34ed-4df3-b747-3c449d9b5ef9", // Mail
        featureId: "acedb878-a2e6-4584-a927-f8c0b2d1cb0c", // Standard 48 (Parcel)
        companyName: order.shipping_address?.company || undefined,
        addressLine1: order.shipping_address?.address_1 || "",
        addressLine2: order.shipping_address?.address_2 || undefined,
        townOrCity: order.shipping_address?.city || "",
        countyOrState: order.shipping_address?.province || "",
        postcodeOrZip: order.shipping_address?.postal_code || "",
        countryId: getCountryId(order.shipping_address?.country_code),
        locationType: "Business",
        recipientName: recipientName,
        recipientEmail: order.email || "",
        recipientNumber: order.shipping_address?.phone || "",
        products: products,
      };

      const finalInput: CreateOrderInput = {
        customerId,
        orderData: orderData,
      };

      return finalInput;
    });

    const despatchLabOrderId = createDespatchLabOrderStep(createOrderInput);

    updateOrdersStep({
      selector: {
        id: order.id,
      },
      update: {
        metadata: {
          despatchlab_order_id: despatchLabOrderId,
        },
      },
    });

    return new WorkflowResponse(despatchLabOrderId);
  }
);
