const express = require('express');
const checkBroom = require('../appFunctions.js');
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
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Get one thread
router.get('/:id', (req, res) => {
    Thread.findById(req.params.id)
    .then((thread) => {
        if (!thread) {
            return res.status(404).send('Thread does not exist.');
        }
        res.json({ thread });
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});


//Get replies from thread
router.get('/:id/replies', async (req, res) => {
    try {
        const ThreadID = req.params.id;

        const thread = await Thread.findById(ThreadID).populate('Replies');
        if (!thread) {
            return res.status(404).send('Not found.')
        }
        const replies = thread.Replies;
        return res.status(200).json(replies);


    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

//Post new thread
router.post('/',passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const { UserID, Title, Content, Tags } = req.body;
        
        const newThread = await Thread.create({
            User: UserID,
            Title,
            Content,
            Tags
        });
        await newThread.save()

        await User.findByIdAndUpdate(UserID, { $push: { Threads: newThread._id } });
        res.status(201).json({ message: 'Thread created successfully', newThread });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

/**
 * Admin permissions
 */
//Delete thread
router.delete('/:id', passport.authenticate('jwt', { session: false }), checkBroom, (req, res) => {
    const id = req.params.id;

    Thread.findByIdAndDelete(id)
    .then((deletedThread) => {
        if (!deletedThread) {
            res.status(404).send('Thread does not exist.');
        } else {
            res.status(200).send('Done.');
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

module.exports = router;