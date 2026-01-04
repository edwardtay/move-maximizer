"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  getVaultInfo,
  getUserPosition,
  getCurrentAPY,
  buildDepositPayload,
  buildWithdrawPayload,
  buildHarvestPayload,
  parseAmount,
} from "@/lib/movement";

export function useVaultInfo(vaultAddress: string) {
  return useQuery({
    queryKey: ["vault", vaultAddress],
    queryFn: () => getVaultInfo(vaultAddress),
    enabled: !!vaultAddress,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useUserPosition(vaultAddress: string) {
  const { account } = useWallet();

  return useQuery({
    queryKey: ["position", vaultAddress, account?.address],
    queryFn: () => getUserPosition(account!.address.toString()),
    enabled: !!vaultAddress && !!account,
    refetchInterval: 30000,
  });
}

export function useVaultAPY(vaultAddress: string) {
  return useQuery({
    queryKey: ["apy", vaultAddress],
    queryFn: () => getCurrentAPY(vaultAddress),
    enabled: !!vaultAddress,
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useDeposit(vaultAddress: string) {
  const { signAndSubmitTransaction } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: string) => {
      const amountInUnits = parseAmount(amount);
      const payload = buildDepositPayload(vaultAddress, amountInUnits);

      const response = await signAndSubmitTransaction({
        data: payload,
      });

      return response;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["vault", vaultAddress] });
      queryClient.invalidateQueries({ queryKey: ["position", vaultAddress] });
    },
  });
}

export function useWithdraw(vaultAddress: string) {
  const { signAndSubmitTransaction } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shares: string) => {
      const sharesInUnits = parseAmount(shares);
      const payload = buildWithdrawPayload(vaultAddress, sharesInUnits);

      const response = await signAndSubmitTransaction({
        data: payload,
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault", vaultAddress] });
      queryClient.invalidateQueries({ queryKey: ["position", vaultAddress] });
    },
  });
}

export function useHarvest(vaultAddress: string) {
  const { signAndSubmitTransaction } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const payload = buildHarvestPayload(vaultAddress);

      const response = await signAndSubmitTransaction({
        data: payload,
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault", vaultAddress] });
    },
  });
}
