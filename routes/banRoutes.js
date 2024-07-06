const express = require('express');
const checkBroom = require('../utils/appFunctions.js');
const { formatDate, formatTime } = require('./../utils/dateUtils.js');
const router = express.Router();

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
const Report = forumModels.Report;

const passport = require('passport');
require('../passport.js');

/**
 * Basic user permissions
 */
//Get all reports
router.get('/reports', (req, res) => {
    Report.find()
    .then((Report) => {
        res.status(200).json(Report)
    })
    .catch((err) => {
        console.error(`Error fetching reports: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});

//Get one report
router.get('/reports/:reportId', (req, res) => {
    Report.findById(req.params.reportId)
    .then((Report) => {
        if(!Report) {
            return res.status(404).send(`Report does not exist`);
        }
        res.json({Report});
    })
    .catch((err) => {
        console.error(`Error fetching report: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});

//Get all threadbans
router.get('/', (req, res) => {
    Ban.find()
    .populate('BannedBy')
    .populate('BannedFrom')
    .populate('BannedForPost')
    .populate('BannedUser')
    .then((Ban) => {
        res.status(201).json(Ban);
    })
    .catch((err) => {
        console.error(`Error fetching threadbans: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});

//Get one threadban
router.get('/:id', (req, res) => {
    Ban.findById(req.params.id)
    .populate('BannedBy')
    .populate('BannedFrom')
    .populate('BannedForPost')
    .populate('BannedUser')
    .then((Ban) => {
        if(!Ban) {
            return res.status(404).send(`Ban does not exist`);
        }
        res.json({Ban});
    })
    .catch((err) => {
        console.error(`Error fetching ban: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});

/**
 * Logged in user permissions
 */

//Report a post
router.post('/reports/:id/report/:postId', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const { ReportReason } = req.body;
        const threadId = req.params.id;
        const postId = req.params.postId;
        const userId = req.user._id;

        const thread = await Thread.findById(threadId);
        const post = await Post.findById(postId);
        const user = await User.findById(userId);

        if (!user) {
            return res.status(403).send(`You need to be logged in to do that.`);
        }

        if (!post) {
            return res.status(404).send(`Post not found.`);
        }

        const currentDate = new Date();
        const formattedDate = formatDate(currentDate);
        const formattedTime = formatTime(currentDate);

        const newReport = await Report.create({
            ReportedAtTime: formattedTime,
            ReportedAtDate: formattedDate,
            ThreadID: threadId,
            PostID: postId,
            UserID: userId,
            ReportReason
        });

        await newReport.save();

        const modNotif = await Notification.create({
            NotifDate: formattedDate,
            NotifTime: formattedTime,
            UserLink: {
                UserID: userId,
                Username: user.Username
            },
            ThreadLink: {
                ThreadName: thread.Title,
                ThreadID: threadId
            },
            Type: 'NewReport',
            Content: ReportReason
        });

        await modNotif.save();

        const modList = await User.find({ hasBroom: true });
        
        for (const Mod of modList) {
            Mod.Notifications.push(modNotif._id);
            await Mod.save();
        }

        res.status(201).json(`Report created successfully: ${newReport}`);

    } catch (err) {
        console.error(`Error reporting post: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

/**
 * Admin permissions
 */
router.put('/reports/:reportId/deny-report', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const { ModResponse } = req.body;
        const reportId = req.params.reportId;
        const modHandling = req.user._id;
        
        const report = await Report.findById(reportId);

        if (!report) {
            return res.status(404).send(`Report not found.`);
        }
        const reportingPost = await Post.findById(report.PostID);
        const reportingUser = await User.findById(report.UserID);
        const reportingThread = await Thread.findById(report.ThreadID);

        const currentDate = new Date();
        const formattedDate = formatDate(currentDate);
        const formattedTime = formatTime(currentDate);

        report.ModResponse = ModResponse;
        report.ReportStatus = 'Denied';

        const updatedReport = await report.save();

        const reportingUserNotif = await Notification.create({
            NotifDate: formattedDate,
            NotifTime: formattedTime,
            UserLink: {
                UserID: report.UserID,
                Username: reportingUser.Username
            },
            ThreadLink: {
                ThreadName: reportingThread.Title,
                ThreadID: report.ThreadID
            },
            PostLink: {
                PostID: report.PostID
            },
            Type: 'ReportDenied',
            Content: ModResponse,
            ModID: modHandling
        });

        await reportingUserNotif.save();

        reportingUser.Notifications.push(reportingUserNotif._id);

        await reportingUser.save();

        res.status(201).json(`Report denied successfully: ${updatedReport}`);

    } catch (err) {
        console.error(`Error denying report: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

module.exports = router;

