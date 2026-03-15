"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AppLayout from "@/components/layout/AppLayout";
import UpcomingRaceCard from "@/components/dashboard/UpcomingRaceCard";
import MonthlyRunningChart from "@/components/dashboard/MonthlyRunningChart";
import ActivePlanCard from "@/components/plan/ActivePlanCard";
import { getDashboardData } from "@/lib/api/dashboard";
import { getActivePlan } from "@/lib/api/plans";
import { DashboardData, PlanDetail } from "@/lib/types";
import { toKST, formatPace, formatTimeFromSeconds } from "@/lib/utils/format";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [activePlan, setActivePlan] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [result, plan] = await Promise.all([
          getDashboardData(),
          getActivePlan(),
        ]);
        setData(result);
        setActivePlan(plan);
      } catch {
        // handled by auth interceptor
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
          <CircularProgress />
        </Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Typography variant="h4" sx={{ mb: 3 }}>
        대시보드
      </Typography>

      {/* Upcoming Races Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            다가오는 대회
          </Typography>
          <Button
            size="small"
            onClick={() => router.push("/races")}
            sx={{ textTransform: "none" }}
          >
            전체 보기
          </Button>
        </Box>

        {data && data.upcoming_races.length > 0 ? (
          <Grid container spacing={2}>
            {data.upcoming_races.map((race) => (
              <Grid key={race.id} size={{ xs: 12, sm: 6 }}>
                <UpcomingRaceCard race={race} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 4 }}>
              <EmojiEventsIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
              <Typography color="text.secondary">
                예정된 대회가 없습니다
              </Typography>
              <Button
                variant="outlined"
                size="small"
                sx={{ mt: 1.5, textTransform: "none" }}
                onClick={() => router.push("/races/new")}
              >
                대회 등록하기
              </Button>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Active Plan Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            러닝 계획
          </Typography>
          <Button
            size="small"
            onClick={() => router.push("/plans")}
            sx={{ textTransform: "none" }}
          >
            전체 보기
          </Button>
        </Box>
        <ActivePlanCard plan={activePlan} />
      </Box>

      {/* Monthly Running Chart Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            이번 달 러닝
          </Typography>
          <Button
            size="small"
            onClick={() => router.push("/activities")}
            sx={{ textTransform: "none" }}
          >
            내 활동 보기
          </Button>
        </Box>

        <Card>
          <CardContent>
            <MonthlyRunningChart data={data?.monthly_running ?? []} />
          </CardContent>
        </Card>
      </Box>

      {/* Recent Activities Section */}
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            최근 활동
          </Typography>
          <Button
            size="small"
            onClick={() => router.push("/activities")}
            sx={{ textTransform: "none" }}
          >
            전체 보기
          </Button>
        </Box>

        <Card>
          {data && data.recent_activities.length > 0 ? (
            <List disablePadding>
              {data.recent_activities.map((activity, idx) => {
                const kst = toKST(activity.start_time);
                return (
                  <ListItemButton
                    key={activity.id}
                    onClick={() => router.push(`/activity/${activity.id}`)}
                    divider={idx < data.recent_activities.length - 1}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <DirectionsRunIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={kst.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
                      secondary={`${(activity.total_distance / 1000).toFixed(2)}km · ${formatTimeFromSeconds(activity.total_time)} · ${formatPace(activity.avg_pace)} /km`}
                    />
                    {activity.avg_hr && (
                      <Typography variant="body2" color="text.secondary">
                        {Math.round(activity.avg_hr)} bpm
                      </Typography>
                    )}
                  </ListItemButton>
                );
              })}
            </List>
          ) : (
            <CardContent sx={{ textAlign: "center", py: 4 }}>
              <Typography color="text.secondary">
                아직 활동 기록이 없습니다
              </Typography>
            </CardContent>
          )}
        </Card>
      </Box>
    </AppLayout>
  );
}
