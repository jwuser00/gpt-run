"use client";

import { useRouter } from "next/navigation";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import DeleteIcon from "@mui/icons-material/Delete";
import PlaceIcon from "@mui/icons-material/Place";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SpeedIcon from "@mui/icons-material/Speed";
import FavoriteIcon from "@mui/icons-material/Favorite";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { Activity } from "@/lib/types";
import { toKST, formatTimeFromSeconds, formatPace } from "@/lib/utils/format";

interface ActivityCardProps {
  activity: Activity;
  onDelete: (e: React.MouseEvent, id: number) => void;
}

export default function ActivityCard({ activity, onDelete }: ActivityCardProps) {
  const router = useRouter();
  const kstDate = toKST(activity.start_time);

  return (
    <Card
      sx={{ cursor: "pointer", "&:hover": { boxShadow: 4 } }}
      onClick={() => router.push(`/activity/${activity.id}`)}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: activity.is_treadmill ? "grey.600" : "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {activity.is_treadmill ? (
                <FitnessCenterIcon sx={{ color: "#fff", fontSize: 20 }} />
              ) : (
                <DirectionsRunIcon sx={{ color: "#fff", fontSize: 20 }} />
              )}
            </Box>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {kstDate.toLocaleDateString("ko-KR")}
                </Typography>
                {activity.is_treadmill && (
                  <Chip label="트레드밀" size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {kstDate.toLocaleTimeString("ko-KR")}
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(e, activity.id);
            }}
            sx={{
              color: "text.secondary",
              "&:hover": { color: "error.main" },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>

        <Grid container spacing={1.5}>
          <Grid size={{ xs: 6 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <PlaceIcon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                Distance
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight={700}>
              {(activity.total_distance / 1000).toFixed(2)} km
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                Time
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight={700}>
              {formatTimeFromSeconds(activity.total_time)}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <SpeedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                Pace
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight={700}>
              {formatPace(activity.avg_pace)} /km
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <FavoriteIcon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                Avg HR
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight={700}>
              {activity.avg_hr ? Math.round(activity.avg_hr) : "-"} bpm
            </Typography>
          </Grid>
        </Grid>

        {(activity.llm_evaluation_status === "pending" ||
          activity.llm_evaluation_status === "processing") && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              mt: 1.5,
              color: "text.secondary",
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 14 }} />
            <Typography variant="caption">AI 분석중...</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
