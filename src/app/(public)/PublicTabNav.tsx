"use client";

import { TabNav } from "@/components/ui/TabNav";

const publicTabs = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Fight Card", href: "/fight-card" },
  { label: "Rankings", href: "/rankings" },
  { label: "Fighter Lookup", href: "/fighter-lookup" },
];

export function PublicTabNav() {
  return <TabNav tabs={publicTabs} />;
}
