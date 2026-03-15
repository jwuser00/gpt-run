"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import AppLayout from "@/components/layout/AppLayout";
import PlanSessionCard from "@/components/plan/PlanSessionCard";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Toast from "@/components/common/Toast";
import { getActivePlan, deletePlan } from "@/lib/api/plans";
import { useToast } from "@/lib/hooks/useToast";
import { PlanDetail } from "@/lib/types";

export default function PlansPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { toast, showToast, closeToast } = useToast();

  const loadPlan = useCallback(async () => {
    try {
      const data = await getActivePlan();
      setPlan(data);
    } catch {
      // handled by auth interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  // Auto-refresh while generating
  useEffect(() => {
    if (!plan) return;
    const isGenerating = plan.generation_status === "pending" || plan.generation_status === "processing";
    if (!isGenerating) return;

    const interval = setInterval(loadPlan, 5000);
    return () => clearInterval(interval);
  }, [plan, loadPlan]);

  const handleDelete = async () => {
    if (!plan) return;
    try {
      await deletePlan(plan.id);
      showToast("계획이 삭제되었습니다", "success");
      setPlan(null);
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

  const isGenerating = plan?.generation_status === "pending" || plan?.generation_status === "processing";
  const isFailed = plan?.generation_status === "failed";

  return (
    <AppLayout>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">러닝 계획</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          {plan && (
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
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push("/plans/new")}
            sx={{ textTransform: "none" }}
          >
            계획 만들기
          </Button>
        </Box>
      </Box>

      {!plan && (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Typography color="text.secondary">
            아직 계획이 없습니다. 새 계획을 만들어보세요.
          </Typography>
        </Box>
      )}

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

      {plan && plan.sessions.length > 0 && (
        <Grid container spacing={2}>
          {plan.sessions.map((session) => (
            <Grid key={session.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <PlanSessionCard session={session} />
            </Grid>
          ))}
        </Grid>
      )}

      {plan && !isGenerating && !isFailed && plan.sessions.length === 0 && (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Typography color="text.secondary">
            세션이 생성되지 않았습니다. 계획을 삭제하고 다시 만들어보세요.
          </Typography>
        </Box>
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
