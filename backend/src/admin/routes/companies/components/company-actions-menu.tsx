import { HttpTypes } from "@medusajs/framework/types";
import { Link, LockClosedSolid, PencilSquare, Trash, TruckFast } from "@medusajs/icons";
import { toast } from "@medusajs/ui";
import { QueryCompany } from "../../../../types";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ActionMenu } from "../../../components/common";
import { DeletePrompt } from "../../../components/common/delete-prompt";
import { useDeleteCompany } from "../../../hooks/api";
import {
  CompanyApprovalSettingsDrawer,
  CompanyCustomerGroupDrawer,
  CompanyUpdateDrawer,
  FulfillmentProviderDrawer,
} from "./";

export const CompanyActionsMenu = ({
  company,
  customerGroups,
}: {
  company: QueryCompany;
  customerGroups?: HttpTypes.AdminCustomerGroup[];
}) => {
  const [editOpen, setEditOpen] = useState(false);
  const [customerGroupOpen, setCustomerGroupOpen] = useState(false);
  const [approvalSettingsOpen, setApprovalSettingsOpen] = useState(false);
  const [fulfillmentProviderOpen, setFulfillmentProviderOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { mutateAsync: mutateDelete, isPending: loadingDelete } =
    useDeleteCompany(company.id);

  const navigate = useNavigate();

  const handleDelete = () => {
    mutateDelete(company.id, {
      onSuccess: () => {
        navigate("/companies");
        toast.success(`Company ${company.name} deleted successfully`);
      },
    });
  };

  return (
    <>
      <ActionMenu
        groups={[
          {
            actions: [
              {
                icon: <PencilSquare />,
                label: "Edit details",
                onClick: () => setEditOpen(true),
              },
              {
                icon: <Link />,
                label: "Manage customer group",
                onClick: () => setCustomerGroupOpen(true),
              },
              {
                icon: <LockClosedSolid />,
                label: "Approval settings",
                onClick: () => setApprovalSettingsOpen(true),
              },
              {
                icon: <TruckFast />,
                label: "Fulfillment providers",
                onClick: () => setFulfillmentProviderOpen(true),
              },
            ],
          },
          {
            actions: [
              {
                icon: <Trash />,
                label: "Delete",
                onClick: () => setDeleteOpen(true),
              },
            ],
          },
        ]}
      />

      <CompanyUpdateDrawer
        company={company}
        open={editOpen}
        setOpen={setEditOpen}
      />
      <CompanyCustomerGroupDrawer
        company={company}
        customerGroups={customerGroups}
        open={customerGroupOpen}
        setOpen={setCustomerGroupOpen}
      />
      <CompanyApprovalSettingsDrawer
        company={company}
        open={approvalSettingsOpen}
        setOpen={setApprovalSettingsOpen}
      />
      <FulfillmentProviderDrawer
        company={company}
        open={fulfillmentProviderOpen}
        setOpen={setFulfillmentProviderOpen}
      />
      <DeletePrompt
        handleDelete={handleDelete}
        loading={loadingDelete}
        open={deleteOpen}
        setOpen={setDeleteOpen}
      />
    </>
  );
};
