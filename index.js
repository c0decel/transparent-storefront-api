require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');

const app = express();
const router = express.Router();

const Models = require('./models.js');
const Product = Models.Product;
const User = Models.User;

// Set up middleware
app.use(morgan('common'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let auth = require('./auth')(app);

const passport = require('passport');
require('./passport');

const mongoURI = process.env.CONNECTION_URI;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('connected to mongodb');
  })
  .catch((err) => {
    console.error('failed to connect :(', err);
  });

  const port = process.env.PORT || 8080;
  app.listen(port, '0.0.0.0',() => {
    console.log('Listening on Port ' + port);
 });

//  app.listen(8080, () => {
//   console.log('Listening on port 8080.');
//})

app.get('/', (req, res) => {
    res.send('Transparent Storefront API');
});

const cors = require('cors');
let allowedOrigins = ['http://localhost:8080', 'https://transparent-storefront-api-7a631c0a8a92.herokuapp.com'];

app.use(cors({
    origin: (origin, callback) => {
      if(!origin) return callback(null, true);
      if(allowedOrigins.indexOf(origin) === -1){
        let message = 'The CORS policy for this application does not allow access from origin ' + origin;
        return callback(new Error(message ), false);
      }
      return callback(null, true);
    }
  }));


//Get all products
app.get('/products', (req, res) => {
    Product.find()
    .then((Product) => {
        res.status(201).json(Product);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Get one product
app.get('/products/:Name', (req, res) => {
    Product.findOne({ Name: req.params.Name })
    .then((Product) => {
        if (!Product) {
            return res.status(404).send('Product does not exist.');
        }
        res.json(Product);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Upload new product
app.post('/products', passport.authenticate('jwt', { session: false }), (req, res) => {
    Product.findOne({ Name: req.body.Name })
    .then((existingProduct) => {
        if (existingProduct) {
            return res.status(400).send(req.body.Name + ' already exists.');
        } else {
            Product.create(req.body)
            .then((newProduct) => {
                res.status(201).json(newProduct)
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err)
            })
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Delete product
app.delete('/products/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
    Product.findOneAndDelete({ Name: req.params.Name })
    .then((existingProduct) => {
        if (!existingProduct) {
            res.status(404).send(req.params.Name + ' does not exist.')
        } else {
            res.status(200).send(req.params.Name + ' deleted.')
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Get all users
app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
    User.find()
    .then((User) => {
        res.status(201).json(User);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Get one user
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
    User.findOne({ Username: req.params.Username })
    .then((User) => {
        if (!User) {
            return res.status(404).send('User does not exist.');
        }
        res.json(User);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Upload new user
app.post('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
    User.findOne({ Username: req.body.Username })
    .then((existingUser) => {
        if (existingUser) {
            return res.status(400).send(req.body.Username + ' already exists.');
        } else {
            User.create(req.body)
            .then((newUser) => {
                res.status(201).json(newUser)
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err)
            })
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Delete user
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
    User.findOneAndDelete({ Username: req.body.Username })
    .then((existingUser) => {
        if (!existingUser) {
            res.status(404).send(req.params.Username + ' does not exist.')
        } else {
            res.status(200).send(req.params.Username + ' deleted.')
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});
