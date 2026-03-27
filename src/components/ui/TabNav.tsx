"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface Tab {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface TabNavProps {
  tabs: Tab[];
}

export function TabNav({ tabs }: TabNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex overflow-x-auto no-scrollbar border-b border-border bg-surface">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap
              border-b-2 transition-colors min-w-[48px] min-h-[48px]
              ${
                isActive
                  ? "border-gold-500 text-gold-400"
                  : "border-transparent text-muted hover:text-foreground hover:border-dark-400"
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
