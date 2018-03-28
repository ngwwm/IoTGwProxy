var _ = require('lodash');
var asyncjs = require('async');
var nodeunit = require('nodeunit');

const config = require('./config');
const express = require('express');
const app = express() 

/* disable caching */
app.disable('etag');

global.__root     = __dirname + '/'; 
global.__config   = config; 

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization, X-Access-Token');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
    next();
};

app.use(allowCrossDomain);

app.get('/api', function (req, res) {
  res.set('Content-Type', 'application/json'); 
  res.status(200).send('{"message": "IoT Gateway Proxy API Version 1.0.0"}');
});

/* handle any request thats ends in /api/teams */
var GatewayController = require(__root + 'Controllers/GatewayController');
app.use('/api/gateway', GatewayController);


/*
var UserController = require(__root + 'user/UserController');
app.use('/api/users', UserController);
*/
var AuthController = require(__root + 'Controllers/AuthController');
app.use('/api/auth', AuthController);

/*
setInterval(pullCloudData, 5000);

function pullCloudData() {
  var request = require("request");

  var options = { 
    method: 'GET',
    url: 'http://geevpc1c.ddns.net:8088/api/gateway/data/bylastperiod',
    headers: { 'Cache-Control': 'no-cache' } 
  };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    console.log(response.headers.date);
    var data = JSON.parse(body); 
    console.log(data[0].data_id);
  });
}
*/

module.exports = app;
