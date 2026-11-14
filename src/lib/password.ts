export interface PasswordRule {
  id: 'length' | 'upper' | 'lower' | 'number' | 'symbol';
  label: string;
  test: (password: string) => boolean;
}

export const MIN_PASSWORD = 8;

export const passwordRules: PasswordRule[] = [
  { id: 'length', label: `At least ${MIN_PASSWORD} characters`, test: (p) => p.length >= MIN_PASSWORD },
  { id: 'upper', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', test: (p) => /\d/.test(p) },
  { id: 'symbol', label: 'One symbol (! @ # …)', test: (p) => /[^A-Za-z0-9\s]/.test(p) },
];

export function passwordMet(password: string): number {
  return passwordRules.filter((rule) => rule.test(password)).length;
}

export function passwordValid(password: string): boolean {
  return passwordMet(password) === passwordRules.length;
}
