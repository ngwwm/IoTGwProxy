module.exports = { 
  secret : 'secert',
  mysql : {
    dbhost: 'host:port',
    dbname: 'test',
    dbusr: 'user',
    dbpwd: 'password' 
  },
  mssql : {
    dbhost: 'host:port',
    dbname: 'test',
    dbusr: 'user',
    dbpwd: 'password' 
  },
  server: {
    bindhost: 'geevpc1c',
    port: 8088,
    ssl_port: 8089
  },
  regkeys: ['key1', 'key2'],
  kafka_rest: {
    host: 'hostname', 
    port: 8086, 
    path: '/topics/topic_name' 
  },
  tls: {
    key: '/.../tls/geevpc1c.key', 
    cert: '/.../tls/geevpc1c.crt' 
  }
};
