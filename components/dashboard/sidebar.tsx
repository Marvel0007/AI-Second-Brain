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
    category: "WORKSPACE",
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
        label: "Favorites",
        href: "/dashboard/favorites",
        icon: Star,
      },
    ],
  },
  {
    category: "AI & RAG ENGINE",
    items: [
      {
        label: "AI Assistant",
        href: "/dashboard/chat",
        icon: MessageSquare,
      },
      {
        label: "Knowledge Search",
        href: "/dashboard/search",
        icon: Search,
      },
      {
        label: "Insights & Compare",
        href: "/dashboard/insights",
        icon: Sparkles,
      },
      {
        label: "RAG Evaluation",
        href: "/dashboard/evaluation",
        icon: BarChart3,
      },
    ],
  },
  {
    category: "SYSTEM",
    items: [
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
    <aside className="hidden w-64 shrink-0 border-r bg-card/60 backdrop-blur-md md:block">
      <div className="sticky top-0 flex h-screen flex-col">
        {/* Logo Header */}
        <div className="flex h-16 items-center border-b px-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 font-semibold tracking-tight transition-opacity hover:opacity-90"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <Brain className="h-4 w-4" />
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-bold leading-none">BrainDock</span>
              <span className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                AI Knowledge OS
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 space-y-6 overflow-y-auto p-3.5">
          {navigation.map((group) => (
            <div key={group.category} className="space-y-1">
              <p className="px-3 text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase">
                {group.category}
              </p>

              <div className="space-y-0.5 pt-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Workspace Footer */}
        <div className="border-t p-3 bg-muted/20">
          <div className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Hybrid RAG Active
            </span>
            <span className="font-mono text-[10px] border px-1.5 py-0.5 rounded bg-background">
              v2.0
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}