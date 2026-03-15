"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import AppLayout from "@/components/layout/AppLayout";
import PlanCard from "@/components/plan/PlanCard";
import { getPlans } from "@/lib/api/plans";
import { Plan } from "@/lib/types";

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);

  const loadPlans = useCallback(async () => {
    try {
      const data = await getPlans();
      setPlans(data);
    } catch {
      // handled by auth interceptor
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // Auto-refresh when any plan is generating
  useEffect(() => {
    const hasGenerating = plans.some(
      (p) => p.generation_status === "pending" || p.generation_status === "processing",
    );
    if (!hasGenerating) return;

    const interval = setInterval(loadPlans, 10000);
    return () => clearInterval(interval);
  }, [plans, loadPlans]);

  return (
    <AppLayout>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">러닝 계획</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push("/plans/new")}
          sx={{ textTransform: "none" }}
        >
          계획 만들기
        </Button>
      </Box>

      {plans.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Typography color="text.secondary">
            아직 계획이 없습니다. 새 계획을 만들어보세요.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {plans.map((plan) => (
            <Grid key={plan.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <PlanCard plan={plan} />
            </Grid>
          ))}
        </Grid>
      )}
    </AppLayout>
  );
}
