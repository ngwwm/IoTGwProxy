var express = require('express');
var router = express.Router();
var team = require(__root + 'Models/Team');
var VerifyToken = require('./VerifyToken');
var bodyParser = require('body-parser');
var config = global.__config;
var http = require('http');
var https = require('https');
var fs = require('fs');
var moment = require('moment');
var request = require("request");

var iotwebapp_token;
/* Make a request to Kafka Cluster */

function gwproxySave(rawdata, callback) {

  //console.log('['+ moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss') + '] DEBUG raw data:' + rawdata);

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
    method: 'POST'
//,
//    ca: [fs.readFileSync('/appl/geek/stage/tls/IoTRootCA-cert', {encoding: 'utf-8'})],
//    key: fs.readFileSync('/appl/geek/stage/tls/geevpc1c/geevpc1c.key'),
//    cert: fs.readFileSync('/appl/geek/stage/tls/geevpc1c/geevpc1c.crt')
  };

  var req = http.request(options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function () {
      var body = Buffer.concat(chunks);
      //console.log(body.toString());
      callback();
    });
  });

  req.write(rawdata);
  req.end();
  
  req.on('error', function(err){
    console.log('['+ moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss') + '] ERROR ' + err);
    callback(err);
  });
}

function gwproxySaveIoTWebApp(rawdata, callback) {
  var options = {
    url: 'http://geevpc1b.ddns.net:8080/platform/v2/api/gateway/login',
    headers: {
       'Cache-Control': 'no-cache',
       'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
    form: { gateway_id: 'B8:27:EB:F7:52:10' } };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);

    console.log(body);

    if (body) {
      var jdata = JSON.parse(body);
      if (jdata.length > 0) {
        iotwebapp_token = jdata[0].token;
        console.log('['+ moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss') + '] DEBUG "IoTWebapp Server login success, token = ' + iotwebapp_token);
        gwproxySaveIotWebAppSave(rawdata, callback);
      }
    }
  });
}

