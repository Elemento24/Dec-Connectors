const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const auth = require('../../middleware/auth');
const Post = require('../../models/Post');
const User = require('../../models/User');
const Profile = require('../../models/Profile');
const { remove } = require('../../models/Post');

// @router    POST api/posts
// @desc      Create a Post
// @access    Private
router.post('/', [
  auth,
  [check('text', 'Text is Required!').not().isEmpty()]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    });
  }

  try {
    // Get the User
    const user = await User.findById(req.user.id).select('-password');

    // Make an Object for the New Post
    const newPost = new Post({
      text: req.body.text,
      name: user.name,
      avatar: user.avatar,
      user: req.user.id
    });

    const post = await newPost.save();
    res.json(post);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @router    GET api/posts
// @desc      Get All Posts
// @access    Private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @router    GET api/posts/:id
// @desc      Get Post by ID
// @access    Private
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        msg: 'Post not found!'
      });
    }

    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        msg: 'Post not found!'
      });
    }

    res.status(500).send('Server Error');
  }
});

// @router    DELETE api/posts/:id
// @desc      Delete a Post
// @access    Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        msg: 'Post not found!'
      });
    }

    // Check the User
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({
        msg: 'User not Authorized!'
      });
    }

    await post.remove();
    res.json({ msg: 'Post Removed!' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        msg: 'Post not found!'
      });
    }

    res.status(500).send('Server Error');
  }
});

// @router    PUT api/posts/like/:id
// @desc      Like a Post
// @access    Private
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the Post has been already liked or not
    if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
      return res.status(400).json({
        msg: 'Post already liked!'
      });
    }

    post.likes.unshift({ user: req.user.id });
    await post.save();
    res.json(post.likes);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @router    PUT api/posts/unlike/:id
// @desc      Unlike a Post
// @access    Private
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the Post has been already liked or not
    if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
      return res.status(400).json({
        msg: 'Post has not yet been liked!'
      });
    }

    // Get Remove Index
    const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);

    post.likes.splice(removeIndex, 1);
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @router    POST api/posts/comment/:id
// @desc      Comment on a Post
// @access    Private
router.post('/comment/:id', [
  auth,
  [check('text', 'Text is Required!').not().isEmpty()]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    });
  }

  try {
    // Get the User
    const user = await User.findById(req.user.id).select('-password');
    const post = await Post.findById(req.params.id);

    // Make an Object for the New Post
    const newComment = {
      text: req.body.text,
      name: user.name,
      avatar: user.avatar,
      user: req.user.id
    };

    post.comments.unshift(newComment);
    await post.save();
    res.json(post.comments);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @router    DELETE api/posts/comment/:id/:comment_id
// @desc      Delete Comment
// @access    Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Pull out Comment
    const comment = post.comments.find(comment => comment.id === req.params.comment_id);

    // Make sure that the Comment exists
    if (!comment) {
      return res.status(404).json({
        msg: 'Comment does not Exist!'
      });
    }

    // Check that the User deleting the Comment is the author of the Comment or not
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({
        msg: 'User not authorized!'
      });
    }

    // Get Remove Index
    const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);

    post.comments.splice(removeIndex, 1);
    await post.save();
    res.json(post.comments);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;