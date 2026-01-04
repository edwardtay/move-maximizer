"use client";

import { useQuery } from "@tanstack/react-query";
import { getVaultInfo, getUserPosition, getRouterInfo, CONTRACT_ADDRESS } from "@/lib/movement";

export function useVaultInfo(vaultAddress: string = CONTRACT_ADDRESS) {
  return useQuery({
    queryKey: ["vault", vaultAddress],
    queryFn: () => getVaultInfo(vaultAddress),
    enabled: !!vaultAddress,
    refetchInterval: 30000,
  });
}

export function useUserPosition(userAddress: string | undefined) {
  return useQuery({
    queryKey: ["position", userAddress],
    queryFn: () => getUserPosition(userAddress!),
    enabled: !!userAddress,
    refetchInterval: 30000,
  });
}

export function useRouterInfo(routerAddress: string = CONTRACT_ADDRESS) {
  return useQuery({
    queryKey: ["router", routerAddress],
    queryFn: () => getRouterInfo(routerAddress),
    enabled: !!routerAddress,
    refetchInterval: 60000,
  });
}
