const { default: mongoose, mongo } = require("mongoose");
const bcrypt = require('bcrypt');

/**
 * User schema
 */
const userSchema = mongoose.Schema({
    UserID: String,
    Username: {
        type: String,
        required: true
    },
    ProfileImage: {
        type: String,
        default: 'https://ts-demo-bucket-img.s3.amazonaws.com/profile-pics/default-profile-pic.png'
    },
    Password: {
        type: String,
        required: true
    },
    Email: {
        type: String,
        required: true
    },
    Birthday: {
        type: String,
        required: true
    },
    JoinDate: {
        type: String,
        required: false
    },
    JoinTime: {
        type: String,
        required: false
    },
    Cart: [{
        ProductID: String,
        Name: String,
        Price: String,
        Image: String
    }],
    Wishlist: [{
        ProductID: String,
        Name: String,
        Price: String,
        Image: String
    }],
    Purchases: [{
        ProductID: String,
        PaymentIntentID: String,
        Name: String,
        Price: String,
        Image: String,
        PurchaseDate: {
            type: String,
            required: false
        },
        PurchaseTime: {
            type: String,
            required: false
        },
        Status: {
            type: String,
            enum: ['Active', 'Refunded', 'Shipped', 'Completed'],
            default: 'Active'
        },
        DiscountUsed: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Discount'
        }
    }],
    Reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    }],
    Posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    PostCount: {
        type: Number,
        default: 0
    },
    Threads: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Thread'
    }],
    ThreadCount: {
        type: Number,
        default: 0
    },
    hasBroom: {
        type: Boolean,
        default: false
    },
    isSponsor: {
        type: Boolean, 
        default: false
    },
    canPost: {
        type: Boolean,
        default: true
    },
    Threadbans: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ban'
    }],
    Status: {
        type: String,
        default: `I'm NEW!!!`
    },
    Bio: {
        type: String,
        default: 'No bio.'
    },
    Notifications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notification',
        required: true
    }],
    SavedPosts: [{
        PostID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
            required: true
        }
    }],
    ProfileComments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }]
});

/**
 * Notification schema
 */
const notifSchema = mongoose.Schema({
    Status: {
        type: String,
        enum: ['Read', 'Unread'],
        default: 'Unread'
    },
    Type: {
        type: String,
        enum: ['Mention', 'NewPurchase', 'PurchaseUpdate', 'ThreadReply', 'ProfileComment', 'PostReply', 'Threadban', 'SponsorPromotion', 'AdminPromotion', 'PostToggle', 'NewReport', 'ReportDenied', 'ReportResolved'],
        required: true
    },
    UserLink: {
        UserID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false
        },
        Username: {
            type: String,
            required: false
        }
    },
    PostLink: {
        PostID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
            required: false 
        },
        PostBody: {
            type: String,
            required: false
        }
    },
    ThreadLink: {
        ThreadID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Thread',
            required: false
        },
        ThreadName: {
            type: String,
            requried: false
        }
    },
    ProductLink: {
        ProductID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: false
        },
        ProductName: {
            type: String,
            required: false
        }
    },
    PurchaseLink: {
        PurchaseID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Purchase',
            required: false
        }
    },
    BanLink: {
        BanID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ban',
            required: false
        },
        Reason: {
            type: String,
            required: false
        },
        ExpiresOn: {
            type: Date,
            required: false
        }
    },
    NotifDate: {
        type: String,
        required: false
    },
    NotifTime: {
        type: String,
        required: false
    },
    Content: {
        type: String,
        required: false
    }
});

userSchema.statics.hashPass = (password) => {
    return bcrypt.hashSync(password, 10);
};
  
userSchema.methods.validatePass = function(password) {
    return bcrypt.compareSync(password, this.Password);
};

const validatePass = userSchema.methods.validatePass;

const User = mongoose.model('User', userSchema);
const Notification = mongoose.model('Notification', notifSchema);

module.exports.User = User;
module.exports.Notification = Notification;