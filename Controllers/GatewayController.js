var express = require('express');
var router = express.Router();
var team = require(__root + 'Models/Team');
var VerifyToken = require('./VerifyToken');
var bodyParser = require('body-parser');
var config = global.__config;
var http = require('https');
var fs = require('fs');
var moment = require('moment');

/* Make a request to Kafka Cluster */

function gwproxySave(rawdata, callback) {

  console.log('raw data:' + rawdata);
  console.log();

  var options = {
    //host: 'geevpc1b.ddns.net',
    //port: 8086,
    //path: '/topics/iot-ssltest1',
    host: config.kafka_rest.host,
    port: config.kafka_rest.port,
    path: config.kafka_rest.path, 
    headers: {
      'Content-Type': 'application/vnd.kafka.avro.v2+json',
      'Accept': 'application/vnd.kafka.v2+json'
    },
    method: 'POST',
    ca: [fs.readFileSync('/appl/geek/stage/tls/IoTRootCA-cert', {encoding: 'utf-8'})],
    key: fs.readFileSync('/appl/geek/stage/tls/geevpc1c/geevpc1c.key'),
    cert: fs.readFileSync('/appl/geek/stage/tls/geevpc1c/geevpc1c.crt')
  };

  var req = http.request(options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function () {
      var body = Buffer.concat(chunks);
      console.log(body.toString());
      callback();
    });
  });

  req.write(rawdata);
  req.end();
  
  req.on('error', function(err){
    console.log(err);
    callback(err);
  });
}

router.use(bodyParser.raw({ type: 'application/vnd.kafka.avro.v2+json' }));

router.post('/savenoauth', function (req, res) {	
   
   gwproxySave(req.body, function (err) {
      if (err) {
         res.send('Error Post Data to /api/gateway/save');
         res.status(400);
      } else {
         res.send('Post Data to /api/gateway/save');
         res.status(200);
      }
   });
});

router.post('/save', VerifyToken, function (req, res) {	

/*
   res.header('Access-Control-Allow-Origin', '*');
   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
   res.header('Access-Control-Allow-Credentials', true);
   res.header('Access-Control-Allow-Headers', 'Content-Type');
*/
   //console.log(req);
   //console.log(req.body);
   gwproxySave(req.body, function (err) {
      if (err) {
         res.send('Error Post Data to /api/gateway/save');
         res.status(400);
      } else {
         res.send('Post Data to /api/gateway/save');
         res.status(200);
      }
   });
});


/* Below is for demostrating the Cloud to Cloud Integration */

router.get('/data/bylastperiod', function (req, res) {
  var data = [
    {"data_id":32851,"gateway_ip":"10.0.0.2","gateway_id":"01:02:03:04","device_id":"05:06:07:08","device_type":"Testing",
     "jdata":"{\"PID\": \"Hello\", \"Battery\": 3, \"Voltage\": 1, \"Humidity\": 3, \"temperature\": 5, \"VoltageNormal\": 2, \"HumidityNormal\": 4, \"TemperatureSensorNormal\": 6}", "data_timestamp":moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss')},
    {"data_id":32856,"gateway_ip":"10.0.0.2","gateway_id":"01:02:03:04","device_id":"05:06:07:08","device_type":"device type",
     "jdata":"{\"systolic\": 130}", "data_timestamp":moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss')}
  ];
  res.set('Content-Type', 'application/json');
  res.status(200).send(data);
});

setInterval(pullCloudData, 60000);

function pullCloudData() {
  var request = require("request");

  var options = {
    method: 'GET',
    url: 'http://geevpc1c.ddns.net:8088/api/gateway/data/bylastperiod',
    headers: { 'Cache-Control': 'no-cache' }
  };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);

    var datain = JSON.parse(body);
    console.log('[' + response.headers.date + '] ' + datain.length + ' record(s) received.');

    var value_schema = "{\"type\": \"record\", \"name\": \"devicedata\", \"fields\": [{\"name\": \"gateway_id\", \"type\": \"string\"}, {\"name\": \"gateway_ip\", \"type\": \"string\"}, {\"name\": \"device_id\", \"type\": \"string\"}, {\"name\": \"device_type\", \"type\": \"string\"}, {\"name\": \"jdata\", \"type\": \"string\"}, {\"name\": \"data_timestamp\", \"type\": \"string\"}]}";

    var data = {"records": [{"value": {"gateway_id":"B8:27:EB:F7:52:10", "gateway_ip":"10.0.0.1", "device_id":"B0:49:5F:02:6F:B5", "device_type":"blood_pressure", "jdata":"{}", "data_timestamp":"2018-03-20 10:41:59"}}]};

    var records = [];

    for (var i = 0; i < datain.length; i++) {
      records[i] = {
         "value":{
            "gateway_id" : datain[i].gateway_id,
            "gateway_ip" : datain[i].gateway_ip,
            "device_id" : datain[i].device_id,
            "device_type" : datain[i].device_type,
            "jdata" : datain[i].jdata,
            "data_timestamp" : datain[i].data_timestamp
         }
      }
    }
   
    var jdata = { value_schema, records };
 
    gwproxySave(JSON.stringify(jdata), function (err) {
      if (err) {
         console.log('pullCloudData: Post Data Error');
      } else {
         console.log('pullCloudData: Post Data Success');
      }
    });

  });
}

module.exports = router;
