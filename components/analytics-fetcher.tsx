"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client"; // client-side supabase
import ClicksChart from "@/components/clicks-chart";
import Toast from "./toast-notification";
import { showErrorToast } from "@/lib/utils";

interface AnalyticsData {
  id: string;
  clicked_at: string;
  link_id: string;
}

const AnalyticsFetcher = React.memo(() => {
  const supabase = createClient();
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showErrorToastState, setShowErrorToastState] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data, error } = await supabase.from("analytics").select("*");

        if (error) {
          console.error("Error fetching analytics:", error);
          const errorMessage = showErrorToast(error, "Failed to fetch analytics data");
          setError(errorMessage);
          setShowErrorToastState(true);
          setAnalytics([]);
        } else {
          setAnalytics(data || []);
          setError(null);
        }
      } catch (err) {
        console.error("Unexpected error fetching analytics:", err);
        const errorMessage = showErrorToast(err, "An unexpected error occurred while fetching analytics");
        setError(errorMessage);
        setShowErrorToastState(true);
        setAnalytics([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [supabase]);

  const handleCloseErrorToast = useCallback(() => {
    setShowErrorToastState(false);
    setError(null);
  }, []);

  // Memoize expensive calculations
  const totalClicks = useMemo(() => analytics.length, [analytics.length]);

  const chartData = useMemo(() => {
    // Example: build chart data for last 30 days
    const now = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const dayStart = new Date(now);
      dayStart.setDate(now.getDate() - (29 - i));
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const clicks = analytics.filter(record => {
        const clickTime = new Date(record.clicked_at);
        return clickTime >= dayStart && clickTime <= dayEnd;
      }).length;

      return { period: `${i + 1}`, clicks };
    });
  }, [analytics]);

  if (loading) {
    return <p className="text-gray-400">Loading analytics...</p>;
  }

  return (
    <>
      <ClicksChart data={chartData} totalClicks={totalClicks} />
      {showErrorToastState && error && (
        <Toast
          type="error"
          title="Analytics Error"
          description={error}
          onClose={handleCloseErrorToast}
        />
      )}
    </>
  );
});

AnalyticsFetcher.displayName = 'AnalyticsFetcher'

export default AnalyticsFetcher;
