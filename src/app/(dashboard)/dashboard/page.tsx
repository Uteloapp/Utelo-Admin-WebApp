"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserCheck,
  MessageSquare,
  IndianRupee,
  Phone,
  Mic,
  UserPlus,
  MessageCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import api from "@/lib/api";
import { formatPaise } from "@/lib/format";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

interface Overview {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalMessages: number;
  messagesToday: number;
  voiceMessagesCount: number;
  totalRevenuePaise: number;
  revenueTodayPaise: number;
  totalCreditsOutstandingPaise: number;
  callsCount: number;
  completedCallsCount: number;
  failedCallsCount: number;
  totalCallSeconds: number;
  totalCallRevenuePaise: number;
}

interface UsageDay {
  date: string;
  newUsers: number;
  messages: number;
  revenuePaise: number;
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<Overview>({
    queryKey: ["analytics", "overview"],
    queryFn: async () => {
      const res = await api.get("/api/admin/analytics/overview");
      return res.data.overview;
    },
  });

  const {
    data: usage,
    isLoading: usageLoading,
  } = useQuery<UsageDay[]>({
    queryKey: ["analytics", "usage", 7],
    queryFn: async () => {
      const res = await api.get("/api/admin/analytics/usage?days=7");
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={32} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-danger/8 text-danger px-4 py-3 rounded-[var(--radius-card)] text-sm">
        Failed to load analytics. Is the backend running?
      </div>
    );
  }

  const revenueChartData = usage?.map((d) => ({
    date: d.date.slice(5),
    revenue: d.revenuePaise / 100,
  }));

  const usageChartData = usage?.map((d) => ({
    date: d.date.slice(5),
    messages: d.messages,
    newUsers: d.newUsers,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted mt-1">Welcome to the UTLO admin console</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={data.totalUsers.toLocaleString()}
          badge={`${data.newUsersToday} today`}
          badgeColor="info"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Active Users"
          value={data.activeUsers.toLocaleString()}
          badge={`${Math.round((data.activeUsers / Math.max(data.totalUsers, 1)) * 100)}% active`}
          badgeColor="success"
          icon={<UserCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Total Messages"
          value={data.totalMessages.toLocaleString()}
          badge={`${data.messagesToday} today`}
          badgeColor="info"
          icon={<MessageSquare className="h-5 w-5" />}
        />
        <StatCard
          label="Total Revenue"
          value={formatPaise(data.totalRevenuePaise)}
          badge={`${formatPaise(data.revenueTodayPaise)} today`}
          badgeColor="success"
          icon={<IndianRupee className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Voice Messages"
          value={data.voiceMessagesCount.toLocaleString()}
          icon={<Mic className="h-5 w-5" />}
        />
        <StatCard
          label="Total Calls"
          value={data.callsCount.toLocaleString()}
          badge={`${data.completedCallsCount} completed`}
          badgeColor="success"
          icon={<Phone className="h-5 w-5" />}
        />
        <StatCard
          label="Call Duration"
          value={`${Math.round(data.totalCallSeconds / 60)}m`}
          badge={`${data.totalCallSeconds}s total`}
          badgeColor="muted"
          icon={<MessageCircle className="h-5 w-5" />}
        />
        <StatCard
          label="Credits Outstanding"
          value={formatPaise(data.totalCreditsOutstandingPaise)}
          icon={<UserPlus className="h-5 w-5" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Usage Trend (7 days)
          </h2>
          {usageLoading ? (
            <div className="flex items-center justify-center h-52">
              <Spinner />
            </div>
          ) : usageChartData && usageChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={usageChartData}>
                <defs>
                  <linearGradient id="fillMessages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0EA5A4" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#0EA5A4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #E5E7EB",
                    fontSize: 13,
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="messages"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fill="url(#fillMessages)"
                  name="Messages"
                />
                <Area
                  type="monotone"
                  dataKey="newUsers"
                  stroke="#0EA5A4"
                  strokeWidth={2}
                  fill="url(#fillUsers)"
                  name="New Users"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-sm text-muted">
              No usage data yet
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Revenue (7 days)
          </h2>
          {usageLoading ? (
            <div className="flex items-center justify-center h-52">
              <Spinner />
            </div>
          ) : revenueChartData && revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16A34A" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#16A34A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `\u20B9${v}`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #E5E7EB",
                    fontSize: 13,
                  }}
                  formatter={(value) => [
                    `\u20B9${Number(value).toFixed(2)}`,
                    "Revenue",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#16A34A"
                  strokeWidth={2}
                  fill="url(#fillRevenue)"
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-sm text-muted">
              No revenue data yet
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
