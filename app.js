var express = require('express')
var app = express()
var bodyParser = require('body-parser');
var http = require('http');
var path    = require("path");
var mustache = require('mustache-express');
var replace = require('replace');
var replaceall = require('replaceall');

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

app.engine('html', mustache());
app.set('view engine', 'mustache')
app.set('views', __dirname + '/views'); 

var connection = require('./db.js');

app.get('/', function (req, res) {
	res.render('index.html');
})

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

app.listen(3000, function () {
      console.log('Example app listening on port 3000!')
})
