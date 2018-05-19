import * as yup from 'yup';

import { passwordMinLength } from './modules/register/errorMessages';

export const registerPasswordValidation = yup
  .string()
  .min(3, passwordMinLength)
  .max(255);
