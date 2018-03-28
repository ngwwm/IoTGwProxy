var JDBC = require('jdbc');
var jinst = require('jdbc/lib/jinst');
var config = require('../config');

if (!jinst.isJvmCreated()) {
  jinst.addOption("-Xrs");
  jinst.setupClasspath(['./drivers/sqljdbc_6.0/enu/jre7/sqljdbc41.jar', './drivers/mysql-connector-java-5.1.45-bin.jar']);
}

var mysqldb = new JDBC({
  url: 'jdbc:mysql://'+config.mysql.dbhost+'/'+config.mysql.dbname+'?useSSL=false',
  minpoolsize: 5,
  maxpoolsize: 10,
  properties: {
    user : config.mysql.dbusr,
    password: config.mysql.dbpwd 
  }
});

var mssqldb = new JDBC({
  url: 'jdbc:sqlserver://'+config.mssql.dbhost+';databaseName='+config.mssql.dbname+';integratedSecurity=false;',
  minpoolsize: 5,
  maxpoolsize: 10,
  properties: {
    user : config.mssql.dbusr,
    password: config.mssql.dbpwd
  }
});
var mysqlInit = false;
var mssqlInit = false;

function reserve(db, callback) {
  db.reserve(function(err, connobj) {
    if (err) {
      return callback(err);
    } else {
      return callback(null, connobj, connobj.conn);
    }
  });
};

function release(db, connobj, err, result, callback) {
  db.release(connobj, function(e) {
    if (err) {
      return callback(err);
    } else {
      return callback(null, result);
    }
  });
};

exports.mssqldb = function(callback) {
  if (!mssqlInit) {
    mssqldb.initialize(function(err) {
      if (err) {
        return callback(err);
      } else {
        mssqlInit = true;
        return callback(null, mssqldb);
      }
    });
  } else {
    return callback(null, mssqldb);
  }
};

exports.mysqldb = function(callback) {
  if (!mysqlInit) {
    mysqldb.initialize(function(err) {
      if (err) {
        return callback(err);
      } else {
        mysqlInit = true;
        return callback(null, mysqldb);
      }
    });
  } else {
    return callback(null, mysqldb);
  }
};

exports.prepare = function(db, sql, callback) {
  reserve(db, function(err, connobj, conn) {
    conn.prepareStatement(sql, function(err, preparedstatement) {
      release(db, connobj, err, preparedstatement, callback);
    });
  });
};

exports.prepareCall = function(db, sql, callback) {
  reserve(db, function(err, connobj, conn) {
    conn.prepareCall(sql, function(err, callablestatement) {
      release(db, connobj, err, callablestatement, callback);
    });
  });
};

exports.select = function(db, sql, callback) {
  reserve(db, function(err, connobj, conn) {
    conn.createStatement(function(err, statement) {
      if (err) {
        release(db, connobj, err, null, callback);
      } else {
        statement.executeQuery(sql, function(err, result) {
          release(db, connobj, err, result, callback);
        });
      }
    });
  });
};

exports.update = function(db, sql, callback) {
  reserve(db, function(err, connobj, conn) {
    conn.createStatement(function(err, statement) {
      if (err) {
        release(db, connobj, err, null, callback);
      } else {
        statement.executeUpdate(sql, function(err, result) {
          release(db, connobj, err, result, callback);
        });
      }
    });
  });
};

exports.tableexists = function(db, catalog, schema, name, callback) {
  reserve(db, function(err, connobj, conn) {
    conn.getMetaData(function(err, metadata) {
      if (err) {
        release(db, connobj, err, null, callback);
      } else {
        metadata.getTables(catalog, schema, name, null, function(err, resultset) {
          if (err) {
            release(db, connobj, err, null, callback);
          } else {
            resultset.toObjArray(function(err, results) {
              release(db, connobj, err, false, callback);
            });
          }
        });
      }
    });
  });
};

exports.metadata = function(db, callback) {
  reserve(db, function(err, connobj, conn) {
    conn.getMetaData(function(err, metadata) {
      release(db, connobj, err, metadata, callback);
    });
  });
};
