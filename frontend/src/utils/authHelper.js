export function getStoredUser() {
  const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}
