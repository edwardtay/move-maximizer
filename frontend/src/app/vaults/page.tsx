"use client";

import { redirect } from "next/navigation";

// Single vault app - redirect to main vault
export default function VaultsPage() {
  redirect("/vaults/move-vault");
}
