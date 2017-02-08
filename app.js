var express = require('express')
var app = express()
var bodyParser = require('body-parser');
var http = require('http');
var path    = require("path");
var mustache = require('mustache-express');
var replaceall = require('replaceall');

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

app.engine('html', mustache());
app.set('view engine', 'mustache')
app.set('views', __dirname + '/views');

invoke_db();

app.get('/', function (req, res) {
	res.render('index.html');
})

function invoke_db() {
	var connection = require('./db.js');
	var config = require('./config.js');
	connection.connect()
	connection.query( 'CREATE DATABASE IF NOT EXISTS ' + config.db_name, function (err, rows, fields) { })
	connection.query( 'USE ' + config.db_name, function (err, rows, fields) { })
	connection.query( 'CREATE TABLE IF NOT EXISTS '+ config.table_name+' (id int(11) auto_increment primary key, imdb_id varchar(10), email varchar(20), review varchar(200))', function (err, rows, fields) { })
}

app.post('/search', function (req, res ) {
	var config = require('./config.js');
    var imdb_listing_url = config.imdb_listing_api_url + req.body.query_string + '&api_key=' + config.imdb_api_key;

    http.get(imdb_listing_url, function(resp) {
    	var movie_lists = '';
			resp.on('data', function(chunk) {
		    movie_lists += chunk;
		});
		resp.on('end', function() {
			movie_lists = JSON.parse(movie_lists);
			movie_lists.data.results.titles.forEach(function(title, index, arr) {

				if( title.thumbnail.indexOf("nopicture") < 0 ) {
					replace_text = replaceall("32", "300", title.thumbnail);
					replace_text = replaceall("44", "400", replace_text);
					title.thumbnail = replace_text;
				}
			})
			res.render('index.html', {'body' : movie_lists });
		});
	});
})

app.post('/movie-details', function(req, res) {
	var config = require('./config.js');
	var imdb_details_url = config.imdb_detail_api_url + req.body.imdb_id + '?api_key=' + config.imdb_api_key;

	http.get(imdb_details_url, function(resp) {
    	var movie_details = '';
		resp.on('data', function(chunk) {
		    movie_details += chunk;
		});
		resp.on('end', function() {
			movie_details = JSON.parse(movie_details);
			if( "fail" == movie_details.status ) {
				console.log("something wrong in the request " + imdb_details_url)
			} else {
				res.status(200).json(movie_details.data);
			}
		});
	});
});

app.post('/save-comment', function(req, res) {
	var email = req.body.email;
	var review = req.body.review;
	var imdb_id = req.body.imdb_id;
	
	query = 'INSERT INTO dogether.reviews (imdb_id, email, review) VALUES ( "' + imdb_id + '", "'+ email + '", "'+ review + '" )';
	var connection = require('./db.js');
	connection.query( query, function (err, rows, fields) {
		if( err) {
			res.status(400).json(err.code);
		} else {
			res.status(200).json("Successfully submitted the review for the movie.")
		}
	})
});

app.listen(3000, function () {
      console.log('Example app listening on port 3000!')
})
