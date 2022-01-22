const User = require('../models/user');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const error = await new Error('Validation faild, entered data is incorrect');
		error.statusCode = 422;
		error.data = errors.array();
		throw error;
	}
	const email = req.body.email;
	const password = req.body.password;
	const name = req.body.name;
	try {
		const hashedPw = await bcrypt.hash(password, 12);
		const user = await new User({
			email: email,
			password: hashedPw,
			name: name,
		});
		user.save();
		res.status(201).json({ message: 'user created', userId: user._id });
	} catch (e) {
		if (!e.statusCode) {
			e.statusCode = 500;
		}
		next(e);
	}
};
exports.login = async (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;
	let loadedUser;
	try {
		const user = await User.findOne({ email: email });
		if (!user) {
			const error = await new Error('No user found');
			error.statusCode = 401;
			throw error;
		}
		loadedUser = user;
		const isEqual = await bcrypt.compare(password, user.password);
		if (!isEqual) {
			const error = await new Error('Wrong password');
			error.statusCode = 401;
			throw error;
		}
		const token = jwt.sign({ email: loadedUser.email, userId: loadedUser._id.toString() }, 'secret98', {
			expiresIn: '1h',
		});
		res.status(200).json({ token: token, userId: loadedUser._id.toString() });
	} catch (e) {
		if (!e.statusCode) {
			e.statusCode = 500;
		}
		next(e);
	}
};
