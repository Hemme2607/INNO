import { Button } from "@/components/ui/button";

export function CustomerTab({ profile }) {
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="h-20 w-20 rounded-3xl bg-slate-100 shadow-sm" />
        <div className="mt-4 text-lg font-semibold text-slate-900">{profile.name}</div>
        <div className="text-sm text-slate-500">{profile.email}</div>
        <div className="mt-3 rounded-full bg-black px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          {profile.tier}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
          <div className="text-xs uppercase tracking-wide text-slate-400">Spent</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{profile.spent}</div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
          <div className="text-xs uppercase tracking-wide text-slate-400">Orders</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">
            {profile.ordersCount}
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Recent orders
        </div>
        {profile.recentOrders.map((order) => (
          <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">{order.id}</div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                {order.status}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button variant="outline" size="sm">
                Track
              </Button>
              <Button variant="outline" size="sm">
                Refund
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
