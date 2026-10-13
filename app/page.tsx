"use client";

import { useMemo } from "react";
import Header from "@/components/layout/Header";
import AppLinksSection from "@/components/dashboard/AppLinksSection";
import DateStrip from "@/components/dashboard/DateStrip";
import MonthGoalCard from "@/components/dashboard/MonthGoalCard";
import WeekTimeline from "@/components/dashboard/WeekTimeline";
import AddEntryButton from "@/components/entry-form/AddEntryButton";
import LoginPrompt from "@/components/auth/LoginPrompt";
import ActionBalanceCard, { type BalancePeriod } from "@/components/action-log/ActionBalanceCard";
import { useAuth } from "@/contexts/AuthContext";
import { toMonthKey } from "@/lib/month";
import { getCurrentWeekDates, toIsoDate } from "@/lib/week";

export default function Home() {
  const { user, loading } = useAuth();
  const currentMonthKey = useMemo(() => {
    const today = new Date();
    return toMonthKey(today.getFullYear(), today.getMonth() + 1);
  }, []);
  const balancePeriods = useMemo<BalancePeriod[]>(() => {
    const today = new Date();
    const weekDates = getCurrentWeekDates(today);
    return [
      { label: "今週", startDate: weekDates[0].date, endDate: weekDates[weekDates.length - 1].date },
      {
        label: "今月",
        startDate: toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1)),
        endDate: toIsoDate(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
      },
    ];
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 pb-32 sm:px-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          </div>
        ) : user ? (
          <>
            <AppLinksSection />
            <MonthGoalCard monthKey={currentMonthKey} monthLabel="今月" />
            <ActionBalanceCard periods={balancePeriods} />
            <DateStrip />
            <WeekTimeline />
            <AddEntryButton />
          </>
        ) : (
          <LoginPrompt />
        )}
      </main>
    </div>
  );
}
