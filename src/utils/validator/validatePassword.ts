export const validatePassword = (password: string) => {
  return password && password.length >= 6;
};
