// DEPENDENCIES
// ============
var express = require("express"),
    http = require("http"),
    port = (process.env.PORT || 8001),
    server = module.exports = express(),
    fs = require('fs');

// SERVER CONFIGURATION
// ====================
server.configure(function () {

    server.use(express["static"](__dirname + "/../public"));

    server.all("*", function(req,res,next){
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

// SERVER
// ======

// Start Node.js Server
http.createServer(server).listen(port);

console.log('Welcome to MRB-Lite!\n\nPlease go to http://localhost:' + port + ' to start using Marionette, Require.js and Backbone.js');
