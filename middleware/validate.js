import * as Yup from 'yup';
import {
  USERNAME_REGEX,
  EMAIL_REGEX,
  PASSWORD_REGEX,
} from '../config/constants.js';

export const validate = schema => async (req, res, next) => {
  try {
    await schema.validate(req.body, { abortEarly: false });
    next();
  } catch (error) {
    const errors = error.inner.reduce(
      (acc, err) => ({
        ...acc,
        [err.path]: err.message,
      }),
      {}
    );
    res.status(400).json({ errors });
  }
};

export const registerSchema = Yup.object({
  username: Yup.string()
    .matches(
      USERNAME_REGEX,
      'Username must be alphanumeric and 3-50 characters'
    )
    .required('Username is required'),
  email: Yup.string()
    .matches(EMAIL_REGEX, 'Invalid email format')
    .required('Email is required'),
  password: Yup.string()
    .matches(
      PASSWORD_REGEX,
      'Password must be at least 8 characters, with mixed case, number, and symbol'
    )
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

export const loginSchema = Yup.object({
  identifier: Yup.string().required('Username or email is required'),
  password: Yup.string().required('Password is required'),
});

export const forgotPasswordSchema = Yup.object({
  identifier: Yup.string().required('Username or email is required'),
});

export const resetPasswordSchema = Yup.object({
  password: Yup.string()
    .matches(
      PASSWORD_REGEX,
      'Password must be at least 8 characters, with mixed case, number, and symbol'
    )
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});
