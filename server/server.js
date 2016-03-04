// DEPENDENCIES
// ============
var express = require("express"),
    http = require("http"),
    port = (process.env.PORT || 8001),
    server = module.exports = express(),
    fs = require('fs');

var path = require('path');
var plantuml = require('node-plantuml');

var log = require('./libs/log')(module);
var config = require('./libs/config');


var userModel = require('./libs/mongoose').GithubUserModel;

// SERVER CONFIGURATION
// ====================
server.configure(function () {
//    server.use(express["static"](__dirname + "/../public"));
    server.use(express.static(path.join(__dirname, "/../public")));
    // Get standard favicon 
    server.use(express.favicon());
    // console output of the all status requests
    server.use(express.logger('dev'));
    // parse JSON in request
    server.use(express.bodyParser());
    // PUT and DELETE methods support
    server.use(express.methodOverride());
    // routing ???
    server.use(server.router);
    // static paths
    server.use(express.static(path.join(__dirname, "public")));


    // 
    //  List of the available API
    //
    //
    server.get('/api', function (req, res) {
	  // Add more details about each API
      res.send('{"snippets":true, "plantuml":true, "social":true}');
    });

    //
    // @name: PLANT UML 
    // @description: plantuml text -> png converter
    //
    server.get("/api/plantuml/:uml", function(req, res, next){
      res.set('Content-Type', 'image/png');
 
      var decode = plantuml.decode(req.params.uml);
      var gen = plantuml.generate({format: 'png'});
 
      decode.out.pipe(gen.in);
      gen.out.pipe(res);
    });


    //
    // Snippets REST API
    //
    server.get('/api/snippets', function(req, res) {
      res.send('This is not implemented now');
    });

    server.post('/api/snippets', function(req, res) {
      res.send('This is not implemented now');
    });

    server.get('/api/snippets/:id', function(req, res) {
      res.send('This is not implemented now');
    });

    server.put('/api/snippets/:id', function (req, res){
      res.send('This is not implemented now');    
    });

    server.delete('/api/snippets/:id', function (req, res){
      res.send('This is not implemented now');
    });

    // FrontEnd files mappings
    // TODO: Add browserify
    server.all("/*", function(req,res,next){
      var fileStream = fs.createReadStream(__dirname + "/../public/index.html");
      fileStream.on('open', function () {
          fileStream.pipe(res);
      });
    });



    server.use(express.errorHandler({

        dumpExceptions:true,

        showStack:true

    }));

    server.use(server.router);
});

// Start servier 
// ======

// Start Node.js Server
http.createServer(server).listen(config.get('port'), function() {
	log.info('Express server listening on port ' + config.get('port'));
});
