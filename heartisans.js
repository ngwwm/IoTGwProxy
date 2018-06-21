var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var http = require('https');
var fs = require('fs');
var moment = require('moment');

pullCloudData('cuIqUA62fkQVKJilZBYu91Hr9GV2','1524745984');

var now = moment();

console.log(now+ ' : ' + now.utcOffset(8).format('YYYY-MM-DD HH:mm:ss'));
function pullCloudData(userId, offset) {
  var request = require("request");

  var options = {
    method: 'GET',
    url: 'https://us-central1-plucky-haven-128906.cloudfunctions.net/rawData/'+userId+'/measurements?startTime='+offset,
    headers: { 'Cache-Control': 'no-cache' }
  };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    console.log(body);

    var datain = JSON.parse(body);
    var meas = datain.measurements;

    console.log('[' + response.headers.date + '] data received.');
    console.log('*****************************************');

    var value_schema = "{\"type\": \"record\", \"name\": \"devicedata\", \"fields\": [{\"name\": \"gateway_id\", \"type\": \"string\"}, {\"name\": \"gateway_ip\", \"type\": \"string\"}, {\"name\": \"device_id\", \"type\": \"string\"}, {\"name\": \"device_type\", \"type\": \"string\"}, {\"name\": \"jdata\", \"type\": \"string\"}, {\"name\": \"data_timestamp\", \"type\": \"string\"}]}";

/*
    var data = {"records": [{"value": {"gateway_id":"B8:27:EB:F7:52:10", "gateway_ip":"10.0.0.1", "device_id":"B0:49:5F:02:6F:B5", "device_type":"blood_pressure", "jdata":"{}", "data_timestamp":"2018-03-20 10:41:59"}}]};
*/

    var records = [];
    var cnt = 0;
    for (var key in meas) {
      console.log('key : ' + key + ' : ' + moment.unix(key).format('YYYY-MM-DD HH:mm:ss'));
      console.log('takenAt : ' + meas[key].takenAt + ' : ' + moment(meas[key].takenAt).utcOffset(8).format('YYYY-MM-DD HH:mm:ss'));

      records[cnt] = {
         "value":{
            "gateway_id" : '',
            "gateway_ip" : '',
            "device_id" : '',
            "device_type" : 'watch',
            "jdata" : {"systolic": meas[key].sys, "diastolic": meas[key].dia, "patientid": 1234, "pulserate": meas[key].hr},
            "data_timestamp" : moment(meas[key].takenAt).utcOffset(8).format('YYYY-MM-DD HH:mm:ss')
         }
      }
      cnt++;
    }
    console.log('*****************************************');

    var jdata = { value_schema, records };
    console.log(JSON.stringify(jdata)); 
/*
    gwproxySave(JSON.stringify(jdata), function (err) {
      if (err) {
         console.log('pullCloudData: Post Data Error');
      } else {
         console.log('pullCloudData: Post Data Success');
      }
    });
*/
  });
}

