const express = require('express');
const { body } = require('express-validator');
const User = require('../models/user');
const { signup, login } = require('../controllers/auth');
const router = express.Router();

router.put(
	'/signup',
	[
		body('email')
			.isEmail()
			.withMessage('please enter a valid email')
			.custom((value, { req }) => {
				return User.findOne({ email: value }).then(userDoc => {
					if (userDoc) {
						return Promise.reject('Email is already exist');
					}
				});
			})
			.normalizeEmail(),
		body('password').trim().isLength({ min: 3 }),
		body('name').trim().not().isEmpty(),
	],
	signup
);

router.post('/login', login);

module.exports = router;
