const { default: mongoose, mongo } = require("mongoose");
const bcrypt = require('bcrypt');

/**
 * Thread schema
 */
const threadSchema = mongoose.Schema({
    ThreadID: String,
    Title: {
        type: String,
        required: true
    },
    User: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ModID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    Content: {
        type: String,
        required: true
    },
    ReplyCount: {
        type: Number,
        required: false,
        default: 0
    },
    PostedAtDate: {
        type: String,
        required: false
    },
    PostedAtTime: {
        type: String,
        required: false
    },
    Replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    Tags: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag'
    }],
    Highlighted: {
        type: Boolean,
        default: true
    },
    //Ref to threadbans 
    Bans: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ban'
    }]
});

/**
 * Post schema
 */
const postSchema = mongoose.Schema({
    PostID: String,
    Thread: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Thread',
        required: false 
    }, 
    User: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    Content: {
        type: String,
        required: true
    },
    ReplyNumber: {
        type: Number,
        required: false,
        default: 0
    },
    PostedAtDate: {
        type: String,
        required: false
    },
    PostedAtTime: {
        type: String,
        required: false
    },
    Highlighted: {
        type: Boolean,
        default: false
    },
    Reactions: [{
        Username: String,
        Type: {
            type: String,
            enum: ['Like', 'Dislike', 'Useful', 'Funny', 'Dumb'],
            default: 'Like'
        }
    }],
    ReactionScore: {
        type: Number,
        required: false,
        default: 0
    },
    PostBan: {
        type: Boolean,
        default: false
    },
    PostWarning: {
        type: String,
        required: false
    },
    ReplyingTo: [{
        UserID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        Username: {
            type: String,
            required: false
        },
        Post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
            required: false
        }
    }]
});

/**
 * Report schema
 */
const reportSchema = mongoose.Schema({
    UserID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    PostID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    ThreadID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Thread',
        required: true
    },
    ReportedAtTime: {
        type: String,
        required: false
    },
    ReportedAtDate: {
        type: String,
        required: false
    },
    ReportStatus: {
        type: String,
        enum: ['Resolved', 'Denied', 'Active'],
        default: 'Active'
    },
    ModResponse: {
        type: String,
        required: false,
        default: 'Waiting on mod response.'
    },
    ModID: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'User'
    },
    ReportReason: {
        type: String,
        required: true
    }
});

/**
 * Log schema
 */
const logSchema = mongoose.Schema({
    Action: {
        type: String,
        enum: [
            'UserBan',
            'ThreadFromPostCreated',
            'PostDeleted',
            'PostWarned'
        ],
        required: true
    },
    ModID: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'User'
    },
    Content: {
        type: String,
        required: false
    },
    LogTime: {
        type: String,
        required: false
    },
    LogDate: {
        type: String,
        required: false
    }
})

/**
 * Ban schema
 */
const banSchema = mongoose.Schema({
    BanID: String,
    ModID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    BannedFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Thread',
        required: true
    },
    BannedForPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    BannedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    Reason: {
        type: String,
        required: true
    },
    IssuedOn: Date,
    ExpiresOn: {
        type: Date,
        required: true
    },
    IsActive: {
        type: Boolean,
        required: true,
        default: true
    }
});


const Thread = mongoose.model('Thread', threadSchema);
const Post = mongoose.model('Post', postSchema);
const Report = mongoose.model('Report', reportSchema);
const Log = mongoose.model('Log', logSchema);
const Ban = mongoose.model('Ban', banSchema);


module.exports.Thread = Thread;
module.exports.Post = Post;
module.exports.Report = Report;
module.exports.Log = Log;
module.exports.Ban = Ban;
