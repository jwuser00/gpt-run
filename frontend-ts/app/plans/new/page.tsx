"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import AppLayout from "@/components/layout/AppLayout";
import Toast from "@/components/common/Toast";
import { createPlan } from "@/lib/api/plans";
import { useToast } from "@/lib/hooks/useToast";

const DEFAULT_PROMPT = "이번 주 러닝 계획을 세워주세요.";

export default function NewPlanPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [submitting, setSubmitting] = useState(false);
  const { toast, showToast, closeToast } = useToast();

  const handleSubmit = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      showToast("계획 요청을 입력해주세요", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const plan = await createPlan(trimmed);
      router.push(`/plans/${plan.id}`);
    } catch {
      showToast("계획 생성에 실패했습니다", "error");
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <Typography variant="h4" sx={{ mb: 3 }}>
        계획 만들기
      </Typography>

      <Card sx={{ maxWidth: 600 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            어떤 러닝 계획이 필요한지 알려주세요. 최근 러닝 기록과 대회 일정을 고려하여 AI가 맞춤 계획을 생성합니다.
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="예: 다음 주 하프마라톤 준비를 위한 이번 주 훈련 계획을 세워주세요."
            disabled={submitting}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button
              onClick={() => router.back()}
              disabled={submitting}
              sx={{ textTransform: "none" }}
            >
              취소
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ textTransform: "none" }}
            >
              {submitting ? "생성중..." : "계획 생성"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Toast toast={toast} onClose={closeToast} />
    </AppLayout>
  );
}
