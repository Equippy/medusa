import { FetchError } from "@medusajs/js-sdk";
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  AdminFulfillmentProviderConfigsResponse,
  AdminFulfillmentProviderConfigResponse,
  AdminSetFulfillmentProviderConfig,
  AdminUpdateFulfillmentProviderConfig,
  AdminAvailableFulfillmentProvidersResponse,
} from "../../../types";
import { queryKeysFactory } from "../../lib/query-key-factory";
import { sdk } from "../../lib/client";

export const fulfillmentProviderQueryKey = queryKeysFactory("fulfillment_provider");

export const useFulfillmentProviderConfigs = (
  companyId: string,
  options?: UseQueryOptions<
    AdminFulfillmentProviderConfigsResponse,
    FetchError,
    AdminFulfillmentProviderConfigsResponse,
    QueryKey
  >
) => {
  const fetchConfigs = async () =>
    sdk.client.fetch<AdminFulfillmentProviderConfigsResponse>(
      `/admin/companies/${companyId}/fulfillment-providers`,
      {
        method: "GET",
      }
    );

  return useQuery({
    queryKey: fulfillmentProviderQueryKey.list({ companyId }),
    queryFn: fetchConfigs,
    ...options,
  });
};

export const useFulfillmentProviderConfig = (
  companyId: string,
  providerId: string,
  options?: UseQueryOptions<
    AdminFulfillmentProviderConfigResponse,
    FetchError,
    AdminFulfillmentProviderConfigResponse,
    QueryKey
  >
) => {
  const fetchConfig = async () =>
    sdk.client.fetch<AdminFulfillmentProviderConfigResponse>(
      `/admin/companies/${companyId}/fulfillment-providers/${providerId}`,
      {
        method: "GET",
      }
    );

  return useQuery({
    queryKey: fulfillmentProviderQueryKey.detail(`${companyId}:${providerId}`),
    queryFn: fetchConfig,
    ...options,
  });
};

export const useSetFulfillmentProviderConfig = (
  companyId: string,
  options?: UseMutationOptions<
    AdminFulfillmentProviderConfigResponse,
    FetchError,
    AdminSetFulfillmentProviderConfig
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: AdminSetFulfillmentProviderConfig) =>
      sdk.client.fetch<AdminFulfillmentProviderConfigResponse>(
        `/admin/companies/${companyId}/fulfillment-providers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: config,
        }
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: fulfillmentProviderQueryKey.list({ companyId }),
      });
      queryClient.invalidateQueries({
        queryKey: fulfillmentProviderQueryKey.detail(`${companyId}:${variables.provider_id}`),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateFulfillmentProviderConfig = (
  companyId: string,
  providerId: string,
  options?: UseMutationOptions<
    AdminFulfillmentProviderConfigResponse,
    FetchError,
    AdminUpdateFulfillmentProviderConfig
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: AdminUpdateFulfillmentProviderConfig) =>
      sdk.client.fetch<AdminFulfillmentProviderConfigResponse>(
        `/admin/companies/${companyId}/fulfillment-providers/${providerId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: config,
        }
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: fulfillmentProviderQueryKey.list({ companyId }),
      });
      queryClient.invalidateQueries({
        queryKey: fulfillmentProviderQueryKey.detail(`${companyId}:${providerId}`),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteFulfillmentProviderConfig = (
  companyId: string,
  providerId: string,
  options?: UseMutationOptions<void, FetchError>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      sdk.client.fetch<void>(
        `/admin/companies/${companyId}/fulfillment-providers/${providerId}`,
        {
          method: "DELETE",
        }
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: fulfillmentProviderQueryKey.list({ companyId }),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useAvailableFulfillmentProviders = (
  options?: UseQueryOptions<
    AdminAvailableFulfillmentProvidersResponse,
    FetchError,
    AdminAvailableFulfillmentProvidersResponse,
    QueryKey
  >
) => {
  const fetchProviders = async () =>
    sdk.client.fetch<AdminAvailableFulfillmentProvidersResponse>(
      `/admin/fulfillment-providers`,
      {
        method: "GET",
      }
    );

  return useQuery({
    queryKey: fulfillmentProviderQueryKey.lists(),
    queryFn: fetchProviders,
    ...options,
  });
};