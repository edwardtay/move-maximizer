"use client";

import { useParams, redirect } from "next/navigation";

export default function VaultDetailPage() {
  const params = useParams();
  const vaultId = params?.id as string;

  // Redirect to the main vault page
  if (vaultId === "move-vault") {
    redirect("/vaults/move-vault");
  }

  // For any other vault ID, redirect to vaults list
  redirect("/vaults");
}
