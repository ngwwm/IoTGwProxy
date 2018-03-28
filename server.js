var app   = require('./app');
var fs    = require('fs');
var http  = require('http');
var https = require('https');

const hostname = global.__config.server.bindhost;
const port     = global.__config.server.port;
const ssl_port = global.__config.server.ssl_port;

const options = {
  key: fs.readFileSync(global.__config.tls.key),
  cert: fs.readFileSync(global.__config.tls.cert)
};


http.createServer(app).listen(port, function() {
  console.log(`Server running at http://${hostname}:${port}`);
});
https.createServer(options, app).listen(ssl_port, function() {
  console.log(`Server running at https://${hostname}:${ssl_port}`);
});

//console.log(`Server running at http://${hostname}:${port}, https://${hostname}:${ssl_port}`);

/*
app.listen(port, hostname, 511, () => { 
  console.log(`Server running at http://${hostname}:${port}/`);
});
*/

/*
var _ = require('lodash');
var asyncjs = require('async');
var nodeunit = require('nodeunit');
var db = require('./db.js');

const express = require('express');
const app = express() 

const hostname = '127.0.0.1';
const port = 3000;
*/

/* disable caching */
/*
app.disable('etag');
*/

/* app.listen(port, [hostname], [backlog], [callback]) */
/*
app.listen(port, hostname, 511, () => { 
  console.log(`Server running at http://${hostname}:${port}/`);
});
*/
