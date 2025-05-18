import * as EmailValidator from "email-validator";

export const validateEmail = (email) => {
  return EmailValidator.validate(email);
};
