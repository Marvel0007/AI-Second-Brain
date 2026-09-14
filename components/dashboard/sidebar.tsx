"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  FileText,
  Home,
  MessageSquare,
  Search,
  Star,
  Trash2,
  Sparkles,
  BarChart3,
} from "lucide-react";

const navigation = [
  {
    items: [
      {
        label: "Overview",
        href: "/dashboard",
        icon: Home,
      },
      {
        label: "Documents",
        href: "/dashboard/documents",
        icon: FileText,
      },
      {
        label: "Search",
        href: "/dashboard/search",
        icon: Search,
      },
      {
        label: "Assistant",
        href: "/dashboard/chat",
        icon: MessageSquare,
      },
      {
        label: "Favorites",
        href: "/dashboard/favorites",
        icon: Star,
      },
      {
        label: "Benchmarks",
        href: "/dashboard/evaluation",
        icon: BarChart3,
      },
      {
        label: "Trash",
        href: "/dashboard/trash",
        icon: Trash2,
      },
    ],
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card/40 backdrop-blur-sm md:block">
      <div className="sticky top-0 flex h-screen flex-col">
        {/* Workspace Brand */}
        <div className="flex h-14 items-center border-b px-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 font-semibold text-sm tracking-tight text-foreground transition-opacity hover:opacity-85"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
              <Brain className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">BrainDock</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {navigation[0].items.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-accent-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-80" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Status Indicator */}
        <div className="border-t px-4 py-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Knowledge base connected</span>
          </div>
        </div>
      </div>
    </aside>
  );
}