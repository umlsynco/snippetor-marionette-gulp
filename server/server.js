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
                models.GithubRepoModel.findOne(id, function(error, realRepo) {
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
        findOrCreateRepo: function(repo) {
            var promise = new Promise(function(resolve, reject){
              models.GithubRepoModel.findOne({"repository": repo.full_name}, function (err, repos) {

            // If real error happen
            if (err) {
              return reject({ error: 'Server error' });

            }
            // Check if found repository
            else {
                if (repos) {
                  return resolve(repos);
                }
                else {
                  // No error but repository doesn't exist
                  var newRepo = models.GithubRepoModel({
                    repository: repo.full_name,
                    dataProvider: "GitHub",
                    count: 0
                  });

                  newRepo.save(function (err, createdRepo) {
                    if (!err) {
                      log.info("created");
                      return resolve(createdRepo);
                    } else {
                      console.log(err);
                      if(err.name == 'ValidationError') {
                        reject({ error: 'Validation error', statusCode : 400 });
                      } else {
                        reject({ error: 'Server error', statusCode: 500 });
                      }
                      log.error('Internal error(%d): %s',res.statusCode,err.message);
                    }
                  }); // save
                } // if repos
              } // else !err
            }); // findOne
          }); // new Promise
          return promise;
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
                ccount: data.comments.length
            });
                newSnippet.save(function(err, snippet) {
                    if (err) {
                        log.info(err);
                      reject({message: "Failed to create snippet", staus: 500});
                    }
                    else {
                        log.info("DONE SNIPPET");
                      resolve(snippet);
                    }
                });
            });
        },
        listSnippet: function(options) {
          options = options || {};
          return new Promise(function(resolve, reject){
              models.SnippetItemModel.find(options, function(err, data) {
                  if (err) {
                      reject({message: "Failed to find snippets"});
                  }
                  else {
                      resolve(data);
                  }
              });
          });
        },
        getSnippetById: function(id) {
            return new Promise(function(resolve, reject){
                models.SnippetItemModel.findOne(id, function(err, snippetItem) {
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
        //
        // Create user comment
        //
        listComments: function(snippetModelId) {
           return new Promise(function(resolve, reject){
               models.RawSnippetsModel
               .find({snippetId: snippetModelId})
               .populate("commentId")
               .exec(function(err, snippets) {
                     if (err) {
                         log.info("ERROR: " + err);
                         reject(err);
                     }
                     else {
                         log.info("FOUND: " + snippets);
                         resolve(snippets);
                     }
               }); //exec
           });
        },
        createComment: function(repoModel, snippetModel, data) {
          return new Promise(function(resolve, reject){
              console.log(repoModel._id);
              console.log(snippetModel._id);
              log.info("CREATE NEW COMMENT ITEM !!! " + data);
               var newComment = models.CommentItemModel({
                  repository: repoModel._id,
                  line: data.line || 1,
	              comment: data.comment || "",
	              path: data.path || "",
                  sha: 'alskdaskldkaljdkladsjkl'
                });
log.info("SAVE NEW COMMENT ITEM !!!");
                newComment.save(function(err, nextComment) {
              log.info("SAVE DONE !!");      
                    if (err) {
                        log.info("SAVE ERROR" + err);
                        log.info(err);
                        reject({message: "Failed to create snippet comment", staus: 500});
                    }
                    else {
                        log.info("DONE COMMENT RAW");
                      var newRaw = models.RawSnippetsModel({
                          commentId: nextComment._id,
                          snippetId: snippetModel._id //require('mongoose').Schema.Types.ObjectId(snippetModel)
                      });
                      newRaw.save(function(err, item) {
                          if (err) {
                              log.info("SAVE RAW FAILED !!!");
                              reject({message: "Failed to map snippet on comment", staus: 500});
                          }
                          else {
                              log.info("DONE COMMENT RAW MAP");
                            resolve(nextComment);
                          }
                      });  // on save mapping
                    }
                });// on save comment
            });
        },
    };

    server.get('/api/comments/:id', function(req, res) {
        dbAPI.listComments(req.params.id).then(function(comments) {
            console.log(comments);
            res.send(comments);
        },
        function(err) {
          log.info("ERROR: " + err);
          res.send(err);
        });
    });

    server.get('/api/repos/:id', function(req, res) {
        dbAPI.getRepoById(req.params.id).then(function(repo) {
            console.log(repo);
            res.send(repo);
        },
        function(err) {
          log.info("ERROR: " + err);
          res.send(err);
        });
    });


    server.get('/api/snippets', function(req, res) {
        dbAPI.getUserById({name: "umlsynco"}).then(function(realUser) {
               log.info("GOT USER PROMISE DONE");
               dbAPI.listSnippet({userId: realUser._id}).then(function(snippets) {
                   res.send(snippets);
               },
               function(err) {
                   res.send("Failed to get user snippets:" + err);
               });
           },
           function(realError) {
               res.send("Failed to get current user");
           });
    });

    // Create
    server.post('/api/snippets', function(req, res) {
        console.log(req.body);
        var data = req.body;
        var comments = data.comments;
        
        if (!data.repos || data.repos.length == 0) {
            res.send({error: "Invalid parameter", status: 400});
            return;
        }
        var repoPromises = data.repos.map(dbAPI.findOrCreateRepo);
        
        Promise.all(repoPromises).then( function(affectedRespoitories) {
            log.info("GOT REPO PROMISE DONE");
            dbAPI.getUserById({name: "umlsynco"})
            .then(function(realUser) {
               log.info("GOT USER PROMISE DONE");
               dbAPI.createSnippet(data, realUser).then(function(snippet) {
                   log.info("GOT SNIPPET PROMISE DONE");
                  Promise.all(comments.map(function(item) {
                     if (item.repoId < affectedRespoitories.length) {
                         log.info("SAVE: {" + affectedRespoitories[item.repoId]._id + ", " + snippet._id + ", " + item + "}");
                       return dbAPI.createComment(affectedRespoitories[item.repoId], snippet, item);
                     }
                     else {
                         throw("Unexpected comment item");
                     }
                   }))
                  .then(function(allComments) {
                      res.send({status:"OK", repos:affectedRespoitories, user:realUser, snippet:snippet, comments: allComments});
                  },
                  function(err) {
                      console.log(err);
                      log.info("Failed to save all comments:"  + err);
                      res.send({error: "Failed to save all comments:"  +err, status: 400});
                  });
                  
               },
               function(error) {
                   log.info("GOT SNIPPET PROMISE FAILED");
                   res.send({error: "Failed to create snippet", status: 400});
               });
           },
           function(err) {
               log.info("GOT USER PROMISE FAILED: " + err);
               res.send({error: "Failed to create current user", status: 400});
           });
          },
          function(err) {
              log.info("GOT REPO PROMISE FAILED");
            res.send(err);
        });
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
