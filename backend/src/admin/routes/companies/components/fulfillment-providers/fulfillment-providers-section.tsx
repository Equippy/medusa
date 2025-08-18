import { ExclamationCircle, PencilSquare, Plus, Trash, TruckFast } from "@medusajs/icons";
import {
  Badge,
  Button,
  Container,
  Heading,
  Table,
  Text,
  toast,
} from "@medusajs/ui";
import { useState } from "react";
import { ActionMenu, DeletePrompt } from "../../../../components/common";
import {
  useFulfillmentProviderConfigs,
  useDeleteFulfillmentProviderConfig,
} from "../../../../hooks/api";
import { FulfillmentProviderConfig, QueryCompany } from "../../../../../types";
import { FulfillmentProviderDrawer } from "./fulfillment-provider-drawer";

interface FulfillmentProvidersSectionProps {
  company: QueryCompany;
}

const getProviderDisplayName = (providerId: string) => {
  switch (providerId) {
    case "despatch-lab":
      return "DespatchLab";
    case "manual":
      return "Manual Fulfillment";
    default:
      return providerId;
  }
};

const getRegionDisplayNames = (regions?: string[]) => {
  if (!regions || regions.length === 0) return "All regions";
  
  const regionMap: { [key: string]: string } = {
    gb: "UK",
    eu: "EU",
    us: "US",
    ca: "CA",
    au: "AU",
  };
  
  return regions.map(region => regionMap[region] || region).join(", ");
};

const getConfigDisplay = (config?: FulfillmentProviderConfig["config"]) => {
  if (!config) return "-";
  
  if (config.customerId) {
    return `${config.customerId.substring(0, 8)}...`;
  }
  
  return "Configured";
};

export const FulfillmentProvidersSection = ({ company }: FulfillmentProvidersSectionProps) => {
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<FulfillmentProviderConfig | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<FulfillmentProviderConfig | undefined>();

  const { data, isLoading } = useFulfillmentProviderConfigs(company.id);
  const { mutateAsync: deleteConfig, isPending: isDeleting } = 
    useDeleteFulfillmentProviderConfig(
      company.id, 
      configToDelete?.provider_id || ""
    );

  const configurations = data?.fulfillment_provider_configurations || [];

  const handleEdit = (config: FulfillmentProviderConfig) => {
    setSelectedConfig(config);
    setEditDrawerOpen(true);
  };

  const handleDelete = (config: FulfillmentProviderConfig) => {
    setConfigToDelete(config);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!configToDelete) return;
    
    try {
      await deleteConfig();
      toast.success(`${getProviderDisplayName(configToDelete.provider_id)} configuration deleted successfully`);
      setDeleteDialogOpen(false);
      setConfigToDelete(undefined);
    } catch (error) {
      toast.error("Failed to delete configuration");
    }
  };

  const handleCloseDrawers = () => {
    setCreateDrawerOpen(false);
    setEditDrawerOpen(false);
    setSelectedConfig(undefined);
  };

  return (
    <>
      <Container className="flex flex-col p-0 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 justify-between border-b border-gray-200">
          <div className="flex items-center gap-2">
            <TruckFast className="text-ui-fg-subtle" />
            <Heading className="font-sans font-medium h1-core">
              Fulfillment Providers
            </Heading>
          </div>
          <Button
            size="small"
            variant="secondary"
            onClick={() => setCreateDrawerOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Add Provider
          </Button>
        </div>

        {isLoading ? (
          <div className="flex h-[200px] w-full items-center justify-center">
            <Text className="text-ui-fg-subtle">Loading configurations...</Text>
          </div>
        ) : configurations.length > 0 ? (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Provider</Table.HeaderCell>
                <Table.HeaderCell>Configuration</Table.HeaderCell>
                <Table.HeaderCell>Regions</Table.HeaderCell>
                <Table.HeaderCell>Default</Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {configurations.map((config) => (
                <Table.Row key={config.provider_id}>
                  <Table.Cell className="font-medium">
                    {getProviderDisplayName(config.provider_id)}
                  </Table.Cell>
                  <Table.Cell>
                    <Text className="text-ui-fg-subtle">
                      {getConfigDisplay(config.config)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text className="text-ui-fg-subtle">
                      {getRegionDisplayNames(config.regions)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    {config.is_default ? (
                      <Badge size="small" color="green">
                        Default
                      </Badge>
                    ) : (
                      <Text className="text-ui-fg-muted">-</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <ActionMenu
                      groups={[
                        {
                          actions: [
                            {
                              icon: <PencilSquare />,
                              label: "Edit configuration",
                              onClick: () => handleEdit(config),
                            },
                            {
                              icon: <Trash />,
                              label: "Delete configuration",
                              onClick: () => handleDelete(config),
                            },
                          ],
                        },
                      ]}
                    />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        ) : (
          <div className="flex h-[200px] w-full flex-col items-center justify-center gap-y-4">
            <div className="flex flex-col items-center gap-y-3">
              <ExclamationCircle className="text-ui-fg-muted" />
              <div className="flex flex-col items-center gap-y-1">
                <Text className="font-medium font-sans txt-compact-small">
                  No fulfillment providers configured
                </Text>
                <Text className="txt-small text-ui-fg-muted">
                  Add a fulfillment provider to start shipping orders for this company.
                </Text>
              </div>
            </div>
          </div>
        )}
      </Container>

      <FulfillmentProviderDrawer
        company={company}
        open={createDrawerOpen}
        setOpen={setCreateDrawerOpen}
      />

      <FulfillmentProviderDrawer
        company={company}
        config={selectedConfig}
        open={editDrawerOpen}
        setOpen={handleCloseDrawers}
      />

      <DeletePrompt
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        handleDelete={handleConfirmDelete}
        loading={isDeleting}
      />
    </>
  );
};