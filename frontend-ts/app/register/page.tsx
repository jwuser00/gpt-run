'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import FormLabel from '@mui/material/FormLabel';
import { register, login } from '@/lib/api/auth';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  validateEmail,
  validateNickname,
  validatePassword,
  validatePasswordConfirm,
  validateBirthYear,
  validateBirthMonth,
  validateGender,
} from '@/lib/validation';
import PasswordStrengthBar from '@/components/auth/PasswordStrengthBar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const CURRENT_YEAR = new Date().getFullYear();
const BIRTH_YEARS = Array.from({ length: CURRENT_YEAR - 1920 + 1 }, (_, i) => CURRENT_YEAR - i);

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [birthMonth, setBirthMonth] = useState<number | null>(null);
  const [gender, setGender] = useState<string>('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [touched, setTouched] = useState({
    email: false,
    nickname: false,
    birthYear: false,
    birthMonth: false,
    gender: false,
    password: false,
    passwordConfirm: false,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { setToken } = useAuth();

  const emailError = validateEmail(email);
  const nicknameError = validateNickname(nickname);
  const birthYearError = validateBirthYear(birthYear);
  const birthMonthError = validateBirthMonth(birthMonth);
  const genderError = validateGender(gender || null);
  const passwordError = validatePassword(password);
  const passwordConfirmError = validatePasswordConfirm(password, passwordConfirm);

  const isFormValid =
    !emailError &&
    !nicknameError &&
    !birthYearError &&
    !birthMonthError &&
    !genderError &&
    !passwordError &&
    !passwordConfirmError;

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      email: true,
      nickname: true,
      birthYear: true,
      birthMonth: true,
      gender: true,
      password: true,
      passwordConfirm: true,
    });
    if (!isFormValid) return;

    setError('');
    setLoading(true);
    try {
      await register(email, nickname, birthYear!, birthMonth!, gender, password);
      try {
        const data = await login(email, password);
        setToken(data.access_token);
        router.push('/dashboard');
      } catch {
        router.push('/login?registered=1');
      }
    } catch {
      setError('회원가입에 실패했습니다. 이미 사용 중인 이메일일 수 있습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    window.location.href = `${API_URL}/users/auth/google`;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 440 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" align="center" sx={{ mb: 3 }}>
            회원가입
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              type="email"
              label="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              margin="normal"
              required
              error={touched.email && !!emailError}
              helperText={touched.email && emailError ? emailError : ' '}
            />
            <TextField
              fullWidth
              label="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onBlur={() => handleBlur('nickname')}
              margin="normal"
              required
              error={touched.nickname && !!nicknameError}
              helperText={touched.nickname && nicknameError ? nicknameError : ' '}
            />

            <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
              <FormControl
                fullWidth
                required
                error={touched.birthYear && !!birthYearError}
              >
                <InputLabel id="birth-year-label">출생 연도</InputLabel>
                <Select
                  labelId="birth-year-label"
                  value={birthYear ?? ''}
                  label="출생 연도"
                  onChange={(e) => setBirthYear(e.target.value as number)}
                  onBlur={() => handleBlur('birthYear')}
                >
                  {BIRTH_YEARS.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {touched.birthYear && birthYearError ? birthYearError : ' '}
                </FormHelperText>
              </FormControl>

              <FormControl
                sx={{ minWidth: 120 }}
                required
                error={touched.birthMonth && !!birthMonthError}
              >
                <InputLabel id="birth-month-label">월</InputLabel>
                <Select
                  labelId="birth-month-label"
                  value={birthMonth ?? ''}
                  label="월"
                  onChange={(e) => setBirthMonth(e.target.value as number)}
                  onBlur={() => handleBlur('birthMonth')}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <MenuItem key={month} value={month}>
                      {month}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {touched.birthMonth && birthMonthError ? birthMonthError : ' '}
                </FormHelperText>
              </FormControl>
            </Box>

            <Box sx={{ mt: 1, mb: 1 }}>
              <FormControl
                required
                error={touched.gender && !!genderError}
                component="fieldset"
              >
                <FormLabel component="legend" sx={{ fontSize: '0.875rem' }}>
                  성별
                </FormLabel>
                <RadioGroup
                  row
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  onBlur={() => handleBlur('gender')}
                >
                  <FormControlLabel value="male" control={<Radio />} label="남성" />
                  <FormControlLabel value="female" control={<Radio />} label="여성" />
                </RadioGroup>
                <FormHelperText>
                  {touched.gender && genderError ? genderError : ' '}
                </FormHelperText>
              </FormControl>
            </Box>

            <TextField
              fullWidth
              type="password"
              label="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur('password')}
              margin="normal"
              required
              error={touched.password && !!passwordError}
              helperText={touched.password && passwordError ? passwordError : ' '}
            />
            {password && <PasswordStrengthBar password={password} />}
            <TextField
              fullWidth
              type="password"
              label="비밀번호 확인"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              onBlur={() => handleBlur('passwordConfirm')}
              margin="normal"
              required
              error={touched.passwordConfirm && !!passwordConfirmError}
              helperText={
                touched.passwordConfirm && passwordConfirmError
                  ? passwordConfirmError
                  : ' '
              }
            />

            {error && (
              <Alert severity="error" sx={{ mt: 1, mb: 1 }}>
                {error}
              </Alert>
            )}

            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={!isFormValid || loading}
              sx={{ mt: 2, py: 1.2 }}
            >
              {loading ? '가입 중...' : '회원가입'}
            </Button>
          </Box>

          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              또는
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            onClick={handleGoogleSignUp}
            sx={{ py: 1.2, borderColor: 'divider', color: 'text.primary' }}
            startIcon={
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path
                  fill="#4285F4"
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
                />
                <path
                  fill="#EA4335"
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"
                />
              </svg>
            }
          >
            Google로 가입
          </Button>

          <Typography
            align="center"
            variant="body2"
            sx={{ mt: 2, color: 'text.secondary' }}
          >
            이미 계정이 있으신가요?{' '}
            <Link href="/login" style={{ color: '#4e73df' }}>
              로그인
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
