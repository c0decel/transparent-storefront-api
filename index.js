const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');

const app = express();

const Models = require('./models.js');


const productRoutes = require('./productRoutes');
const supplyRoutes = require('./supplyRoutes');
const tagRoutes = require('./tagRoutes');
const userRoutes = require('./userRoutes');
const reviewRoutes = require('./reviewRoutes');
const expenseRoutes = require('./expenseRoutes');
const salesRoutes = require('./salesRoutes');

require('dotenv').config();

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

require('./passport');
let auth = require('./auth')(app);
const checkBroom = require('./appFunctions.js');


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
 * Supply logic
 */
app.use('/supplies', supplyRoutes);

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
 * Sales logic
 */
app.use('/sales', salesRoutes);

/**
 * Expense logic
 */
app.use('/expenses', expenseRoutes);


//For local testing
//app.listen(8080, () => {
 //   console.log('Listening on port 8080.');
  //  });

const port = process.env.PORT || 8080;

app.listen(port, '0.0.0.0',() => {
console.log('Listening on Port ' + port);
});
