"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import AppLayout from "@/components/layout/AppLayout";
import PlanSessionCard from "@/components/plan/PlanSessionCard";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Toast from "@/components/common/Toast";
import { getPlan, deletePlan } from "@/lib/api/plans";
import { useToast } from "@/lib/hooks/useToast";
import { PlanDetail } from "@/lib/types";

const statusLabel: Record<string, { color: "primary" | "success" | "default"; label: string }> = {
  active: { color: "primary", label: "진행중" },
  completed: { color: "success", label: "완료" },
  archived: { color: "default", label: "보관" },
};

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = Number(params.id);
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { toast, showToast, closeToast } = useToast();

  const loadPlan = useCallback(async () => {
    try {
      const data = await getPlan(planId);
      setPlan(data);
    } catch {
      showToast("계획을 불러올 수 없습니다", "error");
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  // Poll while generating
  useEffect(() => {
    if (!plan) return;
    const isGenerating = plan.generation_status === "pending" || plan.generation_status === "processing";
    if (!isGenerating) return;

    const interval = setInterval(loadPlan, 5000);
    return () => clearInterval(interval);
  }, [plan, loadPlan]);

  const handleDelete = async () => {
    try {
      await deletePlan(planId);
      showToast("계획이 삭제되었습니다", "success");
      router.push("/plans");
    } catch {
      showToast("삭제에 실패했습니다", "error");
    }
    setConfirmDelete(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
          <CircularProgress />
        </Box>
      </AppLayout>
    );
  }

  if (!plan) {
    return (
      <AppLayout>
        <Typography color="text.secondary">계획을 찾을 수 없습니다</Typography>
      </AppLayout>
    );
  }

  const isGenerating = plan.generation_status === "pending" || plan.generation_status === "processing";
  const isFailed = plan.generation_status === "failed";

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <AppLayout>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/plans")}
          sx={{ textTransform: "none" }}
        >
          목록
        </Button>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <Typography variant="h5" fontWeight={700}>
              러닝 계획
            </Typography>
            <Chip
              label={statusLabel[plan.status]?.label || plan.status}
              color={statusLabel[plan.status]?.color || "default"}
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Box>
          {plan.start_date && plan.end_date && (
            <Typography variant="body2" color="text.secondary">
              {formatDate(plan.start_date)} ~ {formatDate(plan.end_date)}
            </Typography>
          )}
        </Box>
        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<DeleteIcon />}
          onClick={() => setConfirmDelete(true)}
          sx={{ textTransform: "none" }}
        >
          삭제
        </Button>
      </Box>

      {/* User prompt */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            요청
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {plan.user_prompt}
          </Typography>
        </CardContent>
      </Card>

      {isGenerating && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, py: 4, justifyContent: "center" }}>
            <CircularProgress size={24} />
            <Typography color="text.secondary">
              AI가 계획을 생성하고 있습니다...
            </Typography>
          </CardContent>
        </Card>
      )}

      {isFailed && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <Typography color="error">
              계획 생성에 실패했습니다. 다시 시도해주세요.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Sessions */}
      {plan.sessions.length > 0 && (
        <Grid container spacing={2}>
          {plan.sessions.map((session) => (
            <Grid key={session.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <PlanSessionCard session={session} />
            </Grid>
          ))}
        </Grid>
      )}

      <Toast toast={toast} onClose={closeToast} />

      <ConfirmDialog
        open={confirmDelete}
        title="계획을 삭제할까요?"
        message="삭제하면 되돌릴 수 없습니다."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </AppLayout>
  );
}
