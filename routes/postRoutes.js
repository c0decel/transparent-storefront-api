const express = require('express');
const checkBroom = require('../utils/appFunctions.js');
const router = express.Router();
const { formatDate, formatTime } = require('./../utils/dateUtils.js');

//Models
const forumModels = require('../models/forumModels.js');
const userModels = require('../models/userModels.js');
const storeModels = require('../models/storeModels.js');

//User models
const User = userModels.User;
const Notification = userModels.Notification;

//Forum models
const Thread = forumModels.Thread;
const Post = forumModels.Post;
const Ban = forumModels.Ban;
const Log = forumModels.Log;

//Store models
const Tag = storeModels.Tag;

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
        console.error(`Error fetching posts: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});

//Get one post
router.get('/:id', (req, res) => {
    Post.findById(req.params.id)
    .then((Post) => {
        if (!Post) {
            return res.status(404).send('Post does not exist.');
        }
        res.json({Post});
    })
    .catch((err) => {
        console.error(`Error fetching post: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
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

        const currentDate = new Date();
        const formattedDate = formatDate(currentDate);
        const formattedTime = formatTime(currentDate);

        const thread = await Thread.findById(ThreadID);

        if (!thread) {
            return res.status(404).send(`Thread not found.`);
        }

        const activeBans = await Ban.find({
            BannedUser: UserID,
            BannedFrom: ThreadID,
            IsActive: true
        });

        if (activeBans.length > 0) {
            const date = new Date();
            for (const ban of activeBans) {
                if (Date.now() >= ban.ExpiresOn) {
                    ban.IsActive = false;
                    await ban.save();
                }
            }
        }

        const stillActiveBans = await Ban.find({
            BannedUser: UserID,
            BannedFrom: ThreadID,
            IsActive: true
        });

        if (stillActiveBans.length > 0) {
            return res.status(403).send(`Go away, you're banned.`);
        }

        thread.ReplyCount++;

        await thread.save();

        const replyNotif = await Notification.create({
            NotifDate: formattedDate,
            NotifTime: formattedTime,
            UserLink: UserID,
            ThreadLink: ThreadID,
            Type: 'ThreadReply',
            Content: Content
        });

        const mentioningUsers = [];

        if (Content.includes('@')) {
            const splitContent = Content.split(' ');
            const mentions = splitContent.filter(content => content.startsWith('@'));

            if (mentions.length > 50) {
                return res.status(403).send('Stop spamming.');
            }

            const validUserPromises = mentions.map(async mention => {
                const cropped = mention.slice(1);
                return await User.findOne({ Username: cropped });
            });

            const validUsers = (await Promise.all(validUserPromises)).filter(user => user !== null);

            if (validUsers.length > 0) {
                const mentionNotif = await Notification.create({
                    Type: 'Mention',
                    NotifDate: formattedDate,
                    NotifTime: formattedTime,
                    UserLink: UserID,
                    ThreadLink: ThreadID,
                    Content: Content
                });

                await mentionNotif.save();

                for (const user of validUsers) {
                    user.Notifications.push(mentionNotif._id);
                    mentioningUsers.push(
                        {
                            UserID: user._id,
                            Username: user.Username
                        }
                    );
                    await user.save();
                }
            }
        }

        const post = await Post.create({
            User: UserID,
            Username: username,
            Thread: ThreadID,
            ReplyNumber: thread.ReplyCount,
            PostedAtDate: formattedDate,
            PostedAtTime: formattedTime,
            Content,
            ReplyingTo: mentioningUsers
        });

        await post.save();

        await User.findByIdAndUpdate(thread.User, {
            $push: {
                Notifications: replyNotif._id
            }
        });

        await Thread.findByIdAndUpdate(ThreadID, {
            $push: {
                Replies: post._id
            }
        });

        res.status(201).json({ message: 'Post created successfully', post });
    } catch (err) {
        console.error(`Error posting reply: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

//React to post
router.put('/:id/react/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const Username = req.params.Username;
        const { Type } = req.body;
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).send(`Error: post not found.`);
        }

        if (Username !== req.user.Username) {
            return res.status(403).send(`Error: you can't like posts on another user's behalf.`);
        }

        const existingReactionIndex = post.Reactions.findIndex(reaction => reaction.Username === Username);

        if (existingReactionIndex !== -1) {
            const existingReactionType = post.Reactions[existingReactionIndex].Type;
            switch (existingReactionType) {
                case 'Like':
                    post.ReactionScore -= 1;
                    break;
                case 'Dislike':
                    post.ReactionScore += 1;
                    break;
                case 'Useful':
                    post.ReactionScore -= 2;
                    break;
                case 'Funny':
                    post.ReactionScore -= 1;
                    break;
                case 'Dumb':
                    post.ReactionScore += 2;
                    break;
                default:
                    break;
            }

            post.Reactions.splice(existingReactionIndex, 1);
        } else {

            switch (Type) {
                case 'Like':
                    post.ReactionScore += 1;
                    break;
                case 'Dislike':
                    post.ReactionScore -= 1;
                    break;
                case 'Useful':
                    post.ReactionScore += 2;
                    break;
                case 'Funny':
                    post.ReactionScore += 1;
                    break;
                case 'Dumb':
                    post.ReactionScore -= 2;
                    break;
                default:
                    post.ReactionScore += 1;
                    break;

            }

            post.Reactions.push({
                Username,
                Type
            });
        }

        const updatedPost = await post.save();
        res.status(200).json(updatedPost);

    } catch (err) {
        console.error(`Error liking post: ${err.toString()}`);
        res.status(500).send(`Error: ${err}`);
    }
});

/**
 * Admin permissions
 */
//Edit post
router.patch('/:id', passport.authenticate('jwt', { session: false }), checkBroom, async (req, res) => {
    try {
        const updatedPost = await Post.findByIdAndUpdate(req.params.id, {
            $set: {
                Content: req.body.Content
            }
        },
        { new: true });

        if (!updatedPost) {
            return res.status(404).send(`Could not find post.`);
        }

        res.json(updatedPost);
    } catch(err) {
        console.error(`Error editing post: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

//Warn user for post
router.put('/:id/warn-post', passport.authenticate('jwt', { session: false }), checkBroom, async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await Post.findById(postId).populate('User');
        const { PostWarning } = req.body;
        const modId = req.user.id;

        if (!post) {
            return res.status(404).send(`Post not found`);
        }

        const currentDate = new Date();
        const formattedDate = formatDate(currentDate);
        const formattedTime = formatTime(currentDate);

        post.PostWarning = PostWarning;

        await post.save();

        const newLog = await Log.create({
            Action: 'PostWarned',
            LogTime: formattedTime,
            LogDate: formattedDate,
            Content: PostWarning,
            ModID: modId,
            PostLink: postId,
            ThreadLink: post.Thread
        });

        await newLog.save();

        const postOp = await User.findById(post.User._id);

        if (postOp) {
            const newNotif = await Notification.create({
                UserLink: modId,
                Type: 'PostWarning',
                PostLink: postId,
                Content: PostWarning,
                NotifDate: formattedDate,
                NotifTime: formattedTime
            });

            await newNotif.save();

            postOp.Notifications.push(newNotif._id);

            await postOp.save();
        }

        res.status(201).send(`Warning created: ${post.PostWarning}`);


    } catch(err) {
        console.error(`Error editing post: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

//Create new thread from selected post
router.post('/:id/make-thread', passport.authenticate('jwt', { session: false}), checkBroom, async (req, res) => {
    try { 
        const postId = req.params.id;
        const post = await Post.findById(postId).populate('User');
        const { Title, Tags, Content } = req.body;

        if (!post) {
            return res.status(404).send(`Post not found`);
        }

        const currentDate = new Date();
        const formattedDate = formatDate(currentDate);
        const formattedTime = formatTime(currentDate);

        const newThreadContent = post.Content;
        const newThreadOP = post.User._id;
        const postedAtDate = post.PostedAtDate;
        const postedAtTime = post.PostedAtTime;
        const modId = req.user.id;

        const newThread = await Thread.create({
            ModID: modId,
            User: newThreadOP,
            Content: newThreadContent,
            PostedAtDate: postedAtDate,
            PostedAtTime: postedAtTime,
            Tags,
            Title
        });

        await newThread.save();

        const newLog = await Log.create({
            Action: 'ThreadFromPostCreated',
            LogTime: formattedTime,
            LogDate: formattedDate,
            Content: Content,
            ModID: modId,
            PostLink: postId,
            ThreadLink: newThread._id
        });

        await newLog.save();

        const postOp = await User.findById(post.User._id);

        if (postOp) {
            const newNotif = await Notification.create({
                UserLink: modId,
                Type: 'ThreadMoved',
                ThreadLink: newThread._id,
                Content: Content,
                NotifDate: formattedDate,
                NotifTime: formattedTime
            });

            await newNotif.save();

            postOp.Notifications.push(newNotif._id);

            await postOp.save();
        }

        res.status(201).send(`Thread created: ${newThread}`);
    } catch (err) {
        console.error(`Error posting thread: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});


//Toggle highlighted post
router.put('/:id/toggle-highlight', passport.authenticate('jwt', { session: false }), checkBroom, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return console.error(`Post does not exist.`);
        } else {
            post.Highlighted = !post.Highlighted;
            await post.save();
        }

        res.status(200).json(post);
    } catch (err) {
        console.error(`Error highlighting post: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

//Delete post
router.delete('/:id', passport.authenticate('jwt', { session: false }), checkBroom, (req, res) => {
    Post.findByIdAndDelete(req.params.id)
    .then((deletedPost) => {
        if (!deletedPost) {
            res.status(404).send(`Not found.`);
        } else {
            res.status(200).send(`Done.`);
        }
    })
    .catch((err) => {
        console.error(`Error deleting post: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});



module.exports = router;