"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import HotelIcon from "@mui/icons-material/Hotel";
import PlaceIcon from "@mui/icons-material/Place";
import SpeedIcon from "@mui/icons-material/Speed";
import { PlanSession, SessionType } from "@/lib/types";
import { formatPace } from "@/lib/utils/format";
import SessionTypeChip from "./SessionTypeChip";

const iconBgColor: Record<SessionType, string> = {
  Easy: "success.main",
  Long: "primary.main",
  Interval: "error.main",
  Fast: "warning.main",
  Recovery: "info.main",
  Rest: "grey.500",
  Race: "secondary.main",
};

interface PlanSessionCardProps {
  session: PlanSession;
}

export default function PlanSessionCard({ session }: PlanSessionCardProps) {
  const d = new Date(session.date + "T00:00:00");
  const isRest = session.session_type === "Rest";

  return (
    <Card sx={{ "&:hover": { boxShadow: 4 } }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 2,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: iconBgColor[session.session_type] || "grey.500",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isRest ? (
              <HotelIcon sx={{ color: "#fff", fontSize: 20 }} />
            ) : (
              <DirectionsRunIcon sx={{ color: "#fff", fontSize: 20 }} />
            )}
          </Box>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                {d.toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ({d.toLocaleDateString("ko-KR", { weekday: "short" })})
              </Typography>
            </Box>
            <SessionTypeChip type={session.session_type} />
          </Box>
        </Box>

        <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
          {session.title}
        </Typography>

        {!isRest && (session.target_distance || session.target_pace) && (
          <Grid container spacing={1.5} sx={{ mb: session.description ? 1 : 0 }}>
            {session.target_distance && (
              <Grid size={{ xs: 6 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <PlaceIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                  <Typography variant="caption" color="text.secondary">
                    Distance
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight={700}>
                  {(session.target_distance / 1000).toFixed(1)} km
                </Typography>
              </Grid>
            )}
            {session.target_pace && (
              <Grid size={{ xs: 6 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <SpeedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                  <Typography variant="caption" color="text.secondary">
                    Pace
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight={700}>
                  {formatPace(session.target_pace)} /km
                </Typography>
              </Grid>
            )}
          </Grid>
        )}

        {session.description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {session.description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
