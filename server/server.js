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
var mongoose = require('mongoose');
var userModel = models.GithubUserModel;

var passport = require('passport');
var GithubStrategy = require('passport-github2').Strategy;

var fileSystem = require('fs');

// serialize and deserialize
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


passport.use(new GithubStrategy({
  clientID: config.get("github:clientID"),
  clientSecret: config.get("github:clientSecret"),
  callbackURL: config.get("github:callbackURL")
},
function(accessToken, refreshToken, profile, done) {
  process.nextTick(function () {
    return done(null, profile);
  });
}
));



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
    
    server.use(passport.initialize());
    server.use(passport.session());

    // routing ???
    server.use(server.router);
    // static paths
    server.use(express.static(path.join(__dirname, "public")));

    server.get('/bublik.gif', function(req, response) {
        setTimeout(function(){
          var filePath = path.join(__dirname, 'test.gif');
          var stat = fileSystem.statSync(filePath);

          response.setHeader('Cache-Control', 'public, max-age=' + 1000);
          response.writeHead(200, {
            'Content-Type': 'image/gif',
            'Content-Length': stat.size
         });



         var readStream = fileSystem.createReadStream(filePath);
         // We replaced all the event handlers with a simple call to readStream.pipe()
         readStream.pipe(response);
         
     }, 5000);
    });

    server.get('/auth/github',
      passport.authenticate('github'),
      function(req, res){});
    server.get('/auth/github/callback',
      passport.authenticate('github', { failureRedirect: '/' }),
      function(req, res) {
        res.redirect('/github.com/search');
      });
    server.get('/logout', function(req, res){
      req.logout();
      res.redirect('/');
    });

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
    // Search
    var dbAPI = {
        //
        // User API
        //
        getUserById: function(id) {
            return new Promise(function(resolve, reject) {
                models.GithubUserModel.findOne(id, function(error, realUser) {
                    if (error) {
                        log.info(error);
                        reject({message: "Invalid user", code: 500});
                    }
                    else {
                        resolve(realUser);
                    }
                });
            });
        },
        createUser: function(userName) {
            return new Promise(function(resolve, reject) {
                var newUser = models.GithubUserModel({
                  name: userName,
                  dataProvider: "GitHub"
                });

                newUser.save(function(err, realUser) {
                    log.info("GOT SAVE USER DONE QQQQ: " + err);
                    if (err) {
                        reject({message: "Failed to create user: " + userName, code:404});
                    }
                    else {
                        resolve(realUser);
                    }
                });
            });
        },
        //
        // Repository APIs
        //
        getRepoById: function(id) {
            return new Promise(function(resolve, reject) {
                models.GithubRepoModel.findById(id, function(error, realRepo) {
                    if (error) {
                        log.info(error);
                        reject({message: "Invalid repo", code: 500});
                    }
                    else {
                        resolve(realRepo);
                    }
                });
            });
        },
        getRepo: function(descr) {
            return new Promise(function(resolve, reject) {
                models.GithubRepoModel.findOne(descr, function(error, realRepo) {
                    if (error) {
                        log.info(error);
                        reject({message: "Invalid repo", code: 500});
                    }
                    else {
                        if (realRepo == null)
                          resolve([]);
                        else
                          resolve([realRepo]);
                    }
                });
            });
        },
        createRepo: function(descr) {
            return new Promise(function(resolve, reject) {
                  var newRepo = models.GithubRepoModel({
                    repository: descr.repository,
                    dataProvider: "GitHub",
                    gid: descr.gid,
                    branch: descr.branch,
                    count: 0
                  });

                  newRepo.save(function(error, realRepo) {
                    if (error) {
                        log.info(error);
                        reject({message: "Invalid repo", code: 500});
                    }
                    else {
                        resolve(realRepo);
                    }
                });
            });
        },        

        //
        // Snippet API
        //
        createSnippet: function(data, userModel) {
            return new Promise(function(resolve, reject){
            var newSnippet = models.SnippetItemModel({
                name: data.title,
                userId: userModel._id, // Github Oauth user ID
	            description: data.description,
	            tags: data.tags,
                version: '1.0',
                visibility: 'public',
                createdAt: new Date(),
                updatedAt: new Date(),
                ccount: data.comments.length,
                repositories: data.repos,
                comments: data.comments
            });

            newSnippet
              .save(function(err, snippet) {
              if (err) {
                log.info(err);
                reject({message: "Failed to create snippet: ", staus: 500});
              }
              else {
                log.info("DONE SNIPPET");
                resolve(snippet);
              }
            }); // save
          }); // Promise
        },
        updateSnippet: function(data, userModel) {
          return new Promise(function(resolve, reject){
               var newComment =
                 models
                .SnippetItemModel
                .update({_id: data._id}, {
                  name: data.title,
                  userId: userModel._id, // Github Oauth user ID
	              description: data.description,
  	              tags: data.tags,
                  updatedAt: new Date(),
                  ccount: data.comments.length,
                  repositories: data.repos,
                  comments: data.comments
                },
                function(err, affected, resp) {
                  if (err) {
                    console.log("ERROR: " + err);
                    reject({message: "Failed to create snippet comment", staus: 500});
                  }
                  else {
                    console.log("ERR: " + err);
                    console.log("AFFECTED: " + affected);
                    console.log("RESP: " + resp);
                    resolve(affected);
                  }
                });// on save comment
            }); // Promise
        }, 
        listSnippet: function(options) {
          options = options || {};
          return new Promise(function(resolve, reject){
              models
              .SnippetItemModel
              .find(options)
              .sort({updatedAt: 'desc'})
              .exec(function(err, data) {
                  if (err) {
                      reject({message: "Failed to find snippets"});
                  }
                  else {
                      resolve(data);
                  }
              });
          });
        },
        getSnippetById: function(id, userModel) {
            return new Promise(function(resolve, reject){
                models
                .SnippetItemModel
                .findById(id)
                .populate("comments")
                .populate("repositories")
                .exec(function(err, snippetItem) {
                    if (err) {
                        log.info(err);
                      reject({message: "Failed to find snippet", staus: 500});
                    }
                    else {
                        log.info("FOUND SNIPPET");
                      resolve(snippetItem);
                    }
                });
            });
        },
        deleteSnippetById: function(id, userModel) {
            return new Promise(function(resolve, reject){
                models
                .SnippetItemModel
                .findById(id)
                .remove()
                .exec(function(err) {
                    if (err) {
                      log.info(err);
                      reject({message: "Failed to find snippet", staus: 500});
                    }
                    else {
                        log.info("REMOVED SNIPPET");
                      resolve({});
                    }
                });
            });
        },
        //
        // COMMENTS API:
        // User could create comment or update an existing one
        // Useless comments will be dropped by server, not user
        //
        createComment: function(data) {
          return new Promise(function(resolve, reject){
               var newComment = models.CommentItemModel({
                  repository: data.repository,
                  line: data.line || 1,
	              comment: data.comment || "",
	              path: data.path || "",
                  sha: data.sha || '0'
                });

                newComment.save(function(err, nextComment) {
                    if (err) {
                        console.log("ERROR: " + err);
                        reject({message: "Failed to create snippet comment", staus: 500});
                    }
                    else {
                            resolve(nextComment);
                    }
                });// on save comment
            }); // Promise
        }, // createComment
        updateComment: function(data) {
          return new Promise(function(resolve, reject){
               var newComment =
                 models
                .CommentItemModel
                .update({_id: data._id}, {
                  repository: data.repository,
                  line: data.line || 1,
	              comment: data.comment || "",
	              path: data.path || "",
                  sha: data.sha || '0'
                },
                function(err, affected, resp) {
                  if (err) {
                    console.log("ERROR: " + err);
                    reject({message: "Failed to create snippet comment", staus: 500});
                  }
                  else {
                    console.log("ERR: " + err);
                    console.log("AFFECTED: " + affected);
                    console.log("RESP: " + resp);
                    resolve(affected);
                  }
                });// on save comment
            }); // Promise
        }, // updateComment
    };

    /////////////////////////////////////////// COMMENTS API ///////////

    //
    // GET comment by ID
    //
    server.get('/api/comments/:id', function(req, res) {
        res.send('Not implemented: use GET /api/snippets/:id');
    });

    //
    // UPDATE an existing comment
    //
    server.put('/api/comments/:id', function(req, res) {
        dbAPI.updateComment(req.body).then(function(response) {
            console.log(response);
            res.send(response);
          }, function(err) {
            log.info("ERROR: " + err);
            res.send(err);
          }
        ); // then
    });

    //
    // POST new comment
    //
    server.post('/api/comments', function(req, res) {
        console.log("/api/comments:" + req.body);
        console.log(req.body);
        dbAPI.createComment(req.body).then(function(comment) {
            console.log(comment);
            res.send(comment);
        },
        function(err) {
          log.info("ERROR: " + err);
          res.send(err);
        });
    });

    ///////////////////////////////////////// REPOSITORY API ///////////
    
    //
    // GET repo by ID
    //
    server.get('/api/repos/:id', function(req, res) {
        console.log(req.params.id);
        dbAPI.getRepoById(req.params.id).then(function(foundRepo) {
            console.log(foundRepo.id);
            res.send(foundRepo);
        },
        function(err) {
          log.info("ERROR: " + err);
          res.send(err);
        });
    });

    //
    // GET list of repositories according to the "query"
    //
    server.get('/api/repos', function(req, res) {
        console.log(req.query);
        dbAPI.getRepo(req.query).then(function(repo) {
            console.log(repo);
            res.send(repo);
        },
        function(err) {
          log.info("ERROR: " + err);
          res.send(err);
        });
    });

    //
    // POST a new repository with unique [full_name, branch, github-id]
    //
    server.post('/api/repos', function(req, res) {
        dbAPI.createRepo(req.body).then(function(repo) {
            console.log(repo);
            res.send(repo);
        },
        function(err) {
          log.info("ERROR: " + err);
          res.send(err);
        });
    });

    /////////////////////////////////////////// SNIPPETS API ///////////

    //
    // GET snippets according to the query:
    // - for current user only
    // TODO: make more complex search by repo, user etc.
    //
    server.get('/api/snippets', function(req, res) {
        dbAPI.getUserById({name: "umlsynco"}).then(function(realUser) {
               log.info("GOT USER PROMISE DONE");
               dbAPI.listSnippet({userId: realUser._id}).then(function(snippets) {
                   res.send({hasNext: false, limit: 13, page: 0, snippets: snippets});
               },
               function(err) {
                   res.send("Failed to get user snippets:" + err);
               });
           },
           function(realError) {
               res.send("Failed to get current user");
           });
    });

    //
    // POST new snippet
    // { title: "visible title",
    //   description: "detailed description",
    //   hashtags: [tags],
    //   repositories: [Object._id],  // list of the affected repositories
    //   comments: [Object._id], // list of the affected comments
    //   createdAt: Date,
    //   modifiedAt: Date,
    //  }
    //
    //
    server.post('/api/snippets', function(req, res) {
        console.log(req.body);
        var data = req.body;

        // Validate that comment and repos are not empty        
        if (!data.repos || data.repos.length == 0 ||
          !data.comments || data.comments.length == 0) {
          res.send({error: "Invalid parameter", status: 400});
          return;
        }
        
        dbAPI
        .getUserById({name: "umlsynco"}) // <-- TODO: get current user
        .then(function(realUser) {
          log.info("GOT USER PROMISE DONE");
          dbAPI
          .createSnippet(data, realUser)
          .then(
            function(snippet) {
              res.send(snippet);
            },
            function(error) {
              log.info("GOT SNIPPET PROMISE FAILED");
              res.send({error: "Failed to create snippet", status: 400});
            });
        }, // user success
        function(err) { // user error
          log.info("GOT USER PROMISE FAILED: " + err);
          res.send({error: "Failed to get current user", status: 400});
        }); // got user complete
    });

    //
    // GET snippet details by id
    //
    server.get('/api/snippets/:id', function(req, res) {
        dbAPI
        .getUserById({name: "umlsynco"}) // <-- TODO: get current user
        .then(function(realUser) {
          log.info("GOT USER PROMISE DONE");
          dbAPI
          .getSnippetById(req.params.id, realUser)
          .then(
            function(snippet) {
              res.send(snippet);
            },
            function(error) {
              log.info("GOT SNIPPET PROMISE FAILED");
              res.send({error: "Failed to create snippet", status: 400});
            });
        }, // user success
        function(err) { // user error
          log.info("GOT USER PROMISE FAILED: " + err);
          res.send({error: "Failed to get current user", status: 400});
        }); // got user complete

    });
    
    //
    // UPDATE - update an existing snippet
    //
    server.put('/api/snippets/:id', function (req, res){
        console.log(req.body);
        var data = req.body;

        // Validate that comment and repos are not empty        
        if (!data.repos || data.repos.length == 0 ||
          !data.comments || data.comments.length == 0) {
          res.send({error: "Invalid parameter", status: 400});
          return;
        }
        
        dbAPI
        .getUserById({name: "umlsynco"}) // <-- TODO: get current user
        .then(function(realUser) {
          log.info("GOT USER PROMISE DONE");
          dbAPI
          .updateSnippet(data, realUser)
          .then(
            function(data) {
              res.send(data);
            },
            function(error) {
              log.info("GOT SNIPPET PROMISE FAILED");
              res.send({error: "Failed to create snippet", status: 400});
            });
        }, // user success
        function(err) { // user error
          log.info("GOT USER PROMISE FAILED: " + err);
          res.send({error: "Failed to get current user", status: 400});
        }); // got user complete   
    });

    //
    // DELETE snipppet by id
    //
    server.delete('/api/snippets/:id', function (req, res){
        dbAPI
        .getUserById({name: "umlsynco"}) // <-- TODO: get current user
        .then(function(realUser) {
          log.info("GOT USER PROMISE DONE");
          dbAPI
          .deleteSnippetById(req.params.id, realUser)
          .then(
            function(result) {
              res.send(result);
            },
            function(error) {
              log.info("REMOVE SNIPPET FAILED");
              res.send({error: "Failed to remove snippet", status: 400});
            });
        }, // user success
        function(err) { // user error
          log.info("GOT USER PROMISE FAILED: " + err);
          res.send({error: "Failed to get current user capabilities", status: 400});
        }); // got user complete
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
