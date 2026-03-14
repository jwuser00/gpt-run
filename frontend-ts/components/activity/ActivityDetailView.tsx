'use client';

import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ActivityStats from './ActivityStats';
import LapTable from './LapTable';
import PaceHRChart from './PaceHRChart';
import LLMEvaluationCard from './LLMEvaluationCard';
import { getActivity, reEvaluateActivity } from '@/lib/api/activities';
import { ActivityDetail } from '@/lib/types';

interface ActivityDetailViewProps {
  activityId: number;
}

export default function ActivityDetailView({ activityId }: ActivityDetailViewProps) {
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const loadActivity = useCallback(async () => {
    try {
      const data = await getActivity(activityId);
      setActivity(data);
    } catch {
      // handled by auth interceptor
    }
  }, [activityId]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getActivity(activityId);
        if (!cancelled) setActivity(data);
      } catch {
        // handled by auth interceptor
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [activityId]);

  // Poll while LLM evaluation is pending/processing
  useEffect(() => {
    const status = activity?.llm_evaluation_status;
    if (status !== 'pending' && status !== 'processing') return;

    const interval = setInterval(loadActivity, 5000);
    return () => clearInterval(interval);
  }, [activity?.llm_evaluation_status, loadActivity]);

  const handleReEvaluate = async () => {
    try {
      await reEvaluateActivity(activityId);
      await loadActivity();
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!activity) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        활동 데이터를 불러올 수 없습니다.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Typography variant="h6">활동 요약</Typography>
            {activity.is_treadmill && (
              <Chip
                icon={<FitnessCenterIcon />}
                label="트레드밀"
                size="small"
                variant="outlined"
              />
            )}
          </Box>
          <ActivityStats activity={activity} />
        </CardContent>
      </Card>

      <LLMEvaluationCard
        evaluation={activity.llm_evaluation}
        status={activity.llm_evaluation_status}
        onReEvaluate={handleReEvaluate}
      />

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            랩 분석
          </Typography>
          <LapTable laps={activity.laps} />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            페이스 &amp; 심박수
          </Typography>
          <PaceHRChart laps={activity.laps} />
        </CardContent>
      </Card>
    </Box>
  );
}
