import { check, validationResult } from 'express-validator';
import {
  USERNAME_REGEX,
  EMAIL_REGEX,
  PASSWORD_REGEX,
} from '../config/constants.js';

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMap = errors.array().reduce(
      (acc, err) => ({
        ...acc,
        [err.param]: err.msg,
      }),
      {}
    );
    return res.status(400).json({ errors: errorMap });
  }
  next();
};

// Validation chains for registration
export const registerValidations = [
  check('username')
    .matches(USERNAME_REGEX)
    .withMessage('Username must be alphanumeric and 3-50 characters')
    .notEmpty()
    .withMessage('Username is required'),
  check('email')
    .matches(EMAIL_REGEX)
    .withMessage('Invalid email format')
    .notEmpty()
    .withMessage('Email is required'),
  check('password')
    .matches(PASSWORD_REGEX)
    .withMessage(
      'Password must be at least 8 characters, with mixed case, number, and symbol'
    )
    .notEmpty()
    .withMessage('Password is required'),
  check('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords must match')
    .notEmpty()
    .withMessage('Confirm password is required'),
  handleValidationErrors,
];

// Validation chains for login
export const loginValidations = [
  check('identifier').notEmpty().withMessage('Username or email is required'),
  check('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

// Validation chains for forgot password
export const forgotPasswordValidations = [
  check('identifier').notEmpty().withMessage('Username or email is required'),
  handleValidationErrors,
];

// Validation chains for reset password
export const resetPasswordValidations = [
  check('password')
    .matches(PASSWORD_REGEX)
    .withMessage(
      'Password must be at least 8 characters, with mixed case, number, and symbol'
    )
    .notEmpty()
    .withMessage('Password is required'),
  check('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords must match')
    .notEmpty()
    .withMessage('Confirm password is required'),
  handleValidationErrors,
];

// Validation chains for updating user profile
export const updateProfileValidations = [
  check('bio')
    .isLength({ max: 255 })
    .withMessage('Bio must be 255 characters or less')
    .optional({ nullable: true }),
  handleValidationErrors,
];

// Validation chains for follow/unfollow
export const followValidations = [
  check('id')
    .isUUID()
    .withMessage('Invalid user ID')
    .notEmpty()
    .withMessage('User ID is required'),
  handleValidationErrors,
];

// Validation chains for creating/updating posts
export const createPostValidations = [
  check('content')
    .isLength({ max: 1000 })
    .withMessage('Post content must be 1000 characters or less')
    .optional({ nullable: true }),
  handleValidationErrors,
];

export const updatePostValidations = [
  check('content')
    .isLength({ max: 1000 })
    .withMessage('Post content must be 1000 characters or less')
    .notEmpty()
    .withMessage('Post content is required'),
  handleValidationErrors,
];

// Validation chains for comments
export const commentValidations = [
  check('content')
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters')
    .notEmpty()
    .withMessage('Comment content is required'),
  handleValidationErrors,
];

// Validation chains for post ID
export const postIdValidations = [
  check('postId')
    .isUUID()
    .withMessage('Invalid post ID')
    .notEmpty()
    .withMessage('Post ID is required'),
  handleValidationErrors,
];

// Validation chains for comment ID
export const commentIdValidations = [
  check('commentId')
    .isUUID()
    .withMessage('Invalid comment ID')
    .notEmpty()
    .withMessage('Comment ID is required'),
  handleValidationErrors,
];
