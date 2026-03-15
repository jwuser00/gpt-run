"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { PlanSession } from "@/lib/types";
import { formatPace } from "@/lib/utils/format";
import SessionTypeChip from "./SessionTypeChip";

interface PlanSessionListProps {
  sessions: PlanSession[];
}

export default function PlanSessionList({ sessions }: PlanSessionListProps) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: "center", py: 4 }}>
          <Typography color="text.secondary">세션이 없습니다</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {sessions.map((session, idx) => (
        <Box key={session.id}>
          {idx > 0 && <Divider />}
          <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                {formatDate(session.date)}
              </Typography>
              <SessionTypeChip type={session.session_type} />
              <Typography variant="subtitle2" fontWeight={600}>
                {session.title}
              </Typography>
            </Box>

            {session.description && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5, mb: 0.5 }}>
                {session.description}
              </Typography>
            )}

            <Box sx={{ display: "flex", gap: 2, ml: 0.5 }}>
              {session.target_distance && (
                <Typography variant="caption" color="text.secondary">
                  목표 거리: {(session.target_distance / 1000).toFixed(1)}km
                </Typography>
              )}
              {session.target_pace && (
                <Typography variant="caption" color="text.secondary">
                  목표 페이스: {formatPace(session.target_pace)}/km
                </Typography>
              )}
            </Box>
          </CardContent>
        </Box>
      ))}
    </Card>
  );
}
