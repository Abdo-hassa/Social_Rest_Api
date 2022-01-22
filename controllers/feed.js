const { validationResult } = require('express-validator');
const Post = require('../models/post');
const User = require('../models/user');

const io = require('../socket');
const fs = require('fs');
const path = require('path');
const { post } = require('../routes/feed');
const { findById } = require('../models/user');

exports.getPosts = async (req, res, next) => {
	const currentPage = req.query.page || 1;
	const perPage = 2;
	try {
		let totalItems = await Post.find().countDocuments();
		const user = await User.findById(req.userId);
		const posts = await Post.find()
			.sort({ createdAt: -1 })
			.populate('creator')
			.skip((currentPage - 1) * perPage)
			.limit(perPage);
		res.json({
			posts: posts,
			status: user.status,
			totalItems,
		});
	} catch (e) {
		if (!e.statusCode) {
			e.statusCode = 500;
		}
		next(e);
	}
};
exports.getStatus = async (req, res, next) => {
	try {
		const user = await User.findById(req.userId);
		if (!user) {
			const error = await new Error('No user found');
			error.statusCode = 401;
			throw error;
		}
		res.json({
			status: user.status,
		});
	} catch (e) {
		if (!e.statusCode) {
			e.statusCode = 500;
		}
		next(e);
	}
};

exports.createPost = async (req, res, next) => {
	//create post in database
	const title = req.body.title;
	const content = req.body.content;
	let creator;
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			const error = await new Error('Validation faild, entered data ia incorrect');
			error.statusCode = 422;
			throw error;
		}
		if (!req.file) {
			const error = await new Error('No iamge provided');
			error.statusCode = 422;
			throw error;
		}
		const imageUrl = req.file.path.replace('\\', '/');
		const post = await new Post({
			title: title,
			content: content,
			imageUrl: imageUrl,
			creator: req.userId,
		});
		post.save();
		const user = await User.findById(req.userId).populate('posts');
		creator = user;
		user.posts.push(post);
		await user.save();
		io.getIO().emit('posts', {
			action: 'create',
			post: { ...post._doc, creator: { _id: req.userId, name: user.name } },
		});
		res.status(201).json({
			message: 'Post createrd successfully',
			post: post,
			creator: { _id: creator._id, name: creator.name },
		});
	} catch (e) {
		if (!e.statusCode) {
			e.statusCode = 500;
		}
		next(e);
	}
};

exports.createStatus = async (req, res, next) => {
	const status = req.body.status;
	try {
		const user = await User.findById(req.userId).populate('status');
		user.status = status;
		await user.save();
		res.status(201).json({
			message: 'status updated successfully',
		});
	} catch (e) {
		if (!e.statusCode) {
			e.statusCode = 500;
		}
		next(e);
	}
};

exports.getPost = async (req, res, next) => {
	const postId = req.params.postId;
	try {
		const post = await Post.findById(postId).populate('creator');
		if (!post) {
			const error = await new Error('could not found post');
			error.statusCode = 404;
			throw error;
		}
		res.json({
			post: post,
		});
	} catch (e) {
		if (!e.statusCode) {
			e.statusCode = 500;
		}
		next(e);
	}
};

exports.updatePost = async (req, res, next) => {
	const postId = req.params.postId;
	const title = req.body.title;
	const content = req.body.content;
	let imageUrl = req.body.image;
	if (req.file) {
		imageUrl = req.file.path.replace('\\', '/');
	}
	try {
		if (!imageUrl) {
			const error = await new Error('no file picked');
			error.statusCode = 422;
			throw error;
		}
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			const error = await new Error('Validation faild, entered data ia incorrect');
			error.statusCode = 422;
			throw error;
		}
		const post = await Post.findById(postId).populate('creator');
		if (!post) {
			const error = await new Error('could not found post');
			error.statusCode = 404;
			throw error;
		}
		if (post.creator._id.toString() !== req.userId) {
			const error = await new Error('not authorized');
			error.statusCode = 403;
			throw error;
		}
		if (imageUrl !== post.imageUrl) {
			clearImage(post.imageUrl);
		}
		post.title = title;
		post.content = content;
		post.imageUrl = imageUrl;
		await post.save();
		io.getIO().emit('posts', {
			action: 'updata',
			post: post,
		});
		res.status(200).json({ meesage: 'post updated', post: post });
	} catch (e) {
		if (!e.statusCode) {
			e.statusCode = 500;
		}
		next(e);
	}
};

exports.deletePost = async (req, res, next) => {
	try {
		const postId = req.params.postId;
		const post = await Post.findById(postId).populate('creator');
		const user = await User.findById(req.userId).populate('posts');

		if (!post) {
			const error = await new Error('could not found post');
			error.statusCode = 404;
			throw error;
		}

		if (post.creator._id.toString() !== req.userId) {
			const error = await new Error('not authorized');
			error.statusCode = 403;
			throw error;
		}
		clearImage(post.imageUrl);
		await Post.findByIdAndRemove(postId);
		user.posts.pull(postId);
		await user.save();
		io.getIO().emit('posts', {
			action: 'delete',
			post: postId,
		});
		res.status(200).json({ meesage: 'post deleted' });
	} catch (e) {
		if (!e.statusCode) {
			e.statusCode = 500;
		}
		next(e);
	}
};

const clearImage = filePath => {
	filePath = path.join(__dirname, '..', filePath);
	fs.unlink(filePath, err => console.log(err));
};
