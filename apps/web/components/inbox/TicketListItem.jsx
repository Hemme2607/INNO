import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatMessageTime } from "@/components/inbox/inbox-utils";

const STATUS_STYLES = {
  New: "bg-emerald-50 text-emerald-700",
  Open: "bg-blue-50 text-blue-700",
  Waiting: "bg-amber-50 text-amber-700",
  Solved: "bg-slate-100 text-slate-600",
};

export function TicketListItem({
  thread,
  isActive,
  status,
  customerLabel,
  timestamp,
  unreadCount,
  assignee,
  priority,
  onSelect,
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full flex-col gap-2 border-l-2 border-transparent px-4 py-4 text-left transition hover:bg-muted/40",
        isActive && "border-slate-900 bg-muted/40"
      )}
      aria-pressed={isActive}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="truncate text-sm font-semibold text-slate-900">
          {thread.subject || "Untitled ticket"}
        </div>
        <span className="text-xs text-muted-foreground">{formatMessageTime(timestamp)}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{customerLabel}</span>
        <Badge
          variant="secondary"
          className={cn("border border-transparent px-2 py-0.5", STATUS_STYLES[status])}
        >
          {status}
        </Badge>
        {assignee ? <span className="text-xs">Assigned: {assignee}</span> : null}
        {priority ? <span className="text-xs">Priority: {priority}</span> : null}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="line-clamp-1">{thread.snippet || "No preview yet."}</span>
        {unreadCount ? (
          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white">
            {unreadCount}
          </span>
        ) : null}
      </div>
    </button>
  );
}
