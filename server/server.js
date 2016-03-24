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


var models = require('./libs/mongoose');

// SERVER CONFIGURATION
// ====================
server.configure(function () {

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
      res.send('{"snippets":true, "users": true,  "plantuml":true, "social":true}');
    });

    //
    //  User API GET and POST
    //
    server.get('/api/users/:id', function (req, res, id) {
	  return userModel.findById(req.params.id, function (err, user) {
        if(!user) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        if (!err) {
            return res.send({ status: 'OK', user: user});
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
      });
    });

    server.post('/api/users', function (req, res) {
	  // create 
      var user = new userModel({
        name: req.body.name
      });

      user.save(function (err) {
        if (!err) {
            log.info("user created");
            return res.send({ status: 'OK', user : user });
        } else {
            console.log(err);
            if(err.name == 'ValidationError') {
                res.statusCode = 400;
                res.send({ error: 'Validation error' });
            } else {
                res.statusCode = 500;
                res.send({ error: 'Server error' });
            }
            log.error('Internal error(%d): %s',res.statusCode,err.message);
        }
      });
    });

    //
    // Repository API
    //

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

    // User rest API
    // You could ask about user status only, if available !!!!
    // {
    //   name: username,
    //   repositories: [{
    //     full_name: "user/repo",
    //     snippets_count: 2,
    //     user_snippets_count: 0
    //   }],
    //   id: 123,
    // }
    server.get('/api/users/:name', function(req, res) {
      // 1. Find user in the list of users
      models.GithubUserModel.findById(req.params.name, function (err, user) {
        if(!user) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        if (!err) {
            return res.send({ status: 'OK', user:user });
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode, err.message);
            return res.send({ error: 'Server error' });
        }
      });
      // 2. Get repository id's which affected user + count of snippets
      // 3. Prepare results: user + repos [{name, user_data, common_data}]
      res.send('This is not implemented now');
    });

    // Ask more details about repo
    server.get('/api/repo/:id', function(req, res) {
      res.send('This is not implemented now');
    });

    //
    // Snippets REST API
    //
    // Search
    server.get('/api/snippets', function(req, res) {
      res.send('This is not implemented now');
    });

    // Create
    server.post('/api/snippets', function(req, res) {
      res.send('This is not implemented now');
    });

    // Get
    server.get('/api/snippets/:id', function(req, res) {
      res.send('This is not implemented now');
    });
    // Update
    server.put('/api/snippets/:id', function (req, res){
      res.send('This is not implemented now');    
    });
    // Delete
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
