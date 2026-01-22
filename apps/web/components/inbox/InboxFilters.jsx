"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export function InboxFilters({ initialQuery = "", initialUnread = false }) {
  const [query, setQuery] = useState(initialQuery);
  const [unreadOnly, setUnreadOnly] = useState(initialUnread);
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setUnreadOnly(initialUnread);
  }, [initialUnread]);

  const applyFilters = (nextQuery, nextUnread) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (nextQuery) {
      params.set("q", nextQuery);
    } else {
      params.delete("q");
    }
    if (nextUnread) {
      params.set("unread", "1");
    } else {
      params.delete("unread");
    }
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    startTransition(() => router.push(nextUrl));
  };

  const handleToggle = (checked) => {
    setUnreadOnly(checked);
    applyFilters(query, checked);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    applyFilters(query, unreadOnly);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Inbox</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Unreads</span>
          <Switch checked={unreadOnly} onCheckedChange={handleToggle} />
        </div>
      </div>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Type to search..."
          className="pl-9"
          disabled={isPending}
        />
      </form>
    </div>
  );
}
