const express = require('express');
const checkBroom = require('../utils/appFunctions.js');
const mongoose = require('mongoose');
const router = express.Router();
const Models = require('../models.js');
const Tag = Models.Tag;
const Product = Models.Product;
const Supply = Models.Supply;
const Thread = Models.Thread;
const Post = Models.Post;
const User = Models.User;
const Ban = Models.Ban;
const Notification = Models.Notification;
const { formatDate, formatTime } = require('./../utils/dateUtils.js');


const passport = require('passport');
require('../passport.js');

/**
 * Basic user permissions
 */
//Get all threads
router.get('/', (req, res) => {
    Thread.find()
    .then((Thread) => {
        res.status(201).json(Thread);
    })
    .catch((err) => {
        console.error(`Error fetching threads: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});

//Get one thread
router.get('/:id', (req, res) => {
    Thread.findById(req.params.id)
    .then((thread) => {
        if (!thread) {
            return res.status(404).send(`Thread does not exist.`);
        }
        res.json({ thread });
    })
    .catch((err) => {
        console.error(`Error fetching thread: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});


//Get replies from thread
router.get('/:id/replies', async (req, res) => {
    try {

        const thread = await Thread.findById(req.params.id).populate('Replies');
        
        if (!thread) {
            return res.status(404).send(`Not found.`)
        }
        const replies = thread.Replies;
        return res.status(200).json(replies);


    } catch (err) {
        console.error(`Error fetching replies: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

//Post new thread
router.post('/',passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const { Username, UserID, Title, Content, Tags } = req.body;

        const currentDate = new Date();
        const formattedDate = formatDate(currentDate);
        const formattedTime = formatTime(currentDate);

        const newThread = await Thread.create({
            User: UserID,
            Username,
            Title,
            Content,
            Tags,
            PostedAtDate: formattedDate,
            PostedAtTime: formattedTime,
            LikedBy: [],
            DislikedBy: []
        });
        await newThread.save();

        await User.findByIdAndUpdate(UserID, 
            { $push: 
                { Threads: newThread._id }
            }
        );
        return res.status(201).json(`Thread created successfully: ${newThread}`);
    } catch (err) {
        console.error(`Error posting thread: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

//Get thread by tag
router.get('/tags/:id', async (req, res) => {
    try {
        const threads = await Thread.find({ Tags: req.params.id });
        res.json(threads);
      } catch (err) {
        console.error(`Error fetching threads: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
      }
});

/**
 * Admin permissions
 */
//Delete thread
router.delete('/:id', passport.authenticate('jwt', { session: false }), checkBroom, (req, res) => {

    Thread.findByIdAndDelete(req.params.id)
    .then((deletedThread) => {
        if (!deletedThread) {
            res.status(404).send(`Thread does not exist.`);
        } else {
            res.status(200).send(`Done.`);
        }
    })
    .catch((err) => {
        console.error(`Error deleting thread: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});

//Ban a user from a thread
router.post('/:id/bans/:Username/:Post', passport.authenticate('jwt', { session: false }),checkBroom, async (req, res) => {
    try {
        const { Reason, ExpiresOn } = req.body;
        let toBan = await User.findOne({Username: req.params.Username});
        let post = await Post.findById({_id: req.params.Post}); 
        const BannedBy = req.user.id;
        const bannedByUser = await User.findById(BannedBy);
        const toBanId = toBan._id;
        const threadId = req.params.id;
        const postId = post._id;
        const thread = Thread.findById(threadId);

        const currentDate = new Date();

        const formattedDate = formatDate(currentDate);
        const formattedTime = formatTime(currentDate);

        let expiryDate;
        if (ExpiresOn) {
            expiryDate = new Date(ExpiresOn);
            if (isNaN(expiryDate.getTime())) {
                throw new Error(`Invalid ExpiresOn date`);
            }
        }

        const formattedExpiryDate = formatDate(expiryDate);

        let banActive;
        if (Date.now() < (expiryDate?.getTime() || 0)) {
            banActive = true;
        } else {
            banActive = false;
        }

        const ban = await Ban.create({
            BannedBy: BannedBy,
            BannedUser: toBanId,
            Reason,
            IssuedOn: currentDate,
            ExpiresOn: expiryDate,
            IsActive: banActive,
            BannedFrom: threadId,
            BannedForPost: postId
        });

        await ban.save();

        const notif = await Notification.create({
            Type: 'Threadban',
            NotifDate: formattedDate,
            NotifTime: formattedTime,
            UserLink: {
                UserID: BannedBy,
                Username: bannedByUser.Username
            },
            ThreadLink: {
                ThreadName: thread.Title,
                ThreadID: threadId
            },
            BanLink: {
                BanID: ban._id,
                Reason: Reason,
                ExpiresOn: expiryDate
            }
        });

        await notif.save();

        await User.findByIdAndUpdate(toBanId, { 
            $push: { 
                Threadbans: ban._id,
                Notifications: notif._id
                }
            }
        );
        await Thread.findByIdAndUpdate(threadId, { $push: { Bans: ban._id }});
        await Post.findByIdAndUpdate(postId, {PostBan: true});

        res.status(201).json(ban);
    } catch (err) {
        console.error(`Error banning user: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

module.exports = router;