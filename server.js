// server.js

// init project
var express = require('express');
var app = express();
var request = require('request');
var mongodb = require('mongodb');

var APIKey = '?key=AIzaSyC8DsKUXrJLyQthtwmQU8KBgzqXFCLtMZc';
var motorID = '&cx=016127352331785859839:64sgtypqwjc';
var searchType = '&searchType=image';
var searchTerm = '&q=';
var qty = '&num=10';
var URL = 'https://www.googleapis.com/customsearch/v1' + APIKey + motorID + searchType + qty + searchTerm;

var mongoClient = mongodb.MongoClient();
var mongoURL = 'mongodb://maxi7587:maxi7587mlab@ds161860.mlab.com:61860/imgsearchabstractionlayerdb';

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

function searchParser (response) {
  var finalList = [];
  for (var x = 0; x < response.length; x++) {
    var actual = response[x];
    var item = {
      url: actual.link,
      snippet: actual.snippet,
      pageUrl: actual.image.contextLink
    }
    finalList.push(item);
  }
  return finalList;
}

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get("/recent", function (require, response) {
  var db = mongoClient.connect(mongoURL, function(err, db) {
    var collection = db.collection('recentSearch', function (err, collection) {
      var recentSearch = collection.find({}, {_id: 0}).sort({$natural: -1}).limit(5).toArray(function(err, items){
        response.send(items);
      });
    });
  });
});

app.get("/search/:data", function (req, res) {
  if (req.error) {
    res.send();
  }
  var data = req.params.data;
  var page = req.query.offset * 10 + 1;
  request(URL + data + '?start=' + page, function (error, response, body) {
    var db = mongoClient.connect(mongoURL, function(err, db) {
      if (err) {res.send('Error! Please try again later.')};
      var collection = db.collection('recentSearch');
      var includeRecent = {query: data, date: new Date(Date.now()).toLocaleString()};
      collection.insert(includeRecent);
      db.close;
    });
    if (JSON.parse(body).error) {
      res.send('Sorry! Daily limit exceeded, please try again tomorrow...');
    } else {
      var result = JSON.parse(body).items;
      res.send(searchParser(result));
      res.end;
    }
  });
});

app.use(function(err, req, res, next) {
    if(!err) return next();
    console.log("error!!!");
    res.send("Sorry, we are working to solve this error!");
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});