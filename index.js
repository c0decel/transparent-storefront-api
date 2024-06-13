const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');

const app = express();

const Models = require('./models.js');

const productRoutes = require('./routes/productRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const supplyRoutes = require('./routes/supplyRoutes.js');
const reviewRoutes = require('./routes/reviewRoutes.js');
const expenseRoutes = require('./routes/expenseRoutes.js');
const salesRoutes = require('./routes/salesRoutes.js');
const tagRoutes = require('./routes/tagRoutes.js');
const forumRoutes = require('./routes/threadRoutes.js');
const postRoutes = require('./routes/postRoutes.js');
const banRoutes = require('./routes/banRoutes.js');
const paymentRoutes = require('./routes/paymentRoutes.js');



require('dotenv').config();

let allowedOrigins = ['http://localhost:8080', 'http://localhost:4200', 'http://localhost:1234', 'http://localhost:5006', 'https://transparent-storefront-api-7a631c0a8a92.herokuapp.com'];

app.use(cors({
    origin: (origin, callback) => {
      if(!origin) return callback(null, true);
      if(allowedOrigins.indexOf(origin) === -1){
        let message = `The CORS policy for this application does not allow access from origin: ${origin}`;
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
const checkBroom = require('./utils/appFunctions.js');


//Replace with your Mongo API key
const mongoURI = process.env.MONGO_API_KEY;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error(`Failed to connect: ${err}`);
  });

//Default page
app.get('/', (req, res) => {
    res.send(`Transparent Storefront API`);
});

//Get product documentation
app.get('/product-documentation', (req, res) => {
    res.sendFile('public/productDocumentation.html', {root: __dirname});
});

//Get forum documentation
app.get('/forum-documentation', (req, res) => {
  res.sendFile('public/forumDocumentation.html', {root: __dirname});
});

//Get user documentation
app.get('/user-documentation', (req, res) => {
  res.sendFile('public/userDocumentation.html', {root: __dirname});
});

//Get financial documentation
app.get('/financial-documentation', (req, res) => {
  res.sendFile('public/financialDocumentation.html', {root: __dirname});
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

/**
 * Forum logic
 */
app.use('/threads', forumRoutes);

/**
 * Post logic
 */
app.use('/posts', postRoutes);

/**
 * Ban logic
 */
app.use('/bans', banRoutes);

/**
 * Payment logic
 */
app.use('/payment', paymentRoutes);


//Port to listen on
const port = process.env.PORT || 8080;

app.listen(port, '0.0.0.0',() => {
console.log('Listening on Port ' + port);
});
