var express = require('express');
var router = express.Router();
var mongo = require('mongodb').MongoClient();
//var mongoUrl = "mongodb://localhost:27017/imagesearchapi";
var mongoUrl = "mongodb://bingjson:bingjson@ds147034.mlab.com:47034/heroku_p7qq60lz"
var tiny = require('tiny-json-http');
require('dotenv').config();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Bing Image Search Abstraction Layer' });
});

router.get('/search/:searchTerm', function(req, res) {
  mongo.connect(mongoUrl, function(err, db) {
    if (err) throw err;
    console.log("Connected!");

    var imagesearchdb = db.collection('imagesearchdb');

    var searchTerm = req.params.searchTerm;
    var offset = req.query.offset;

    var url = "https://api.cognitive.microsoft.com/bing/v5.0/images/search?q=" +
      encodeURIComponent(searchTerm) +
      "&count=1" +
      "&offset=" +
      offset +
      "&safeSearch";
    var headers = { "Ocp-Apim-Subscription-Key": process.env.BING_API_KEY } 

    tiny.get({
      url: url, 
      headers: headers      
    }, function (err, result) {
      if (err) throw err;
      console.log("Success!");
      var unixTime = new Date().toString();
      console.log(unixTime)
      var url = result.body.value[0].webSearchUrl;
      var snippets = result.body.value[0].name;
      var thumbnail = result.body.value[0].thumbnailUrl;
      var context = result.body.value[0].hostPageDisplayUrl; 
      res.json({ page: offset, url: url, snippets: snippets, thumbnail: thumbnail, context: context });
      imagesearchdb.insert({ term: searchTerm, time: unixTime }, function() {
        db.close();
      });
    });
  })
});

router.get('/latest', function(req, res) {
  mongo.connect(mongoUrl, function(err, db) {
    if (err) throw err;
    console.log("Connected");
    var imagesearchdb = db.collection('imagesearchdb');
    imagesearchdb.find({ _id: 0 }).sort({ time: -1 }).limit(10).toArray(function(err, doc) {
      res.json(doc);
      db.close();
    });
  });
});

module.exports = router;
