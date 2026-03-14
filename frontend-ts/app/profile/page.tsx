'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import FormLabel from '@mui/material/FormLabel';
import { getProfile, updateProfile, changePassword } from '@/lib/api/auth';
import { UserProfile } from '@/lib/types';
import {
  validateNickname,
  validateBirthYear,
  validateBirthMonth,
  validateGender,
  validatePassword,
  validatePasswordConfirm,
} from '@/lib/validation';
import PasswordStrengthBar from '@/components/auth/PasswordStrengthBar';
import AppLayout from '@/components/layout/AppLayout';

const CURRENT_YEAR = new Date().getFullYear();
const BIRTH_YEARS = Array.from({ length: CURRENT_YEAR - 1920 + 1 }, (_, i) => CURRENT_YEAR - i);

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadError, setLoadError] = useState('');

  // Profile form state
  const [nickname, setNickname] = useState('');
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [birthMonth, setBirthMonth] = useState<number | null>(null);
  const [gender, setGender] = useState<string>('');
  const [profileTouched, setProfileTouched] = useState({
    nickname: false,
    birthYear: false,
    birthMonth: false,
    gender: false,
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [passwordTouched, setPasswordTouched] = useState({
    currentPassword: false,
    newPassword: false,
    newPasswordConfirm: false,
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    getProfile()
      .then((data) => {
        setProfile(data);
        setNickname(data.nickname);
        setBirthYear(data.birth_year);
        setBirthMonth(data.birth_month);
        setGender(data.gender ?? '');
      })
      .catch(() => {
        setLoadError('프로필 정보를 불러오지 못했습니다.');
      });
  }, []);

  // Profile form validation
  const nicknameError = validateNickname(nickname);
  const birthYearError = validateBirthYear(birthYear);
  const birthMonthError = validateBirthMonth(birthMonth);
  const genderError = validateGender(gender || null);

  const isProfileFormValid =
    !nicknameError && !birthYearError && !birthMonthError && !genderError;

  const handleProfileBlur = (field: keyof typeof profileTouched) => {
    setProfileTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileTouched({ nickname: true, birthYear: true, birthMonth: true, gender: true });
    if (!isProfileFormValid) return;

    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);
    try {
      const updated = await updateProfile({
        nickname,
        birth_year: birthYear!,
        birth_month: birthMonth!,
        gender,
      });
      setProfile(updated);
      setProfileSuccess('프로필이 저장되었습니다.');
    } catch {
      setProfileError('프로필 저장에 실패했습니다.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Password form validation
  const currentPasswordError =
    passwordTouched.currentPassword && !currentPassword ? '현재 비밀번호를 입력해주세요' : null;
  const newPasswordError = validatePassword(newPassword);
  const newPasswordConfirmError = validatePasswordConfirm(newPassword, newPasswordConfirm);

  const isPasswordFormValid =
    !!currentPassword && !newPasswordError && !newPasswordConfirmError;

  const handlePasswordBlur = (field: keyof typeof passwordTouched) => {
    setPasswordTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordTouched({ currentPassword: true, newPassword: true, newPasswordConfirm: true });
    if (!isPasswordFormValid) return;

    setPasswordError('');
    setPasswordSuccess('');
    setPasswordLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess('비밀번호가 변경되었습니다.');
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      setPasswordTouched({ currentPassword: false, newPassword: false, newPasswordConfirm: false });
    } catch {
      setPasswordError('비밀번호 변경에 실패했습니다. 현재 비밀번호를 확인해주세요.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <AppLayout>
      <Box sx={{ maxWidth: 600, mx: 'auto', py: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
          내 정보
        </Typography>

        {loadError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {loadError}
          </Alert>
        )}

        <Card>
          <CardContent sx={{ p: 4 }}>
            {/* Profile Info Section */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              프로필 정보
            </Typography>

            <Box component="form" onSubmit={handleProfileSave} noValidate>
              <TextField
                fullWidth
                label="이메일"
                value={profile?.email ?? ''}
                margin="normal"
                disabled
                InputProps={{ readOnly: true }}
              />

              <TextField
                fullWidth
                label="닉네임"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onBlur={() => handleProfileBlur('nickname')}
                margin="normal"
                required
                error={profileTouched.nickname && !!nicknameError}
                helperText={profileTouched.nickname && nicknameError ? nicknameError : ' '}
              />

              <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
                <FormControl
                  fullWidth
                  required
                  error={profileTouched.birthYear && !!birthYearError}
                >
                  <InputLabel id="profile-birth-year-label">출생 연도</InputLabel>
                  <Select
                    labelId="profile-birth-year-label"
                    value={birthYear ?? ''}
                    label="출생 연도"
                    onChange={(e) => setBirthYear(e.target.value as number)}
                    onBlur={() => handleProfileBlur('birthYear')}
                  >
                    {BIRTH_YEARS.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {profileTouched.birthYear && birthYearError ? birthYearError : ' '}
                  </FormHelperText>
                </FormControl>

                <FormControl
                  sx={{ minWidth: 120 }}
                  required
                  error={profileTouched.birthMonth && !!birthMonthError}
                >
                  <InputLabel id="profile-birth-month-label">월</InputLabel>
                  <Select
                    labelId="profile-birth-month-label"
                    value={birthMonth ?? ''}
                    label="월"
                    onChange={(e) => setBirthMonth(e.target.value as number)}
                    onBlur={() => handleProfileBlur('birthMonth')}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <MenuItem key={month} value={month}>
                        {month}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {profileTouched.birthMonth && birthMonthError ? birthMonthError : ' '}
                  </FormHelperText>
                </FormControl>
              </Box>

              <Box sx={{ mt: 1, mb: 1 }}>
                <FormControl
                  required
                  error={profileTouched.gender && !!genderError}
                  component="fieldset"
                >
                  <FormLabel component="legend" sx={{ fontSize: '0.875rem' }}>
                    성별
                  </FormLabel>
                  <RadioGroup
                    row
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    onBlur={() => handleProfileBlur('gender')}
                  >
                    <FormControlLabel value="male" control={<Radio />} label="남성" />
                    <FormControlLabel value="female" control={<Radio />} label="여성" />
                  </RadioGroup>
                  <FormHelperText>
                    {profileTouched.gender && genderError ? genderError : ' '}
                  </FormHelperText>
                </FormControl>
              </Box>

              <Box sx={{ mt: 1, mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Google 연동
                </Typography>
                {profile?.has_google ? (
                  <Chip label="Google 연동됨" color="success" size="small" />
                ) : (
                  <Chip label="Google 미연동" size="small" />
                )}
              </Box>

              {profileSuccess && (
                <Alert severity="success" sx={{ mb: 1 }}>
                  {profileSuccess}
                </Alert>
              )}
              {profileError && (
                <Alert severity="error" sx={{ mb: 1 }}>
                  {profileError}
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                disabled={!isProfileFormValid || profileLoading}
                sx={{ py: 1.2, px: 4 }}
              >
                {profileLoading ? '저장 중...' : '저장'}
              </Button>
            </Box>

            {/* Password Change Section */}
            {profile?.has_password && (
              <>
                <Divider sx={{ my: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    비밀번호 변경
                  </Typography>
                </Divider>

                <Box component="form" onSubmit={handlePasswordChange} noValidate>
                  <TextField
                    fullWidth
                    type="password"
                    label="현재 비밀번호"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    onBlur={() => handlePasswordBlur('currentPassword')}
                    margin="normal"
                    required
                    error={!!currentPasswordError}
                    helperText={currentPasswordError ?? ' '}
                  />
                  <TextField
                    fullWidth
                    type="password"
                    label="새 비밀번호"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onBlur={() => handlePasswordBlur('newPassword')}
                    margin="normal"
                    required
                    error={passwordTouched.newPassword && !!newPasswordError}
                    helperText={
                      passwordTouched.newPassword && newPasswordError ? newPasswordError : ' '
                    }
                  />
                  {newPassword && <PasswordStrengthBar password={newPassword} />}
                  <TextField
                    fullWidth
                    type="password"
                    label="새 비밀번호 확인"
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    onBlur={() => handlePasswordBlur('newPasswordConfirm')}
                    margin="normal"
                    required
                    error={passwordTouched.newPasswordConfirm && !!newPasswordConfirmError}
                    helperText={
                      passwordTouched.newPasswordConfirm && newPasswordConfirmError
                        ? newPasswordConfirmError
                        : ' '
                    }
                  />

                  {passwordSuccess && (
                    <Alert severity="success" sx={{ mb: 1 }}>
                      {passwordSuccess}
                    </Alert>
                  )}
                  {passwordError && (
                    <Alert severity="error" sx={{ mb: 1 }}>
                      {passwordError}
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!isPasswordFormValid || passwordLoading}
                    sx={{ mt: 1, py: 1.2, px: 4 }}
                  >
                    {passwordLoading ? '변경 중...' : '비밀번호 변경'}
                  </Button>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </AppLayout>
  );
}
