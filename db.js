global.__dbcontext = require('./lib/jdbc-common');

__dbcontext.mssqldb(function(err, mssqldb) {
      if (err) {
        console.log(err);
      } else {
        __dbcontext.select(mssqldb, "select @@version as version;", function(err, resultset) {
          if (err) {
            console.log(err);
          } else {
            // Convert the result set to an object array.
            resultset.toObjArray(function(err, results) {
              if (results.length >0) {
                console.log("Data Source Initialized: " + results[0].version);
              }
            });
          }
        });
      }
});
