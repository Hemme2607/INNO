import { cn } from "@/lib/utils";

export function ActionsTimeline({ items = [] }) {
  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Action timeline
      </div>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.id} className="flex gap-3">
            <div className="relative flex flex-col items-center">
              <div className="h-2.5 w-2.5 rounded-full border-2 border-blue-500 bg-white" />
              {index < items.length - 1 ? (
                <div className="mt-1 h-full w-px flex-1 bg-slate-200" />
              ) : null}
            </div>
            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-900">{item.title}</div>
              {item.statusLabel ? (
                <div className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                  {item.statusLabel}
                </div>
              ) : null}
              <div className={cn("text-xs text-slate-400")}>
                {item.timestamp}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
