import { ValidationError } from 'yup';

const formatYupError = (err: ValidationError) => {
  const errors: Array<{ path: string; message: string }> = [];

  err.inner.forEach(e => {
    errors.push({
      path: e.path,
      message: e.message,
    });
  });

  return errors;
};

export default formatYupError;
