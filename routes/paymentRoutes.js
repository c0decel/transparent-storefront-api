const express = require('express');
const router = express.Router();
const { formatDate, formatTime } = require('./../utils/dateUtils.js');

//Models
const forumModels = require('../models/forumModels.js');
const userModels = require('../models/userModels.js');
const storeModels = require('../models/storeModels.js');

//User models
const User = userModels.User;
const Notification = userModels.Notification;

//Store models
const Product = storeModels.Product;
const Sale = storeModels.Sale;
const Purchase = storeModels.Purchase;
const Discount = storeModels.Discount;


//Replace with Stripe secret key
const stripe = require('stripe')(process.env.STRIPE_PRIV_KEY);

const passport = require('passport');
const checkBroom = require('../utils/appFunctions.js');
require('../passport.js');

//Get all purchases
router.get('/', (req, res) => {
    Purchase.find()
    .then((Purchase) => {
        res.status(201).json(Purchase);
    })
    .catch((err) => {
        console.error(`Error fetching purchases: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});

//Get one purchase
router.get('/all/:id', (req, res) => {
    Purchase.findOne(req.params.id)
    .then((Purchase) => {
        if (!Purchase) {
            return res.status(404).send(`Purchase not found.`);
        }
        res.json({Purchase});
    })
    .catch((err) => {
        console.error(`Error fetching purchase: ${err.toString()}`);
        res.status(500).send(`Error: ${err.toString()}`);
    });
});

/**
 * Logged in user permissions
 */
//Checkout cart
router.post('/create-checkout-session', passport.authenticate('jwt', {session: false}), async (req, res) => {
    const {token, UserID, ProductID, successUrl, cancelUrl, discountCode} = req.body;

    try {
        const product = await Product.findById(ProductID);
        const user = await User.findById(UserID);
        let finalPrice = 0;

        if (discountCode) {
            const discount = await Discount.findOne({ discountCode });

             if (discount) {
                if (discount.Type === 'Dollar' && discount.Amount < product.Price) {
                    finalPrice = product.Price - discount.Amount;
                    finalPrice = parseFloat(finalPrice).toFixed(2);

                } else if (discount.Type === 'Percent'){
                    finalPrice = product.Price - ((discount.Amount / product.Price) * 100);
                    finalPrice = parseFloat(finalPrice).toFixed(2);
                } else {
                    finalPrice = product.Price;
                }
            }
        }
        const saleLabel = product.Name;

        const currentDate = new Date();
        const formattedDate = formatDate(currentDate);
        const formattedTime = formatTime(currentDate);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (product.Stock <= 0) {
            return res.status(403).send(`Product out of stock.`);
        } else {
            const priceInCents = finalPrice * 100;

            const price = await stripe.prices.create({
                unit_amount: priceInCents,
                currency: 'usd',
                product_data: {
                    name: product.Name,
                },
            });

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: price.id,
                        quantity: 1
                    },
                ],
                mode: 'payment',
                success_url: successUrl,
                cancel_url: cancelUrl,
                shipping_address_collection: {
                    allowed_countries: ['US', 'GB', 'CA'],
            },
            });



            console.log(session.payment_intent)

            product.Stock--;
            product.Sales++;

            await product.save();

            const sale = await Sale.create({
                Sale: 'Product sale',
                Amount: product.Price,
                Description: `Sold one ${saleLabel}`,
                SaleDate: formattedDate,
                SaleTime: formattedTime
            });

            await sale.save();

            const purchase = await Purchase.create({
                ProductID: ProductID,
                PurchaseDate: formattedDate,
                PurchaseTime: formattedTime,
                Name: product.Name,
                Image: product.Image,
                Price: product.Price,
                Status: 'Active',
            });

            await purchase.save();

            const purchaseNotif = await Notification.create({
                Type: 'NewPurchase',
                PurchaseLink: purchase._id,
                ProductLink: ProductID,
                NotifDate: formattedDate,
                NotifTime: formattedTime
            });

            await purchaseNotif.save();

            user.Notifications.push(purchaseNotif);

            user.Purchases.push(purchase);

            user.Cart.pull({ProductID: ProductID});

            await user.save();

            res.json({ id: session.id, purchaseID: purchase._id });
        }  

    } catch(err) {
        res.status(500).send(`Error: ${err.toString()}`);
    }
});

module.exports = router;

