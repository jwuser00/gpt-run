'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RefreshIcon from '@mui/icons-material/Refresh';
import { LLMEvaluationStatus } from '@/lib/types';

interface LLMEvaluationCardProps {
  evaluation: string | null;
  status: LLMEvaluationStatus | null;
  onReEvaluate: () => void;
}

export default function LLMEvaluationCard({
  evaluation,
  status,
  onReEvaluate,
}: LLMEvaluationCardProps) {
  if (!status) return null;

  const isPending = status === 'pending' || status === 'processing';

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <AutoAwesomeIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6">AI 러닝 코치</Typography>
        </Box>

        {isPending && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
            <CircularProgress size={20} />
            <Typography color="text.secondary">AI 분석 중...</Typography>
          </Box>
        )}

        {status === 'completed' && evaluation && (
          <Box>
            <Typography
              variant="body1"
              sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}
            >
              {evaluation}
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={onReEvaluate}
              >
                다시 평가
              </Button>
            </Box>
          </Box>
        )}

        {status === 'failed' && (
          <Box>
            <Typography color="error" sx={{ mb: 1 }}>
              AI 평가에 실패했습니다.
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={onReEvaluate}
            >
              다시 시도
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