function gwproxySaveIotWebAppSave(records, callback){

 var record;

 for ( r in records) {
  record = records[r].value;

  console.log("record = " + JSON.stringify(record));

  var options = {
    url: 'http://geevpc1b.ddns.net:8080/platform/v2/api/gateway/save',
    headers: {
       'Authorization': 'Bearer ' + iotwebapp_token,
       'Cache-Control': 'no-cache',
       'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
    form: {
      gateway_id: record.gateway_id,
      device_id: record.device_id,
      deviceType: record.device_type,
      dataResult: record.jdata,
      dataTime: record.data_timestamp
    }
  };
  
  request(options, function (error, response, body) {
    if (error) throw new Error(error);

    console.log(body);

  });
 } /* for loop */
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
/*
 * the endpoint /data/bylastperiod will always return 2 records in json formta.
 *
 */
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

/* try to pull data every ms defined by poll_interval_ms in config.js */
try {
  /* try to parse the offsets.json file, in case of any error, we can catch it. */
  var dummy = JSON.parse(fs.readFileSync(__root+'/data/offsets.json', 'utf8'));

  setInterval(pullCloudDataHeartisansMain, config.vendor_cloud.heartisans.poll_interval_ms);

  //setInterval(pullDummyCloudData, 60000);
} catch (error) {
  console.error(error);
  console.log("Error reading data from offsets.json. Pull Cloud Data is disabled.");
}


function pullCloudDataHeartisansMain() {
  try {
    var jobj = JSON.parse(fs.readFileSync(__root+'/data/offsets.json', 'utf8'));

    var obj = jobj.heartisans;
    for (var key in obj) {
      pullCloudDataHeartisans(key, obj[key]);
    }
    //fs.writeFileSync(__root+'/data/offsets.json', JSON.stringify(jobj, null, 2));
  } 
  catch(error) {
    console.error(error);
  }
}

function pullCloudDataHeartisans(userId, objUser) {
  var request = require("request");
  var obj = JSON.parse(fs.readFileSync(__root+'/data/heartisans/' + userId + '.json', 'utf8'));
  
  var options = {
    method: 'GET',
    /*url: 'https://us-central1-plucky-haven-128906.cloudfunctions.net/rawData/'+userId+'/measurements?startTime='+offset,*/
    url: config.vendor_cloud.heartisans.apiurl+'/rawData/'+userId+'/measurements?startTime='+obj.offset,
    headers: { 'Cache-Control': 'no-cache' }
  };

  console.log('['+ moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss') + '] DEBUG Heartisans url ('+objUser.patientid+'): ' + options.url);

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    console.log('['+ moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss') + '] DEBUG Response body from Vendor API ('+objUser.patientid+'): '+body);
    
   try {
    var datain = JSON.parse(body);
    var meas = datain.measurements;

    var value_schema = "{\"type\": \"record\", \"name\": \"devicedata\", \"fields\": [{\"name\": \"gateway_id\", \"type\": \"string\"}, {\"name\": \"gateway_ip\", \"type\": \"string\"}, {\"name\": \"device_id\", \"type\": \"string\"}, {\"name\": \"device_type\", \"type\": \"string\"}, {\"name\": \"jdata\", \"type\": \"string\"}, {\"name\": \"data_timestamp\", \"type\": \"string\"}]}";

/*
    var data = {"records": [{"value": {"gateway_id":"B8:27:EB:F7:52:10", "gateway_ip":"10.0.0.1", "device_id":"B0:49:5F:02:6F:B5", "device_type":"blood_pressure", "jdata":"{}", "data_timestamp":"2018-03-20 10:41:59"}}]};
*/

    var records = [];
    var cnt = 0;
    var new_offset = 0;
    for (var key in meas) {
      if (meas[key].sys < 255) {
        records[cnt] = {
         "value":{
            "gateway_id" : 'heartisans_cloud',
            "gateway_ip" : 'heartisans_cloud',
            "device_id" : objUser.serial,
            "device_type" : objUser.device_type,
            "jdata" : JSON.stringify({"systolic": meas[key].sys, "diastolic": meas[key].dia, "patientid": objUser.patientid, "pulserate": meas[key].hr}),
            "data_timestamp" : moment(meas[key].takenAt).utcOffset(8).format('YYYY-MM-DD HH:mm:ss')
          }
        }
        /*console.log(records[cnt]);*/
        new_offset = parseInt(key); 
      } else {
        console.log('['+ moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss') + '] ERROR Invalid Data rejected ('+objUser.patientid+'): ' + JSON.stringify({"systolic": meas[key].sys, "diastolic": meas[key].dia, "patientid": objUser.patientid, "pulserate": meas[key].hr}));
      }
      cnt++;
    }
    /* now we have the new offset */
    /*console.log('[' + response.headers.date + '] ' + cnt  + ' data received.');*/
    console.log('['+ moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss') + '] INFO Response Headers Date ('+objUser.patientid+'): ' + response.headers.date + ',  No. of record(s) received: ['+cnt+']');

    if (new_offset > obj.offset) {
      new_offset += 1;
      /*fs.writeFileSync(__root+'/data/heartisans/' + userId + '.json', '{"offset": ' + new_offset + '}');*/
      fs.writeFile(__root+'/data/heartisans/' + userId + '.json', '{"offset": ' + new_offset + '}', (err) => {
        if (err)
          console.log('['+ moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss') + '] ERROR Offset for [' + userId + '] cannot be updated: ' + err);
      });

      var jdata = { value_schema, records };
      console.log('['+ moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss') + '] DEBUG Data to be posted ('+objUser.patientid+'): ' + JSON.stringify(jdata));
      /* Let's try to save to Zetakey webapp */
      gwproxySaveIoTWebApp(records, function (err) {
        if (err) {
         console.log('['+ moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss') + '] ERROR pullCloudDataHeartisans ('+objUser.patientid+'): Post Data Error ' + err);
        } else {
         console.log('['+ moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss') + '] INFO pullCloudDataHeartisans ('+objUser.patientid+'): Post Data to IoT WebApp Successfully');
        }
      });

      gwproxySave(JSON.stringify(jdata), function (err) {
        if (err) {
         console.log('['+ moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss') + '] ERROR pullCloudDataHeartisans ('+objUser.patientid+'): Post Data Error ' + err);
        } else {
         console.log('['+ moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss') + '] INFO pullCloudDataHeartisans ('+objUser.patientid+'): Post Data Successfully');
        }
      });
    }
   } catch (err) {
     console.log('['+ moment().utcOffset(8).format('YYYY-MM-DD HH:mm:ss') + '] ERROR ('+objUser.patientid+'): ' + err);
   }
  });
}

/* Dummy Function */
function pullDummyCloudData() {

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

/*
    var data = {"records": [{"value": {"gateway_id":"B8:27:EB:F7:52:10", "gateway_ip":"10.0.0.1", "device_id":"B0:49:5F:02:6F:B5", "device_type":"blood_pressure", "jdata":"{}", "data_timestamp":"2018-03-20 10:41:59"}}]};
*/
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
         console.log('pullCloudData: Post Data Successfully');
      }
    });

  });
}

module.exports = router;
