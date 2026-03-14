export const validateEmail = (email: string): string | null => {
  if (!email) return '올바른 이메일 형식을 입력해주세요';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email) ? null : '올바른 이메일 형식을 입력해주세요';
};

export const validateNickname = (nickname: string): string | null => {
  if (nickname.length < 2 || nickname.length > 20) {
    return '닉네임은 2~20자로 입력해주세요';
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (password.length < 8 || !hasLetter || !hasNumber) {
    return '비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다';
  }
  return null;
};

export const validatePasswordConfirm = (
  password: string,
  confirm: string,
): string | null => {
  if (password !== confirm) return '비밀번호가 일치하지 않습니다';
  return null;
};

export const getPasswordStrength = (
  password: string,
): 'weak' | 'medium' | 'strong' => {
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  if (password.length >= 12 && hasLetter && hasNumber && hasSpecial) {
    return 'strong';
  }
  if (password.length >= 8 && hasLetter && hasNumber) {
    return 'medium';
  }
  return 'weak';
};

export const validateBirthYear = (year: number | null): string | null => {
  if (year === null) return '출생 연도를 선택해주세요';
  const currentYear = new Date().getFullYear();
  if (year < 1920 || year > currentYear) return '올바른 출생 연도를 선택해주세요';
  return null;
};

export const validateBirthMonth = (month: number | null): string | null => {
  if (month === null) return '출생 월을 선택해주세요';
  if (month < 1 || month > 12) return '올바른 출생 월을 선택해주세요';
  return null;
};

export const validateGender = (gender: string | null): string | null => {
  if (gender === null || gender === '') return '성별을 선택해주세요';
  if (gender !== 'male' && gender !== 'female') return '올바른 성별을 선택해주세요';
  return null;
};
