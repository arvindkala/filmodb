var mysql = require('mysql')
var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'bigdecision'
    });

module.exports = connection