"use client";

import { useEffect, useState, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import AppLayout from "@/components/layout/AppLayout";
import ActivityCard from "@/components/activity/ActivityCard";
import ActivityUpload from "@/components/activity/ActivityUpload";
import ActivityFilters from "@/components/activity/ActivityFilters";
import Toast from "@/components/common/Toast";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { getActivities, uploadActivity, deleteActivity } from "@/lib/api/activities";
import { getActivePlan, getPlanSessions } from "@/lib/api/plans";
import { validateTCXFile } from "@/lib/utils/format";
import { useToast } from "@/lib/hooks/useToast";
import { Activity, PlanSessionBrief } from "@/lib/types";

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [planSessions, setPlanSessions] = useState<PlanSessionBrief[]>([]);
  const [uploading, setUploading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [selectedMonth, setSelectedMonth] = useState<number | "all">("all");
  const { toast, showToast, closeToast } = useToast();

  const loadActivities = useCallback(async () => {
    try {
      const data = await getActivities();
      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      );
      setActivities(sorted);
    } catch {
      // handled by auth interceptor
    }
  }, []);

  const loadPlanSessions = useCallback(async () => {
    try {
      const plan = await getActivePlan();
      if (plan) {
        const sessions = await getPlanSessions(plan.id);
        setPlanSessions(sessions);
      }
    } catch {
      // plan sessions are optional
    }
  }, []);

  useEffect(() => {
    loadActivities();
    loadPlanSessions();
  }, [loadActivities, loadPlanSessions]);

  // Auto-refresh when any activity has pending/processing LLM evaluation
  useEffect(() => {
    const hasPending = activities.some(
      (a) =>
        a.llm_evaluation_status === 'pending' ||
        a.llm_evaluation_status === 'processing',
    );
    if (!hasPending) return;

    const interval = setInterval(loadActivities, 10000);
    return () => clearInterval(interval);
  }, [activities, loadActivities]);

  const years = Array.from(
    new Set(activities.map((a) => new Date(a.start_time).getFullYear()))
  ).sort((a, b) => b - a);

  const months = Array.from(
    new Set(
      activities
        .filter(
          (a) =>
            selectedYear === "all" ||
            new Date(a.start_time).getFullYear() === selectedYear
        )
        .map((a) => new Date(a.start_time).getMonth() + 1)
    )
  ).sort((a, b) => b - a);

  const filteredActivities = activities.filter((activity) => {
    const date = new Date(activity.start_time);
    const yearMatch =
      selectedYear === "all" || date.getFullYear() === selectedYear;
    const monthMatch =
      selectedMonth === "all" || date.getMonth() + 1 === selectedMonth;
    return yearMatch && monthMatch;
  });

  const handleUpload = async (file: File, planSessionId?: number | null) => {
    if (!validateTCXFile(file)) {
      showToast("TCX 파일만 업로드 가능합니다", "error");
      return;
    }

    setUploading(true);
    try {
      await uploadActivity(file, planSessionId);
      showToast("업로드가 완료되었습니다", "success");
      await loadActivities();
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { detail?: string } } };
      if (err?.response?.status === 409 && err?.response?.data?.detail) {
        showToast(err.response.data.detail, "warning");
      } else {
        showToast("업로드에 실패했습니다", "error");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (e: React.MouseEvent, activityId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDeleteId(activityId);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteActivity(confirmDeleteId);
      showToast("활동이 삭제되었습니다", "success");
      await loadActivities();
    } catch {
      showToast("삭제에 실패했습니다", "error");
    }
    setConfirmDeleteId(null);
  };

  const handleYearChange = (year: number | "all") => {
    setSelectedYear(year);
    setSelectedMonth("all");
  };

  return (
    <AppLayout>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ whiteSpace: "nowrap" }}>
          내 활동
        </Typography>
        <ActivityUpload uploading={uploading} onUpload={handleUpload} planSessions={planSessions} />
      </Box>

      <ActivityFilters
        years={years}
        months={months}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onYearChange={handleYearChange}
        onMonthChange={setSelectedMonth}
      />

      <Grid container spacing={2}>
        {filteredActivities.map((activity) => (
          <Grid key={activity.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <ActivityCard activity={activity} onDelete={handleDelete} />
          </Grid>
        ))}
      </Grid>

      <Toast toast={toast} onClose={closeToast} />

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="활동을 삭제할까요?"
        message="삭제하면 되돌릴 수 없습니다."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </AppLayout>
  );
}
