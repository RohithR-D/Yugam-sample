import { Clock, CreditCard, DollarSign, Flag, TrendingUp, Zap } from "lucide-react";
import type { DashSummary, Milestone, ProjectRecord } from "../types";
import { formatCurrency, formatDate } from "../utils/flowUtils";

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
  isText,
  suffix,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  color: string;
  isText?: boolean;
  suffix?: string;
}) {
  const colors: Record<string, { bg: string; icon: string; text: string }> = {
    blue: { bg: "bg-blue-50", icon: "text-blue-500", text: "text-blue-600" },
    green: { bg: "bg-green-50", icon: "text-green-500", text: "text-green-600" },
    purple: { bg: "bg-purple-50", icon: "text-purple-500", text: "text-purple-600" },
    red: { bg: "bg-red-50", icon: "text-red-500", text: "text-red-500" },
  };

  const classNames = colors[color] || colors.blue;

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${classNames.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${classNames.icon}`} />
        </div>
        <div>
          <p className="text-xs text-gray-400">{label}</p>
          <p className={`text-2xl font-bold ${classNames.text}`}>
            {isText ? value : `${value}${suffix || ""}`}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FlowDashboardView({
  summary,
  projects,
}: {
  summary: DashSummary | null;
  projects: ProjectRecord[];
  milestones: Milestone[];
}) {
  const burnRate = summary?.budgetBurnRate ?? 0;
  const burnColor = burnRate > 90 ? "text-red-500" : burnRate > 70 ? "text-amber-500" : "text-green-600";
  const varianceDays = summary?.scheduleVarianceDays ?? 0;
  const varianceColor =
    varianceDays > 5 ? "text-red-500" : varianceDays > 0 ? "text-amber-500" : "text-green-600";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Flow Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Executive project management overview</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard icon={Zap} label="Active Projects" value={summary?.activeProjects ?? 0} color="blue" />
        <MetricCard
          icon={DollarSign}
          label="Total Portfolio Value"
          value={formatCurrency(summary?.totalPortfolioValue ?? 0)}
          color="green"
          isText
        />
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Avg Schedule Variance</p>
              <p className={`text-2xl font-bold ${varianceColor}`}>
                {varianceDays > 0 ? "+" : ""}
                {varianceDays} days
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Budget Burn Rate</p>
              <p className={`text-2xl font-bold ${burnColor}`}>{burnRate}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Flag className="w-4 h-4 text-[#E31E24]" /> Upcoming Milestones
          </h3>
          {!summary?.upcomingMilestones || summary.upcomingMilestones.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No upcoming milestones</p>
          ) : (
            <div className="space-y-2">
              {summary.upcomingMilestones.map((milestone) => {
                const project = projects.find((item) => item.id === milestone.projectId);
                const daysLeft = Math.ceil(
                  (new Date(milestone.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                );
                return (
                  <div
                    key={milestone.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{milestone.title}</p>
                      <p className="text-xs text-gray-400">{project?.projectName || "Unknown project"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-500">{formatDate(milestone.targetDate)}</p>
                      <p
                        className={`text-[10px] font-semibold ${
                          daysLeft < 7 ? "text-red-500" : daysLeft < 30 ? "text-amber-500" : "text-gray-400"
                        }`}
                      >
                        {daysLeft > 0 ? `${daysLeft}d left` : "Overdue"}
                      </p>
                    </div>
                    <div className="w-[120px]">
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="text-gray-400">Progress</span>
                        <span className="font-semibold text-gray-600">{milestone.completionPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-[#E31E24] rounded-full h-1.5 transition-all"
                          style={{ width: `${milestone.completionPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#E31E24]" /> Budget Burn Rate by Category
          </h3>
          {!summary?.categoryBreakdown || summary.categoryBreakdown.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No budget data</p>
          ) : (
            <div className="space-y-3">
              {summary.categoryBreakdown.map((category) => {
                const estimated = Number(category.estimated) || 1;
                const actual = Number(category.actual) || 0;
                const percent = Math.round((actual / estimated) * 100);
                const barColor =
                  percent > 90 ? "bg-red-500" : percent > 70 ? "bg-amber-500" : "bg-green-500";

                return (
                  <div key={category.category}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">{category.category}</span>
                      <span className="text-gray-400">
                        {formatCurrency(actual)} / {formatCurrency(estimated)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${barColor} rounded-full h-2 transition-all`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
