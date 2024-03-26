const express = require('express');
const router = express.Router();
const Models = require('../models.js');
const Tag = Models.Tag;
const Thread = Models.Thread;
const Post = Models.Post;
const User = Models.User;

const passport = require('passport');
const checkBroom = require('../appFunctions.js');
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
            LikedBy: [],
            DislikedBy: [],
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

//Toggle highlighted post
router.patch('/:id/toggle-highlight', passport.authenticate('jwt', { session: false }), checkBroom, (req, res) => {
    const id = req.params.id;

    Post.findById(id)
        .then((post) => {
            if (!post) {
                return res.status(404).send('Post not found.');
            }
            post.Highlighted = !post.Highlighted;
            return post.save();
        })
        .then((updatedPost) => {
            res.status(200).json(updatedPost);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

//Like post
router.put('/:id/like/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const postId = req.params.id;
        const username = req.params.username;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).send('Post not found.');
        }

        const alreadyLikedIndex = post.LikedBy.indexOf(username);
        const alreadyDislikedIndex = post.DislikedBy.indexOf(username);

        if (alreadyDislikedIndex !== -1) {
            post.DislikedBy.splice(alreadyDislikedIndex, 1);
        }

        if (alreadyLikedIndex === -1) {
            post.LikedBy.push(username);
        }

        const updatedPost = await post.save();

        res.status(200).json({ message: 'Post liked successfully', post: updatedPost });
    } catch (err) {
        console.error('Error liking post: ', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//Dislike post
router.put('/:id/dislike/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const postId = req.params.id;
        const username = req.params.username;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).send('Post not found.');
        }

        const alreadyLikedIndex = post.LikedBy.indexOf(username);
        const alreadyDislikedIndex = post.DislikedBy.indexOf(username);

        if (alreadyLikedIndex !== -1) {
            post.LikedBy.splice(alreadyLikedIndex, 1);
        }

        if (alreadyDislikedIndex === -1) {
            post.DislikedBy.push(username);
        }

        const updatedPost = await post.save();

        res.status(200).json({ message: 'Post disliked successfully', post: updatedPost });
    } catch (err) {
        console.error('Error liking post: ', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;