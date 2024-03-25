const express = require('express');
const router = express.Router();
const Models = require('../models.js');
const Tag = Models.Tag;
const Thread = Models.Thread;
const Post = Models.Post;
const User = Models.User;

const passport = require('passport');
require('../passport.js');

/**
 * Basic user permissions
 */
//Get all posts
router.get('/', (req, res) => {
    Post.find()
    .then((Post) => {
        res.status(201).json(Post);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Get one post
router.get('/:id', (req, res) => {
    Post.findOne({ id: req.params.PostID })
    .then((Post) => {
        if (!Post) {
            return res.status(404).send('Post does not exist.');
        }
        res.json({Post});
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

/**
 * Logged in user permission
 */
//Post new reply
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const { UserID, ThreadID, Content } = req.body;
        const username = req.user.Username;

        const post = await Post.create({
            User: UserID,
            Username: username,
            Thread: ThreadID,
            Content
        });

        await post.save();
        console.log(post);

        await User.findByIdAndUpdate(UserID, { $push: { Posts: post._id } });

        await Thread.findByIdAndUpdate(ThreadID, { $push: { Replies: post._id } });
        res.status(201).json({ message: 'Post created successfully', post });
    } catch (err) {
        console.error('Could not create post: ', err);
        res.status(500).json({ error: 'Internal server error' });
    }
})

module.exports = router;