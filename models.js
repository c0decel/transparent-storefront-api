const { default: mongoose, mongo } = require("mongoose");
const bcrypt = require('bcrypt');

const reviewSchema = mongoose.Schema({
    Rating: {type: Number, required: true},
    Username: {type: String, required: true},
    Content: {type: String, required: true}
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
    Tags: [{
        TagID: String,
        Name: String,
        Description: String
    }]
});

const userSchema = mongoose.Schema({
    Username: {type: String, required: true},
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
    hasBroom: {type: Boolean, default: false},
    isSponsor: {type: Boolean, default: false}
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
const User = mongoose.model('User', userSchema);
const Tag = mongoose.model('Tag', tagSchema);
const Expense = mongoose.model('Expense', expenseSchema);
const Sale = mongoose.model('Sale', saleSchema);
const validatePass = userSchema.methods.validatePass;

module.exports.Review = Review;
module.exports.Product = Product;
module.exports.User = User;
module.exports.Tag = Tag;
module.exports.Expense = Expense;
module.exports.Sale = Sale;