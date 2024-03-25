const { default: mongoose, mongo } = require("mongoose");
const bcrypt = require('bcrypt');

const reviewSchema = mongoose.Schema({
    ReviewID: String,
    Rating: {type: Number, required: true},
    User: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    Username: String,
    Product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    Content: { type: String, required: true },
})

const productSchema = mongoose.Schema({
    ProductID: String,
    Name: {type: String, required: true},
    Price: {type: Number, required: true},
    Description: {type: String, required: true},
    Image: {type: String, default: 'https://www.ncenet.com/wp-content/uploads/2020/04/No-image-found.jpg'},
    Sales: {type: Number, default: 0},
    Stock: {type: Number, default: 0},
    Reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review'}],
    isFeatured: {type: Boolean, default: false},
    Tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag'}],
    Supplies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Supply'}],
    Upcharge: {type: Number, default: 0}
    // Upcharge is a %
});

const threadSchema = mongoose.Schema({
    ThreadID: String,
    Title: {type: String, required: true},
    User: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    Username: String,
    Content: {type: String, required: true},
    ReplyCount: {type: Number, default: 0},
    Replies: [{type: mongoose.Schema.Types.ObjectId, ref: 'Post'}],
    Tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag'}],
    Highlighted: {type: Boolean, default: true}
})

const postSchema = mongoose.Schema({
    PostID: String,
    Thread: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', required: true },
    User: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    Username: String,
    Content: {type: String, required: true},
    Highlighted: {type: Boolean, default: false}
})

const banSchema = mongoose.Schema({
    BanID: String,
    BannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    Reason: {type: String, required: true},
})

const measurementUnits = ['grams', 'oz', 'ml', 'piece'];

const supplySchema = mongoose.Schema({
    SupplyID: String,
    Name: {type: String, required: true},
    Description: {type: String, required: true},
    Cost: {type: Number, required: true},
    Quantity: {type: Number, required: true},
    Measurement: {type: String, enum: measurementUnits, required: true},
    Supplier: String
})

const userSchema = mongoose.Schema({
    UserID: String,
    Username: {type: String, required: true},
    ProfileImage: String,
    Password: {type: String, required: true},
    Email: {type: String, required: true},
    Birthday: {type: Date, required: true},
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
        PurchaseDate: Date
    }],
    Reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review'}],
    Posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post'}],
    PostCount: Number,
    Threads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Thread'}],
    ThreadCount: Number,
    hasBroom: {type: Boolean, default: false},
    isSponsor: {type: Boolean, default: false},
    canPost: {type: Boolean, default: true},
    Threadbans: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ban'}],
});

const tagSchema = mongoose.Schema({
    TagID: String,
    Tag: {type: String, required: true},
    Description: {type: String, required: true}
})

const expenseSchema = mongoose.Schema({
    Expense: {type: String, required: true},
    Amount: Number,
    Description: String,
    ExpenseDate: {type: Date, required: true}
})

const saleSchema = mongoose.Schema({
    Sale: {type: String, required: true},
    Amount: Number,
    Description: String,
    SaleDate: {type: Date, required: true}
})



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