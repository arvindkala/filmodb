var mysql = require('mysql')
var config = require('./config.js');

var connection = mysql.createConnection({
        host: 'localhost',
        user: config.db_user,
        password: config.db_pass
    });

module.exports = connection