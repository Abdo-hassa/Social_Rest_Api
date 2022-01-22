const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');
require('dotenv').config();
app.use(bodyParser.json()); // application/json

app.use('/images', express.static(path.join(__dirname, 'images')));
const fileStorage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'images');
	},
	filename: function (req, file, cb) {
		cb(null, uuidv4());
	},
});
const fileFilter = (req, file, cb) => {
	if (
		file.mimetype === 'image/png' ||
		file.mimetype === 'image/jpg' ||
		file.mimetype === 'image/jpeg' ||
		file.mimetype === 'image/gif'
	) {
		cb(null, true);
	} else {
		cb(null, false);
	}
};
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
	res.header('Access-Control-Allow-Headers', 'X-Requested-With');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	next();
});
app.use(cors());

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

app.use((error, req, res, next) => {
	console.log(error);
	const status = error.statusCode || 500;
	const message = error.message;
	const data = error.data;
	res.status(status).json({ message: message, data: data });
});
mongoose
	.connect(process.env.Database_Url, { useNewUrlParser: true, useUnifiedTopology: true })
	.then(result => {
		console.log('Database Connected');
		const server = app.listen(8080);
		const io = require('./socket').init(server);
		io.on('connection', socket => {
			console.log('Client Connected');
		});
	})
	.catch(err => console.log(err));
