const express = require('express');
const { body } = require('express-validator');

const router = express.Router();
const {
	getPosts,
	createPost,
	getPost,
	updatePost,
	deletePost,
	createStatus,
	getStatus,
} = require('../controllers/feed');

const isAuth = require('../middleware/is-auth');
//GET /feed/posts
router.get('/posts', isAuth, getPosts);

router.post(
	'/post',
	[body('title').trim().isLength({ min: 5 }), body('content').trim().isLength({ min: 5 })],
	isAuth,
	createPost
);

router.get('/status', isAuth, getStatus);

router.post('/status', isAuth, createStatus);

router.get('/post/:postId', isAuth, getPost);

router.put(
	'/post/:postId',
	[body('title').trim().isLength({ min: 5 }), body('content').trim().isLength({ min: 5 })],
	isAuth,
	updatePost
);

router.delete('/post/:postId', isAuth, deletePost);

module.exports = router;
