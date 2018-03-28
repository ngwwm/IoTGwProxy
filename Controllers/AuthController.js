// AuthController.js
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
//var User = require('../Models/User');

var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
//var config = require('../config');
var config = global.__config;

/*
router.post('/register', function(req, res) {
  
  var hashedPassword = bcrypt.hashSync(req.body.password, 8);
  
  User.create({
    name : req.body.name,
    email : req.body.email,
    password : hashedPassword
  },
  function (err, user) {
    if (err) return res.status(500).send("There was a problem registering the user.")
    // create a token
    var token = jwt.sign({ id: user._id }, config.secret, {
      expiresIn: 86400 // expires in 24 hours
    });
    res.status(200).send({ auth: true, token: token });
  }); 
});
*/
/*
router.get('/me', function(req, res) {
  var token = req.headers['x-access-token'];
  if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
  jwt.verify(token, config.secret, function(err, decoded) {
    if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    
    res.status(200).send(decoded);
  });
});
*/
router.post('/login', function(req, res) {

  console.log("api key:" + req.body.key);

  if (config.regkeys.includes(req.body.key)) {
    var token = jwt.sign({ uid: req.body.uid }, config.secret, {
      expiresIn: 1800 // expires in 30 minutes
    });
    console.log("token:" + token);
    res.status(200).send({ auth: true, token: token });    
  } else {
    return res.status(401).send('Not authorized.');
  }
});

// add this to the bottom of AuthController.js
module.exports = router;
