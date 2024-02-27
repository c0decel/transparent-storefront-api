const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');

const app = express();

const Models = require('./models.js');
let auth = require('./auth')(app);
const checkBroom = require('./appFunctions.js');
require('./passport');

const Expense = Models.Expense;
const Sale = Models.Sale;

const productRoutes = require('./productRoutes');
const tagRoutes = require('./tagRoutes');
const userRoutes = require('./userRoutes');
const reviewRoutes = require('./reviewRoutes');

require('dotenv').config();
const port = process.env.PORT || 8080;
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


//For live
const mongoURI = process.env.CONNECTION_URI;

//For local testing
//const mongoURI = 'mongodb://127.0.0.1:27017/Storefront-API';

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Failed to connect ', err);
  });

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
app.use('/products', productRoutes);

/**
 * Tag logic
 */
app.use('/tags', tagRoutes);

/**
 * User logic
 */
app.use('/users', userRoutes);

/**
 * Review logic
 */
app.use('/reviews', reviewRoutes);

/**
 * Basic user permissions
 */
//Get all expenses
app.get('/expenses', (res) => {
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
app.get('/sales', (res) => {
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
app.post('/expenses', passport.authenticate('jwt', { session: false }), checkBroom, (req, res) => {
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
app.post('/sales', passport.authenticate('jwt', { session: false }), checkBroom, (req, res) => {
    Sale.create(req.body)
    .then((newSale) => {
        res.status(201).json(newSale);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//For local testing
//app.listen(8080, () => {
//    console.log('Listening on port 8080.');
//    });

app.listen(port, '0.0.0.0',() => {
console.log('Listening on Port ' + port);
});
