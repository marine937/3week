export function validateEmail(email) {
  if (!email?.trim()) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
  return '';
}

export function validatePassword(password) {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain a number.';
  return '';
}

export function validateName(name) {
  if (!name?.trim()) return 'Name is required.';
  if (name.length > 100) return 'Name must be 100 characters or less.';
  return '';
}

export function validateRequired(value, label) {
  if (!value?.trim()) return `${label} is required.`;
  return '';
}

export function getFieldErrors(form, validators) {
  const errors = {};
  for (const [field, validator] of Object.entries(validators)) {
    const msg = validator(form[field], form);
    if (msg) errors[field] = msg;
  }
  return errors;
}
