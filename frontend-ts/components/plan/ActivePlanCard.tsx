"use client";

import { useRouter } from "next/navigation";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CircularProgress from "@mui/material/CircularProgress";
import { PlanDetail } from "@/lib/types";
import SessionTypeChip from "./SessionTypeChip";

interface ActivePlanCardProps {
  plan: PlanDetail | null;
}

export default function ActivePlanCard({ plan }: ActivePlanCardProps) {
  const router = useRouter();

  if (!plan) {
    return (
      <Card>
        <CardContent sx={{ textAlign: "center", py: 4 }}>
          <CalendarMonthIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
          <Typography color="text.secondary">
            러닝 계획을 세워보세요
          </Typography>
          <Button
            variant="outlined"
            size="small"
            sx={{ mt: 1.5, textTransform: "none" }}
            onClick={() => router.push("/plans/new")}
          >
            계획 만들기
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isGenerating = plan.generation_status === "pending" || plan.generation_status === "processing";

  const today = new Date().toISOString().split("T")[0];
  const todaySessions = plan.sessions.filter((s) => s.date === today);
  const upcomingSessions = plan.sessions
    .filter((s) => s.date > today)
    .slice(0, 3);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            러닝 계획
          </Typography>
          <Button
            size="small"
            onClick={() => router.push(`/plans/${plan.id}`)}
            sx={{ textTransform: "none" }}
          >
            상세 보기
          </Button>
        </Box>

        {isGenerating ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">
              계획 생성중...
            </Typography>
          </Box>
        ) : (
          <>
            {todaySessions.length > 0 && (
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  오늘
                </Typography>
                {todaySessions.map((s) => (
                  <Box key={s.id} sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                    <SessionTypeChip type={s.session_type} />
                    <Typography variant="body2">{s.title}</Typography>
                  </Box>
                ))}
              </Box>
            )}

            {upcomingSessions.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  다가오는 세션
                </Typography>
                {upcomingSessions.map((s) => {
                  const d = new Date(s.date + "T00:00:00");
                  return (
                    <Box key={s.id} sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 50 }}>
                        {d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                      </Typography>
                      <SessionTypeChip type={s.session_type} />
                      <Typography variant="body2">{s.title}</Typography>
                    </Box>
                  );
                })}
              </Box>
            )}

            {todaySessions.length === 0 && upcomingSessions.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                남은 세션이 없습니다
              </Typography>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
