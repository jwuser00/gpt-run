export type LLMEvaluationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Lap {
  lap_number: number;
  distance: number;
  time: number;
  pace: number;
  avg_hr: number | null;
  max_hr: number | null;
  avg_cadence: number | null;
}

export interface Activity {
  id: number;
  start_time: string;
  total_distance: number;
  total_time: number;
  avg_pace: number;
  avg_hr: number | null;
  avg_cadence: number | null;
  is_treadmill: boolean;
  llm_evaluation: string | null;
  llm_evaluation_status: LLMEvaluationStatus | null;
}

export interface ActivityDetail extends Activity {
  laps: Lap[];
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  nickname: string;
  birth_year: number | null;
  birth_month: number | null;
  gender: string | null;
}

export interface UserProfile {
  email: string;
  nickname: string;
  birth_year: number | null;
  birth_month: number | null;
  gender: string | null;
  has_google: boolean;
  has_password: boolean;
}

export interface ToastState {
  message: string;
  type: "success" | "error" | "warning" | "info";
}

// --- Race types ---

export type DistanceType = "full" | "half" | "10km" | "5km" | "custom";
export type RaceStatus = "예정" | "완주" | "DNS" | "DNF";

export interface RaceImage {
  id: number;
  race_id: number;
  filename: string;
  original_name: string;
  uploaded_at: string;
}

export interface ActivityBrief {
  id: number;
  start_time: string;
  total_distance: number;
  total_time: number;
  avg_pace: number;
}

export interface Race {
  id: number;
  user_id: number;
  race_name: string;
  race_date: string;
  location: string | null;
  distance_type: DistanceType;
  distance_custom: number | null;
  target_time: number | null;
  actual_time: number | null;
  status: RaceStatus;
  activity_id: number | null;
  review: string | null;
  images: RaceImage[];
  activity: ActivityBrief | null;
}

// Registration/edit form: basic info only
export interface RaceFormData {
  race_name: string;
  race_date: string;
  location: string;
  distance_type: DistanceType;
  distance_custom: number | null;
  target_time: number | null;
}

// Result form data
export interface RaceResultFormData {
  status: RaceStatus;
  actual_time: number | null;
  activity_id: number | null;
  review: string;
}

// --- Dashboard types ---

export interface MonthlyRunningDay {
  date: string;
  distance_km: number;
  avg_pace: number | null;
}

export interface RecentActivity {
  id: number;
  start_time: string;
  total_distance: number;
  total_time: number;
  avg_pace: number;
  avg_hr: number | null;
}

export interface DashboardData {
  upcoming_races: Race[];
  monthly_running: MonthlyRunningDay[];
  recent_activities: RecentActivity[];
}
