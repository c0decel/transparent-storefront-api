require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');

const app = express();

const Models = require('./models.js');
const Expense = Models.Expense;
const Sale = Models.Sale;



const cors = require('cors');
let allowedOrigins = ['http://localhost:8080', 'http://localhost:4200', 'https://transparent-storefront-api-7a631c0a8a92.herokuapp.com'];

app.use(cors({
    origin: (origin, callback) => {
      if(!origin) return callback(null, true);
      if(allowedOrigins.indexOf(origin) === -1){
        let message = 'The CORS policy for this application does not allow access from origin ' + origin;
        return callback(new Error(message), false);
      }
      return callback(null, true);
    }
  }));

// Set up middleware
app.use(morgan('common'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let auth = require('./auth')(app);

const passport = require('passport');
require('./passport');

//For live
//const mongoURI = process.env.CONNECTION_URI;

//For local testing
const mongoURI = 'mongodb://127.0.0.1:27017/Storefront-API';

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Failed to connect ', err);
  });

const port = process.env.PORT || 8080;

//app.listen(port, '0.0.0.0',() => {
//console.log('Listening on Port ' + port);
//});

//For local testing
app.listen(8080, () => {
 console.log('Listening on port 8080.');
})

//Default page
app.get('/', (req, res) => {
    res.send('Transparent Storefront API');
});

//Get documentation
app.get('/documentation', (req, res) => {
    res.sendFile('public/documentation.html', {root: __dirname});
});

/**
 * Product logic
 */
const productRoutes = require('./productRoutes');
app.use('/products', productRoutes);

/**
 * Tag logic
 */
const tagRoutes = require('./tagRoutes');
app.use('/tags', tagRoutes);

/**
 * User logic
 */
const userRoutes = require('./userRoutes');
app.use('/users', userRoutes);

/**
 * Review logic
 */
const reviewRoutes = require('./reviewRoutes');
app.use('/reviews', reviewRoutes);

/**
 * Basic user permissions
 */
//Get all expenses
app.get('/expenses', (req, res) => {
    Expense.find()
    .then((Expense) => {
        res.status(201).json(Expense);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Get all sales
app.get('/sales', (req, res) => {
    Sale.find()
    .then((Sale) => {
        res.status(201).json(Sale);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

/**
 * Admin permissions
 */
//Log an expense
app.post('/expenses', passport.authenticate('jwt', { session: false }), (req, res) => {
    if (!req.user.hasBroom) {
        return res.status(403).send('Mods ONLY.');
    }

    Expense.create(req.body)
    .then((newExpense) => {
        res.status(201).json(newExpense);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Log a sale
app.post('/sales', passport.authenticate('jwt', { session: false }), (req, res) => {
    if (!req.user.hasBroom) {
        return res.status(403).send('Mods ONLY.');
    }

    Sale.create(req.body)
    .then((newSale) => {
        res.status(201).json(newSale);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});
