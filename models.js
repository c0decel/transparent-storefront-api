const { default: mongoose, mongo } = require("mongoose");
const bcrypt = require('bcrypt');

/**
 * Product reviews
 */
const reviewSchema = mongoose.Schema({
    ReviewID: String,
    Rating: {
        type: Number,
        required: true
    },
    User: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    Username: String,
    ReviewDate: {
        type: String,
        required: true
    },
    ReviewTime: {
        type: String,
        required: true
    },
    Product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    Content: {
        type: String,
        required: true
    },
});

/**
 * Product
 */
const productSchema = mongoose.Schema({
    ProductID: String,
    Name: {
        type: String,
        required: true
    },
    Price: {
        type: Number,
        required: true
    },
    Description: {
        type: String,
        required: false
    },
    ProductImages: [{
        type: String,
        required: false
    }],
    Sales: {
        type: Number,
        default: 0
    },
    Stock: {
        type: Number,
        default: 0
    },
    Reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    }],
    isFeatured: {
        type: Boolean,
        default: false
    },
    Tags: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag'
    }],
    /**
     * Supplies used for product with cost adjusted for amount
     */
    Supplies: [{
        SupplyID: {
            type: String,
            required: true
        },
        Name: String,
        Description: String,
        Amount: {
            type: Number,
            required: true
        },
        Measurement: {
            type: String,
            enum: ['oz', 'grams'],
            required: true
        },
        Cost: {
            type: Number,
            default: 0
        },
        Supplier: String
    }],
    Upcharge: {
        type: Number,
        default: 0
    }
    // Upcharge is a %
});

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
    Username: {
        type: String,
        required: true
    },
    Content: {
        type: String,
        required: true
    },
    ReplyCount: {
        type: Number,
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
    //Array of usernames that likes/dislikes a post
    LikedBy: [],
    DislikedBy: [],
    //Ref to threadbans 
    Bans: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ban'
    }]
});

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
    Username: {
        type: String,
        required: true
    },
    Content: {
        type: String,
        required: true
    },
    ReplyNumber: {
        type: Number,
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
        default: 0
    },
    PostBan: {
        type: Boolean,
        default: false
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
        },
        Section: {
            type: String,
            required: false
        }
    }]
});

const banSchema = mongoose.Schema({
    BanID: String,
    BannedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Thread',
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
    },
    BannedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

const supplySchema = mongoose.Schema({
    SupplyID: String,
    Name: {
        type: String, 
        default: 'New Supply'
    },
    Description: {
        type: String,
        default: 'No description.'
    },
    Cost: {
        type: Number,
        default: 0
    },
    CostOz: {
        type: Number,
        required: true
    },
    Quantity: {
        type: Number, 
        required: true
    },
    Measurement: {
        type: String,
        enum: ['grams', 'oz'],
        required: true
    },
    Supplier: {
        type: String,
        default: 'None specified.'
    }
});

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

const tagSchema = mongoose.Schema({
    TagID: String,
    Tag: {
        type: String,
        required: true
    },
    Description: {
        type: String,
        default: 'No description.'}
});

const expenseSchema = mongoose.Schema({
    Expense: {
        type: String,
        required: true
    },
    Amount: {
        type: Number,
        default: 0
    },
    Description: {
        type: String,
        default: 'No description.'
    },
    ExpenseDate: {
        type: Date,
        required: true
    }
});

const saleSchema = mongoose.Schema({
    Sale: {
        type: String,
        required: true
    },
    Amount: {
        type: Number,
        default: 0
    },
    Description: {
        type: String,
        default: 'No description.'
    },
    SaleDate: {
        type: Date,
        required: true
    }
});

const discountSchema = mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    Type: {
        type: String,
        enum: ['Dollar', 'Percent'],
        default: 'Dollar'
    },
    Amount: {
        type: Number,
        required: true
    },
    Description: {
        type: String,
        default: 'No description.'
    },
    ExpiresOn: {
        type: Date,
        required: true
    },
    IsActive: {
        type: Boolean,
        default: true
    }
});

const purchaseSchema = mongoose.Schema({
    ProductID: {
        type: String,
        required: true
    },
    PurchaseDate: {
        type: String
    },
    PurchaseTime: {
        type: String
    },
    Name: {
        type: String,
        required: true,
    },
    Image: {
        type: String
    },
    Price: {
        type: Number,
        required: true
    },
    Status: {
        type: String
    },
    DiscountUsed: {
        type: String
    }

});

const notifSchema = mongoose.Schema({
    Status: {
        type: String,
        enum: ['Read', 'Unread'],
        default: 'Unread'
    },
    Type: {
        type: String,
        enum: ['Mention', 'NewPurchase', 'PurchaseUpdate', 'ThreadReply', 'ProfileComment', 'PostReply', 'Threadban', 'SponsorPromotion', 'AdminPromotion', 'PostToggle'],
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

const Review = mongoose.model('Review', reviewSchema);
const Product = mongoose.model('Product', productSchema);
const Thread = mongoose.model('Thread', threadSchema);
const Post = mongoose.model('Post', postSchema);
const Ban = mongoose.model('Ban', banSchema);
const Supply = mongoose.model('Supply', supplySchema);
const User = mongoose.model('User', userSchema);
const Tag = mongoose.model('Tag', tagSchema);
const Expense = mongoose.model('Expense', expenseSchema);
const Sale = mongoose.model('Sale', saleSchema);
const Discount = mongoose.model('Discount', discountSchema);
const Purchase = mongoose.model('Purchase', purchaseSchema);
const Notification = mongoose.model('Notification', notifSchema);
const validatePass = userSchema.methods.validatePass;

module.exports.Review = Review;
module.exports.Product = Product;
module.exports.Thread = Thread;
module.exports.Post = Post;
module.exports.Ban = Ban;
module.exports.Supply = Supply;
module.exports.User = User;
module.exports.Tag = Tag;
module.exports.Expense = Expense;
module.exports.Sale = Sale;
module.exports.Discount = Discount;
module.exports.Purchase = Purchase;
module.exports.Notification = Notification;