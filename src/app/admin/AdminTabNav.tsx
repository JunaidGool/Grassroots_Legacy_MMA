"use client";

import { TabNav } from "@/components/ui/TabNav";

const adminTabs = [
  { label: "Register", href: "/admin/register" },
  { label: "Fighters", href: "/admin/fighters" },
  { label: "Weigh-In", href: "/admin/weigh-in" },
  { label: "Scoring", href: "/admin/scoring" },
];

export function AdminTabNav() {
  return <TabNav tabs={adminTabs} />;
}
