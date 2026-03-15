"use client";

import { useRouter } from "next/navigation";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { Plan } from "@/lib/types";

const statusLabel: Record<string, { color: "primary" | "success" | "default"; label: string }> = {
  active: { color: "primary", label: "진행중" },
  completed: { color: "success", label: "완료" },
  archived: { color: "default", label: "보관" },
};

interface PlanCardProps {
  plan: Plan;
}

export default function PlanCard({ plan }: PlanCardProps) {
  const router = useRouter();
  const isGenerating = plan.generation_status === "pending" || plan.generation_status === "processing";

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  return (
    <Card>
      <CardActionArea onClick={() => router.push(`/plans/${plan.id}`)}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "70%",
              }}
            >
              {plan.user_prompt}
            </Typography>
            <Chip
              label={statusLabel[plan.status]?.label || plan.status}
              color={statusLabel[plan.status]?.color || "default"}
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Box>

          {isGenerating ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                계획 생성중...
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {plan.start_date && plan.end_date && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CalendarTodayIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(plan.start_date)} ~ {formatDate(plan.end_date)}
                  </Typography>
                </Box>
              )}
              <Typography variant="body2" color="text.secondary">
                {plan.session_count}개 세션
              </Typography>
            </Box>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
