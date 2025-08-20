import { zodResolver } from "@hookform/resolvers/zod";
import { TruckFast } from "@medusajs/icons";
import {
  Button,
  FocusModal,
  Heading,
  Input,
  Label,
  Select,
  Switch,
  toast,
  Text,
} from "@medusajs/ui";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form } from "../../../../components/common/form";
import {
  useSetFulfillmentProviderConfig,
  useUpdateFulfillmentProviderConfig,
  useRegions,
} from "../../../../hooks/api";
import { FulfillmentProviderConfig, QueryCompany } from "../../../../../types";

const fulfillmentProviderSchema = z.object({
  provider_id: z.string().min(1, "Provider is required"),
  customerId: z.string().optional(),
  depotId: z.string().optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  regions: z.array(z.string()).optional(),
  is_default: z.boolean().optional(),
});

type FulfillmentProviderFormData = z.infer<typeof fulfillmentProviderSchema>;

interface FulfillmentProviderDrawerProps {
  company: QueryCompany;
  config?: FulfillmentProviderConfig;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AVAILABLE_PROVIDERS = [
  { value: "despatch-lab", label: "DespatchLab" },
  { value: "manual", label: "Manual Fulfillment" },
];

export const FulfillmentProviderDrawer = ({
  company,
  config,
  open,
  setOpen,
}: FulfillmentProviderDrawerProps) => {
  const isEdit = !!config;
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  
  const { mutateAsync: createConfig, isPending: isCreating } =
    useSetFulfillmentProviderConfig(company.id);
  const { mutateAsync: updateConfig, isPending: isUpdating } =
    useUpdateFulfillmentProviderConfig(company.id, config?.provider_id || "");
  
  const { regions, isPending: regionsLoading } = useRegions();
  const availableRegions = regions?.flatMap(region => 
    region.countries?.map(country => ({
      value: country.iso_2,
      label: country.name,
    }))
  ).filter(Boolean) || [];

  const form = useForm<FulfillmentProviderFormData>({
    resolver: zodResolver(fulfillmentProviderSchema),
    defaultValues: {
      provider_id: config?.provider_id || "",
      customerId: config?.config?.customerId || "",
      depotId: config?.config?.depotId || "",
      apiKey: config?.config?.apiKey || "",
      apiSecret: config?.config?.apiSecret || "",
      regions: config?.regions || [],
      is_default: config?.is_default || false,
    },
  });

  const selectedProvider = form.watch("provider_id");

  useEffect(() => {
    if (config) {
      setSelectedRegions(config.regions || []);
      form.reset({
        provider_id: config.provider_id,
        customerId: config.config?.customerId || "",
        depotId: config.config?.depotId || "",
        apiKey: config.config?.apiKey || "",
        apiSecret: config.config?.apiSecret || "",
        regions: config.regions || [],
        is_default: config.is_default || false,
      });
    }
  }, [config, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    const configData = {
      provider_id: data.provider_id,
      config: {
        customerId: data.customerId,
        depotId: data.depotId,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
      },
      regions: selectedRegions,
      is_default: data.is_default,
    };

    try {
      if (isEdit) {
        await updateConfig({
          config: configData.config,
          regions: configData.regions,
          is_default: configData.is_default,
        });
        toast.success("Fulfillment provider configuration updated successfully");
      } else {
        await createConfig(configData);
        toast.success("Fulfillment provider configuration created successfully");
      }
      setOpen(false);
      form.reset();
      setSelectedRegions([]);
    } catch (error) {
      toast.error(`Failed to ${isEdit ? "update" : "create"} configuration`);
    }
  });

  const handleRegionToggle = (regionValue: string) => {
    setSelectedRegions((prev) => {
      if (prev.includes(regionValue)) {
        return prev.filter((r) => r !== regionValue);
      } else {
        return [...prev, regionValue];
      }
    });
    form.setValue("regions", selectedRegions);
  };

  return (
    <FocusModal open={open} onOpenChange={setOpen}>
      <FocusModal.Content>
        <FocusModal.Header>
          <div className="flex items-center gap-2">
            <TruckFast className="text-ui-fg-subtle" />
            <Heading level="h2">
              {isEdit ? "Edit" : "Add"} Fulfillment Provider
            </Heading>
          </div>
        </FocusModal.Header>

        <FocusModal.Body className="flex flex-col gap-6">
          <Form {...form}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid gap-4">
                <Form.Field
                  control={form.control}
                  name="provider_id"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Provider</Form.Label>
                      <Form.Control>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isEdit}
                        >
                          <Select.Trigger>
                            <Select.Value placeholder="Select a provider" />
                          </Select.Trigger>
                          <Select.Content>
                            {AVAILABLE_PROVIDERS.map((provider) => (
                              <Select.Item 
                                key={provider.value} 
                                value={provider.value}
                              >
                                {provider.label}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select>
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />

                {selectedProvider === "despatch-lab" && (
                  <>
                    <Form.Field
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>Customer ID</Form.Label>
                          <Form.Control>
                            <Input
                              {...field}
                              placeholder="127911ec-9bfd-45c3-9d4e-e48321991c15"
                            />
                          </Form.Control>
                          <Form.ErrorMessage />
                        </Form.Item>
                      )}
                    />

                    <Form.Field
                      control={form.control}
                      name="depotId"
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>Depot ID (Optional)</Form.Label>
                          <Form.Control>
                            <Input {...field} placeholder="Optional depot ID" />
                          </Form.Control>
                          <Form.ErrorMessage />
                        </Form.Item>
                      )}
                    />

                    <Form.Field
                      control={form.control}
                      name="apiKey"
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>API Key (Optional)</Form.Label>
                          <Form.Control>
                            <Input
                              {...field}
                              placeholder="Optional API key override"
                            />
                          </Form.Control>
                          <Form.ErrorMessage />
                        </Form.Item>
                      )}
                    />

                    <Form.Field
                      control={form.control}
                      name="apiSecret"
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>API Secret (Optional)</Form.Label>
                          <Form.Control>
                            <Input
                              {...field}
                              type="password"
                              placeholder="Optional API secret override"
                            />
                          </Form.Control>
                          <Form.ErrorMessage />
                        </Form.Item>
                      )}
                    />
                  </>
                )}

                <div className="flex flex-col gap-3">
                  <Label>Active Regions</Label>
                  {regionsLoading ? (
                    <Text size="small" className="text-ui-fg-muted">Loading regions...</Text>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {availableRegions.map((region) => (
                        <div
                          key={region.value}
                          className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-ui-bg-subtle"
                          onClick={() => handleRegionToggle(region.value)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedRegions.includes(region.value)}
                            onChange={() => handleRegionToggle(region.value)}
                            className="rounded border-ui-border-base"
                          />
                          <Text size="small">{region.label}</Text>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Form.Field
                  control={form.control}
                  name="is_default"
                  render={({ field }) => (
                    <Form.Item>
                      <div className="flex items-center gap-3">
                        <Form.Control>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </Form.Control>
                        <Form.Label className="!mt-0">Default Provider</Form.Label>
                      </div>
                      <Form.Hint>
                        Set as the default fulfillment provider for this company
                      </Form.Hint>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
              </div>
            </form>
          </Form>
        </FocusModal.Body>

        <FocusModal.Footer>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              isLoading={isCreating || isUpdating}
            >
              {isEdit ? "Update" : "Create"} Configuration
            </Button>
          </div>
        </FocusModal.Footer>
      </FocusModal.Content>
    </FocusModal>
  );
};