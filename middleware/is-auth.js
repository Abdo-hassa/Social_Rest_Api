const jwt = require('jsonwebtoken');
module.exports = async (req, res, next) => {
	const authHeader = req.get('Authorization');
	if (!authHeader) {
		const error = await new Error('Not authenticated');
		error.statusCode = 401;
		throw error;
	}
	const token = authHeader.split(' ')[1];
	let decodedToken;
	try {
		decodedToken = jwt.verify(token, 'secret98');
	} catch (e) {
		e.satusCode = 500;
		throw e;
	}
	if (!decodedToken) {
		const error = await new Error('Not authenticated');
		error.statusCode = 401;
		throw error;
	}

	req.userId = decodedToken.userId;
	next();
};
