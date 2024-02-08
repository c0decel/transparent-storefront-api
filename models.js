const { default: mongoose, mongo } = require("mongoose");

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
    Image: {type: String, required: true},
    Sales: {type: Number, default: 0},
    Stock: {type: Number, default: 0},
    Reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review'}]
});

const userSchema = mongoose.Schema({
    Username: {type: String, required: true},
    Password: {type: String, required: true},
    Email: {type: String, required: true},
    Birthday: {type: Date, required: true},
    Cart: { type: Array, default: []},
    Wishlist: {type: Array, default: []},
    Purchases: [{
        ProductID: String,
        PurchaseDate: Date
    }],
    Reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review'}],
    hasBroom: {type: Boolean, default: false}
})

const Review = mongoose.model('Review', reviewSchema);
const Product = mongoose.model('Product', productSchema);
const User = mongoose.model('User', userSchema);

module.exports.Review = Review;
module.exports.Product = Product;
module.exports.User = User;