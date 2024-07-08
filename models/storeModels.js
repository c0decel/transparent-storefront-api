const { default: mongoose, mongo } = require("mongoose");
const bcrypt = require('bcrypt');

/**
 * Product schema
 */
const productSchema = mongoose.Schema({
    ProductID: {
        type: String
    },
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
        required: false,
        default: 'No description.'
    },
    ProductImages: [{
        type: String,
        required: false
    }],
    Sales: {
        type: Number,
        required: false,
        default: 0
    },
    Stock: {
        type: Number,
        required: false,
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
        Name: {
            type: String,
            required: true
        },
        Description: {
            type: String,
            default: 'No description.'
        },
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
        Supplier: {
            type: String,
            default: 'None specified.'
        }
    }],
    Upcharge: {
        type: Number,
        required: false,
        default: 0
    }
    // Upcharge is a %
});

/**
 * Product review schema
 */
const reviewSchema = mongoose.Schema({
    ReviewID: {
        type: String
    },
    Rating: {
        type: Number,
        required: true
    },
    User: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
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
 * Supply schema
 */
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

/**
 * Tag schema
 */
const tagSchema = mongoose.Schema({
    TagID: String,
    Tag: {
        type: String,
        required: true
    },
    Description: {
        type: String,
        default: 'No description.'
    }
});

/**
 * Expense schema
 */
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

/**
 * Sale schema
 */
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

/**
 * Discount schema
 */
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

/**
 * Purchase schema
 */
const purchaseSchema = mongoose.Schema({
    ProductID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    PurchaseDate: {
        type: String,
        required: false
    },
    PurchaseTime: {
        type: String,
        required: false
    },
    Name: {
        type: String,
        required: true,
    },
    Image: {
        type: String,
        required: false
    },
    Price: {
        type: Number,
        required: true
    },
    Status: {
        type: String,
        enum: ['Active', 'Completed', 'Refunded'],
        default: 'Active'
    },
    DiscountUsed: {
        type: String,
        required: false
    }

});

const Product = mongoose.model('Product', productSchema);
const Review = mongoose.model('Review', reviewSchema);
const Supply = mongoose.model('Supply', supplySchema);
const Tag = mongoose.model('Tag', tagSchema);
const Expense = mongoose.model('Expense', expenseSchema);
const Sale = mongoose.model('Sale', saleSchema);
const Discount = mongoose.model('Discount', discountSchema);
const Purchase = mongoose.model('Purchase', purchaseSchema);

module.exports.Product = Product;
module.exports.Review = Review;
module.exports.Supply = Supply;
module.exports.Tag = Tag;
module.exports.Expense = Expense;
module.exports.Sale = Sale;
module.exports.Discount = Discount;
module.exports.Purchase = Purchase;