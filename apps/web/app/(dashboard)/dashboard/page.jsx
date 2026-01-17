import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { DashboardPageShell } from "@/components/dashboard-page-shell";

import data from "./data.json";

// Dashboardet viser en komplet TailArk demo med sidebar, kort og tabel.
export default function Page() {
  return (
    <DashboardPageShell>
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            {/* Områdegraf med dummy-data der matcher kortene */}
            <ChartAreaInteractive />
          </div>
          {/* Simpel data-table med sample-rows fra data.json */}
          <DataTable data={data} />
        </div>
      </div>
    </DashboardPageShell>
  );
}
