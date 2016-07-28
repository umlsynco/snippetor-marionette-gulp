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

var flash = require('connect-flash');

var MongoStore = require('connect-mongo')(express);

// serialize and deserialize
passport.serializeUser(function (user, done) {
    log.info("SERL : " + user);
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    log.info("DES: " + id);

    userModel.findById(id, function (err, realUser) {
        if (err) {
            log.info("DES ERR: " + err);
        }
        done(err, realUser);
    });
});


passport.use(new GithubStrategy({
        clientID: config.get("github:clientID"),
        clientSecret: config.get("github:clientSecret"),
        callbackURL: config.get("github:callbackURL")
    },
    function (accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
            var searchQuery = {
                displayName: profile.displayName,
                username: profile.username,
                gid: profile.id // github id
            };

            var updates = {
                displayName: profile.displayName,
                username: profile.username,
                gid: profile.id, // github id
                provider: profile.provider,
                accessToken: accessToken
            };

            var options = {
                upsert: true
            };

            // update the user if s/he exists or add a new user
            userModel.findOneAndUpdate(searchQuery, updates, options, function (err, user) {
                if (err || !user) {
                    return done(err);
                } else {
                    return done(null, user);
                }
            });
        });
    }
));

var allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', 'localhost:8001');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}

// SERVER CONFIGURATION
// ====================
server.configure(function () {

    server.use(express.static(path.join(__dirname, "/../public")));
    // Get standard favicon 
    server.use(express.favicon());
    // console output of the all status requests
    server.use(express.logger('dev'));

    //server.use(allowCrossDomain);

    // PUT and DELETE methods support
    server.use(express.methodOverride());

    // cookie parser   
    // server.use(express.cookieParser());
    // Express js session
    server.use(express.session({
        secret: 'my_precious',
        key: 'session-sp2',
        store: new MongoStore({mongooseConnection: mongoose.connection})
    })); // resave: true, saveUninitialized: true}));

    // parse JSON in request
    server.use(express.bodyParser());

    // Passport js initialization
    server.use(passport.initialize());
    server.use(passport.session());

    server.use(flash()); // use connect-flash for flash messages stored in session

    server.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));

    // routing
    server.use(server.router);
}); // server.configure 


function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.send({error: "Authentication required", status: 400});
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////
//                               PASSPORT JS
//////////////////////////////////////////////////////////////////////////////////////////////
server.get('/auth/github', passport.authenticate('github'), function (req, res) {
});
server.get('/auth/github/callback', passport.authenticate('github', {failureRedirect: '/'}),
    function (req, res) {
        res.header('Access-Control-Allow-Credentials', 'true');
        res.redirect('/github.com/' + req.user.username);
    });
server.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});


//////////////////////////////////////////////////////////////////////////////////////////////
//                               SERVER API
//////////////////////////////////////////////////////////////////////////////////////////////

//
//  List of the available API
//
//
server.get('/api', function (req, res) {
    // Add more details about each API
    res.send('{"snippets":true, "users": true,  "plantuml":true, "social":true}');
});

//
// @name: PLANT UML
// @description: plantuml text -> png converter
//
server.get("/api/plantuml/:uml", function (req, res, next) {
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
    getUserById: function (id) {
        return new Promise(function (resolve, reject) {
            models.GithubUserModel.findById(id, function (error, realUser) {
                if (error) {
                    log.info(error);
                    reject({message: "Invalid user", code: 500});
                }
                else {
                    log.info(realUser);
                    resolve(realUser);
                }
            });
        });
    },
    //
    // @currentUser is null when we do not need to extract dependency
    //              between curent user and requested
    //
    getUserByName: function (currentUser, name) {
        return new Promise(function (resolve, reject) {
            models.GithubUserModel.findOne({username: name}, function (error, realUser) {
                if (error) {
                    log.info(error);
                    reject({message: "Invalid user", code: 500});
                }
                else {
                    //
                    // work-around to minimize the number of requests
                    //
                    if (currentUser == null) {
                        resolve(realUser);
                        return;
                    }
                    //
                    // no way to extract any dependencies if user not registered
                    //
                    if (realUser == null) {
                        // No errors but no user found
                        resolve({user: null});
                        return;
                    }
                    
                    // Extract relations between requested user and current user
                    // To propose follow or un-follow
                    models
                    .GithubUserFollow
                    .findOne({user: currentUser._id, follow_user: realUser._id}, function(error, item) {
                        if (error || item == null) {
                            resolve({user: realUser, error: error});
                        }
                        else {
                            // @follow - indicates if current log-in user follow to the requested user
                            resolve({user: realUser, follow: item.follow});
                        }
                    });
                }
            });
        });
    },
    followUser: function (logInUser, followedUser, follow) {
        return new Promise(function (resolve, reject) {
            var searchQuery = {
              user: logInUser.id,
              follow_user: followedUser.id
            };

            var updates = {
                user: logInUser.id,
                follow_user: followedUser.id,
                follow: follow
            };

            var options = {
                upsert: true
            };

            models.GithubUserFollow.findOneAndUpdate(searchQuery, updates, options, function (err, userFollowRef) {
                if (err) {
                     return reject(err);
                } else {
                    // @journal - journal add follow/unfollow user logs
                    if (userFollowRef == null || (userFollowRef != null && userFollowRef.follow != follow))
                      dbAPI.reportLog(logInUser.id, null, null, followedUser.id, follow ? "follow-user" : "unfollow-user");

                    // userFollowRef - an old value reference, could be null if there was not any reference
                    // check that follow state changed, otherwise do nothing
                    if ((userFollowRef == null && follow) || (userFollowRef.follow != follow)) {
                        // TODO: temporary stubs for an old created users
                        //if (followedUser.follower == undefined)  followedUser.follower = 0;
                        followedUser.followers += (follow ? 1 : -1);
                        followedUser.save();
                        // TODO: temporary stubs for an old created users
                        //if (logInUser.following == undefined) logInUser.following = 0;
                        logInUser.following += (follow ? 1 : -1);
                        logInUser.save();
                    }
                    return resolve(userFollowRef || {});
                }
            });
        }); // Promise
    },
    getUserRepos: function(realUser, query) {
      return new Promise(function(resolve,reject) {
                    models
                    .GithubUserRepoRefs
                    .find({user: realUser._id})
                    .sort({'count': -1, 'follow': -1})
                    .limit(query.limit ? query.limit : 10)
                    .populate("repository")
                    .exec()
                    .then(
                        function(listOfUserRepos) {
                          resolve(listOfUserRepos.filter(function(value) {
                              if (value.repository == null) {
                                value.remove();
                                return false;
                              }
                            return (value.repository != null);
                          }));
                        },
                        function(error) {
                          reject({status: 500, error: "Server error: " + error});
                        }
                    ); // then
      }); // Promise
    },
    checkRepoFollowing: function (userId, repoId) {
        return new Promise(function (resolve, reject) {
            console.log({user: userId, repository: repoId});
            models.GithubUserRepoRefs.findOne({user: userId, repository: repoId},
                function (err, item) {
                    if (err || !item)
                        reject();
                    else
                        resolve(item.follow);
                });
        });
    },
    upsertUserRepoRef: function (userId, repoId, follow, count) {
        return new Promise(function (resolve, reject) {
            var searchQuery = {
                user: userId,
                repository: repoId
            };

            var updates = {
                user: userId,
                repository: repoId
            };
            if (follow != undefined)  updates.follow = follow;
            if (count != undefined) updates.$inc = {count: 1};

            var options = {
                upsert: true,
                new: true
            };

            // update the user data if it is exist or add a new user data
            models.GithubUserRepoRefs.findOneAndUpdate(searchQuery, updates, options, function (err, userRef) {
                if (err || !userRef) {
                     return reject(err);
                } else {
                    // @journal - log user follow repo
                    if (follow != undefined && (userRef == null || (userRef && userRef.follow != follow))) {
                        // keep user ref in the mixed field for a future
                        dbAPI.reportLog(userId, repoId, null, userRef ? userRef.id: null, (follow ? "follow-repo" : "unfollow-repo"));
                    }
                    
                    return resolve(userRef);
                }
            });
        });
    },
    
    countFollowers: function(userId) {
            var x = new Promise(function (resolve, reject) {
             models
             .GithubUserFollow
             .count({user: userId, follow: true}, function(err, count) {
                resolve(count);
             });
            });
            var y = new Promise(function (resolve, reject) {
             models
             .GithubUserFollow
             .count({follow_user: userId, follow: true}, function(err, count) {
                resolve(count);
             });
            });
            var z = new Promise(function (resolve, reject) {
             models
             .GithubUserRepoRefs
             .count({user: userId}, function(err, count) {
                resolve(count);
             });
            });
            return Promise.all([x,y,z]);
    },
    //
    // Repository APIs
    //
    getRepoById: function (id) {
        return new Promise(function (resolve, reject) {
            models.GithubRepoModel.findById(id, function (error, realRepo) {
                if (error)
                    reject({message: "Invalid repo", code: 500});
                else
                    resolve(realRepo);
            });
        });
    },
    getRepo: function (descr) {
        return new Promise(function (resolve, reject) {
            models.GithubRepoModel.findOne(descr, function (error, realRepo) {
                if (error) {
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
    createRepo: function (descr) {
        return new Promise(function (resolve, reject) {
            var newRepo = models.GithubRepoModel({
                repository: descr.repository,
                description: descr.description,
                dataProvider: "GitHub",
                gid: descr.gid,
                branch: descr.branch,
                count: 0
            });

            newRepo.save(function (error, realRepo) {
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

    increaseSnippetsCount: function(repoId) {
        console.log("increaseSnippetsCount");
        dbAPI.getRepoById(repoId).then(function(foundRepo) {
            foundRepo.count += 1;
            foundRepo.save();
        });
    },

    decreaseSnippetsCount: function(repoId) {
        dbAPI.getRepoById(repoId).then(function(foundRepo) {
            foundRepo.count -= 1;
            foundRepo.save();
        });
    },
    //
    // Snippet API
    //
    createSnippet: function (data, userModelId) {
        return new Promise(function (resolve, reject) {
            var newSnippet = models.SnippetItemModel({
                name: data.title,
                userId: userModelId, // Github Oauth user ID
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
                .save(function (err, snippet) {
                    if (err) {
                        reject({message: "Failed to create snippet: ", staus: 500});
                    }
                    else {
                        snippet.repositories.map(dbAPI.increaseSnippetsCount);
                        // @journal - report snippet create in the repository
                        snippet.repositories.map(function(repoId) {
                            dbAPI.reportLog(userModelId, repoId, snippet.id, null, "create-snippet");
                        });
                        resolve(snippet);
                    }
                }); // save
        }); // Promise
    },
    updateSnippet: function (data, userModelId) {
        return new Promise(function (resolve, reject) {
            var newComment =
                models
                    .SnippetItemModel
                    .update({_id: data._id}, {
                            name: data.title,
                            userId: userModelId, // Github Oauth user ID
                            description: data.description,
                            tags: data.tags,
                            updatedAt: new Date(),
                            ccount: data.comments.length,
                            repositories: data.repos,
                            comments: data.comments
                        },
                        function (err, affected, resp) {
                            if (err) {
                                reject({message: "Failed to create snippet comment", staus: 500});
                            }
                            else {
                              // @journal - report snippet update for all repositories
                              data.repos.map(function(repoId) {
                                dbAPI.reportLog(userModelId, repoId, data._id, null, "update-snippet");
                              });
                              resolve(affected);
                            }
                        });// on save comment
        }); // Promise
    },
    //
    // Update user-snippet relations
    //
    updateSnippetRefs: function(user, snippet, data) {
        return new Promise(function(resolve, reject) {
            var searchQuery = {
                user: user.id,
                snippet: snippet.id
            };

            var updates = {
                user: user.id,
                snippet: snippet.id
            };

            if (data.follow != undefined) updates.follow = data.follow;
            if (data.star != undefined) updates.star = data.star;

            var options = {
                upsert: true
            };

            // update the user if s/he exists or add a new user
          models.GithubUserSnippetRefs.findOneAndUpdate(searchQuery, updates, options, function (err, userRef) {
                if (err) {
                    return reject(err);
                } else {
                    // @journal - report snippet follow/unfollow
                    if (data.follow != undefined && (
                       userRef == null || userRef.follow != data.follow)) // userRef == null means that it is a new record
                    dbAPI.reportLog(user.id, null, snippet.id, null,  (data.follow ? "follow-snippet" : "unfollow-snippet"));

                    // @journal - report snippet star/unstar
                    if (data.star != undefined && (
                       userRef == null || userRef.star != data.star))  // userRef == null means that it is a new record
                    dbAPI.reportLog(user.id, null, snippet.id, null,  (data.star ? "star-snippet": "unstar-snippet"));
                    
                    if (userRef == null) {
                        // it is not possible to unfollow snippet
                        // if there were not any reference
                        snippet.followers += data.follow ? 1: 0;
                        snippet.stars += data.star ? 1 : 0;
                    }
                    else {
                      if (data.follow != undefined && userRef.follow != data.follow) {
                        snippet.followers += data.follow ? 1: -1;
                      }
                      else if (data.star != undefined && userRef.star != data.star) {
                        snippet.stars += data.star ? 1 : -1;
                      }
                    }
                    snippet.save();
                    resolve({star: data.star, follow: data.follow, stars: snippet.stars, followers: snippet.followers});
                }
            });
          
        });
        
    },
    listSnippet: function (options) {
        options = options || {};
        return new Promise(function (resolve, reject) {
          var showLimit = options.limit || 7;
          var page = (options.page-1) || 0;
          delete options.page;
              models
                .SnippetItemModel
                .find(options)
                .skip(showLimit*page)
                .limit(showLimit)
                .populate("userId")
                .sort({updatedAt: 'desc'})
                .exec(function (err, data) {
                    if (err) {
                        reject({message: "Failed to find snippets"});
                    }
                    else {
                        resolve(data);
                    }
                });
        });
    },
    countSnippets: function (options) {
        options = options || {};
        return new Promise(function (resolve, reject) {
           models
            .SnippetItemModel
            .count(options, function(err, count) {
                resolve(count);
            });
        });
    },
    getSnippetById: function (id, userModel) {
        return new Promise(function (resolve, reject) {
            models
                .SnippetItemModel
                .findById(id)
                .populate("comments")
                .populate("repositories")
                .exec(function (err, snippetItem) {
                    if (err) {
                        log.info(err);
                        reject({message: "Failed to find snippet", staus: 500});
                    }
                    else {
                        resolve(snippetItem);
                    }
                });
        });
    },
    deleteSnippetById: function (id, userModel) {
        return new Promise(function (resolve, reject) {
            models
                .SnippetItemModel
                .findById(id)
                .then(function(foundRepo) {
                    // Decrease snippets count
                    foundRepo.repositories.map(dbAPI.decreaseSnippetsCount);

                    // Remove object
                    foundRepo.remove();
                    resolve({});
                },
                function(err) {
                    log.info(err);
                    reject({message: "Failed to find snippet", staus: 500});
                });
        });
    },
    //
    // COMMENTS API:
    // User could create comment or update an existing one
    // Useless comments will be dropped by server, not user
    //
    createComment: function (data) {
        return new Promise(function (resolve, reject) {
            var newComment = models.CommentItemModel({
                repository: data.repository,
                line: data.line || 1,
                comment: data.comment || "",
                path: data.path || "",
                sha: data.sha || '0'
            });

            newComment.save(function (err, nextComment) {
                if (err) {
                    reject({message: "Failed to create snippet comment", staus: 500});
                }
                else {
                    resolve(nextComment);
                }
            });// on save comment
        }); // Promise
    }, // createComment
    updateComment: function (data) {
        return new Promise(function (resolve, reject) {
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
                        function (err, affected, resp) {
                            if (err) {
                                reject({message: "Failed to create snippet comment", staus: 500});
                            }
                            else {
                                resolve(affected);
                            }
                        });// on save comment
        }); // Promise
    }, // updateComment

    //
    // User logs API
    //
    reportLog: function(userId, repoId, snippetId, refId, action) {
        return new Promise(function (resolve, reject) {
            var data = models.GithubUserLogs({
                user: userId,
                repository: repoId,
                snippet: snippetId,
                mixed: refId,
                action: action,
                createdAt: new Date()
            });

            data.save(function (err, logItem) {
                if (err) {
                    console.log("ERROR: " + err);
                    reject({message: "Failed to create snippet comment", staus: 500});
                }
                else {
                    resolve(logItem);
                }
            });// on save comment
        }); // Promise
    }, // make user report

    dashboard: function(userId, page) {
     return new Promise(function (resolve, reject) {
        var showLimit=7;
        // There are 3 tables of user references:
        Promise
        .all([models.GithubUserFollow.find({user: userId}, 'follow_user').exec(),
              models.GithubUserRepoRefs.find({user: userId}, 'repository').exec(),
              models.GithubUserSnippetRefs.find({user: userId}, 'snippet').exec()])
        .then(function(values) {
            console.log("GOL VALUES");
            console.log(values);
            var followUsers = values[0].map(function(item) {
                   return item.follow_user;
                }),
                followRepos = values[1].map(function(item) {
                   return item.repository;
                }),
                followSnippets = values[2].map(function(item) {
                   return item.snippet;
                });
            models.GithubUserLogs
            .find({})
            .where('user').in(followUsers)
//            .where('repository').in(followRepos)
//            .where('snippet').in(followSnippets)
            .skip(showLimit*page)
            .limit(showLimit)
//            .asc('createdAt')
            .populate('user')
            .populate('repository')
            .populate('snippet')
            .exec(function(err, docs) {
                if (err) { reject(err); }
                else { resolve(docs); }
                
            }, function(error) {
                console.log("XXX" + error);
            });
        },
        function(error) {
            console.log("PROMISE ALL ERRROR");
            console.log(error);
            reject("PROMISE ALL FAILED: " + error);
        }); // Promise.all
      });// Promise   
    },
    //
    // Show concreate user activity
    //
    userDashboard: function(userId, page) {
     return new Promise(function (resolve, reject) {
        var showLimit=5;
            models.GithubUserLogs
            .find({})
            .where('user').in([userId])
            .sort({createdAt: 'desc'})
            .skip(showLimit*page)
            .limit(showLimit)
            .populate('user')
            .populate('repository')
            .populate('snippet')
            .exec(function(err, docs) {
                if (err) { reject(err); }
                else { resolve(docs); }
                
            });
      });// Promise   
    }

};


//
//  User API GET
//
server.get('/api/users/:id', function (req, res, id) {
    return userModel.findById(req.params.id, function (err, user) {
        if (!user) {
            res.statusCode = 404;
            return res.send({error: 'Not found'});
        }
        if (!err) {
            return res.send({status: 'OK', user: user});
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode, err.message);
            return res.send({error: 'Server error'});
        }
    });
});

server.get('/api/users/:id/refs', function (req, res, id) {
    //123
});

server.get('/api/users/:id/repos', function (req, res, id) {
    return userModel.findById(req.params.id, function (err, user) {
        if (!user) {
            res.statusCode = 404;
            return res.send({error: 'Not found'});
        }
        if (!err) {
            dbAPI
            .getUserRepos(user, req.query)
            .then(function(repositories) {
                res.send(repositories);
            },
            function(error) {
                res.statusCode = 500;
                res.send(error);
            });
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode, err.message);
            return res.send({error: 'Server error'});
        }
    });
});

server.get('/api/users', function (req, res) {
    if (!req.query.username) {
        return res.send({error: 'Not enough parameters'});
    }

    dbAPI
        .getUserByName(req.user, req.query.username)
        .then(
            function (user) {
                if (!user) {
                    res.statusCode = 404;
                    return res.send({error: 'Not found'});
                }
                return res.send(user);
            },
            function (err) {

                res.statusCode = 500;
                log.error('Internal error(%d): %s', res.statusCode, err.message);
                return res.send({error: 'Server error'});

            });
});

server.put('/api/users/:id', function (req, res, id) {
    if (!req.body.follow) {
        res.send({status: 400, error: "Only follow parameter update supported"});
        return;
    }
    return userModel.findById(req.params.id, function (err, user) {
        if (!user) {
            res.statusCode = 404;
            return res.send({error: 'Not found'});
        }
        if (!err) {
            dbAPI.followUser(req.user, user, req.body.follow);
           
            return res.send({status: 'OK', user: user});
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode, err.message);
            return res.send({error: 'Server error'});
        }
    });
});

/////////////////////////////////////////// COMMENTS API ///////////

//
// GET comment by ID
//
server.get('/api/comments/:id', function (req, res) {
    res.send('Not implemented: use GET /api/snippets/:id');
});

//
// UPDATE an existing comment
//
server.put('/api/comments/:id', ensureAuthenticated);
server.put('/api/comments/:id', function (req, res) {
    dbAPI.updateComment(req.body).then(function (response) {
            console.log(response);
            res.send(response);
        }, function (err) {
            log.info("ERROR: " + err);
            res.send(err);
        }
    ); // then
});

//
// POST new comment
//
server.post('/api/comments', ensureAuthenticated);
server.post('/api/comments', function (req, res) {
    console.log("/api/comments:" + req.body);
    console.log(req.body);
    dbAPI.createComment(req.body).then(function (comment) {
            console.log(comment);
            res.send(comment);
        },
        function (err) {
            log.info("ERROR: " + err);
            res.send(err);
        });
});

///////////////////////////////////////// REPOSITORY API ///////////

//
// GET repo by ID
//
server.get('/api/repos/:id', ensureAuthenticated, function (req, res) {
    console.log(req.params.id);
    dbAPI.getRepoById(req.params.id).then(function (foundRepo) {
            console.log(foundRepo.id);
            res.send(foundRepo);
        },
        function (err) {
            log.info("ERROR: " + err);
            res.send(err);
        });
});

//
// GET repo by ID
//
server.put('/api/repos/:id', ensureAuthenticated, function (req, res) {
    if (req.body.follow == undefined) {
        res.send({status: 404, error: "Not enough parameter"});
        return;
    }

    dbAPI.getRepoById(req.params.id).then(function (foundRepo) {
            dbAPI
            .upsertUserRepoRef(req.user.id, foundRepo.id, req.body.follow)
            .then(function(obj) {
              // Increase/decrease followers
              var what_is_going_on = 
                (foundRepo.followers == undefined || foundRepo.followers < 0 ? {$set: {followers: 0}} :
                    {$inc: {followers: (req.body.follow == "true" ? 1 : -1)}});

                models.GithubRepoModel.update(foundRepo, what_is_going_on, {wait:true}, function(err, data) {});
                res.send(obj);
            },
            function(err) {
                res.send({status: 500, error: "Failed to setup the 'follow' status: " + err});
            });
        },
        function (err) {
            res.send({status: 500, error: err});
        });
});

//
// GET list of repositories according to the "query"
//
server.get('/api/repos', ensureAuthenticated, function (req, res) {
    console.log(req.query);
    dbAPI.getRepo(req.query).then(function (foundRepo) {
        if (foundRepo == null || foundRepo.length == 0) {
            // No repo found
            res.send([]);
            return;
        }

        console.log(foundRepo[0].id);
            dbAPI
                // TODO: apply for all found repositories,
                //       but right now we have a single repo requests only
                .checkRepoFollowing(req.user.id, foundRepo[0].id)
                .then(function(followStatus) {
                     //////////////// WORK AROUND
                     // It is not possible to extend mongoose object
                     // therefore we have to clone it directly
                     var resultRepo = {
                         _id: foundRepo[0]._id,
                         count: foundRepo[0].count,
                         branch: foundRepo[0].branch,
                         gid: foundRepo[0].gid,
                         dataProvider: 'GitHub',
                         repository: foundRepo[0].repository,
                         followers: foundRepo[0].followers,
                         follow : followStatus
                     };

                     var arr = []; arr.push(resultRepo);
                     ////////////////////////// END-Work around
                     res.send(arr);
                }, function (err) {
                    res.send(foundRepo);
                });
        },
        function (err) {
            log.info("ERROR: " + err);
            res.send(err);
        });
});

//
// POST a new repository with unique [full_name, branch, github-id]
//
server.post('/api/repos', ensureAuthenticated);
server.post('/api/repos', function (req, res) {
    dbAPI.createRepo(req.body).then(function (repo) {
            console.log(repo);
            res.send(repo);
        },
        function (err) {
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
server.get('/api/snippets', ensureAuthenticated, function (req, res) {
    function listSnippetsForQuery(query) {
        query.page = req.query.page || 1;
        dbAPI.listSnippet(query).then(function (snippets) {
                if (!req.query.page || req.query.page == 0) {
                    dbAPI.countSnippets(query).then(function(count) {
                        res.send({hasNext: false, limit: 7, total: count, page: 0, snippets: snippets});
                    });
                } 
                else {
                  res.send({hasNext: false, limit: 13, page: 0, snippets: snippets});
                }
            },
            function (err) {
                res.send("Failed to get user snippets:" + err);
            });
    }

    function listSnippetsForUser(username, repoId) {
      dbAPI.getUserByName(null, username).then(
            function (realUser) {
                if (!realUser) {
                    res.send("No user found:" + username);
                    return;
                }

                if (repoId) {
                  listSnippetsForQuery({userId: realUser._id, repositories: repoId});
                }
                else {
                  listSnippetsForQuery({userId: realUser._id});
                }
            },
            function (error) {
                res.send("Failed to get user info:" + req.params.user);
            });
    }

    if (req.query.repo) {
        console.log("REPO IS : " + req.query.repo);
            dbAPI
            .getRepo({repository: req.query.repo})
            .then(function(gotRepo) {
                if (gotRepo && gotRepo.length > 0) {
                  if (req.query.user) {
                    listSnippetsForUser(req.query.user, gotRepo[0]._id);
                  }
                  else {
                      listSnippetsForQuery({repositories: gotRepo[0]._id});
                  }
                }
                else {
                    res.send("Failed to get repository info:" + req.query.repo);
                }
            },
            function(error) {
                 res.send("Failed to get repository info:" + req.params.repo);
            });
    }
    else if (req.query.user) {
        listSnippetsForUser(req.query.user);
    }
    else {
        listSnippetsForQuery(req.query || {});
    }
}); // server get

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
server.post('/api/snippets', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    var data = req.body;

    // Validate that comment and repos are not empty
    if (!data.repos || data.repos.length == 0 || !data.comments || data.comments.length == 0) {
        res.send({error: "Invalid parameter", status: 400});
        return;
    }

    dbAPI
        .createSnippet(data, req.user.id)
        .then(
            function (snippet) {
                res.send(snippet);
                // Update user counter for the created snippets
                // TODO: Identify how to reduce the number of the user
                //       snippets for the current repository
                var update_repo_refs = function(repoId) {
                   // undefined allow us to do not update follow flag
                   // true - means that we need to increase counter
                   dbAPI.upsertUserRepoRef(req.user.id, repoId, undefined, true);
                };
                snippet.repositories.map(update_repo_refs);
            },
            function (error) {
                log.info("GOT SNIPPET PROMISE FAILED");
                res.send({error: "Failed to create snippet", status: 400});
            }); // on create snippet
});

//
// GET snippet details by id
//
server.get('/api/snippets/:id', ensureAuthenticated, function (req, res) {
    dbAPI
        .getSnippetById(req.params.id, req.user.id)
        .then(
            function (snippet) {
                var obj = snippet.toObject();
                obj.owner = req.user.id == snippet.userId;
                res.send(obj);
            },
            function (error) {
                res.send({error: "Failed to create snippet", status: 400});
            });
});

//
// UPDATE - update an existing snippet
//
server.put('/api/snippets/:id', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    var data = req.body;

    // Validate that comment and repos are not empty
    if (!data.repos || data.repos.length == 0 || !data.comments || data.comments.length == 0) {
        res.send({error: "Invalid parameter", status: 400});
        return;
    }
             
    // Update snippet itself
    dbAPI
        .updateSnippet(data, req.user.id)
        .then(
            function (data) {
                res.send(data);
            },
            function (error) {
                res.send({error: "Failed to create snippet", status: 400});
            });
}); // PUT


server.patch('/api/snippets/:id', ensureAuthenticated, function (req, res) {
    console.log(req.body);
    var data = req.body;

    // Update relations to the snippet
    if (req.body.follow == undefined && req.body.star == undefined) {
        res.send({error: "Invalid parameter", status: 400});
        return;
    }

    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // TODO: do not populate snippet's repositories and comments
    //       Just check that snippet exists
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    dbAPI
    .getSnippetById(req.params.id, req.user.id)
    .then(
      function (snippet) {
        if (req.user.id == snippet.userId) {
          res.send({status: 404, error: "It is not possible to follow or star your own snippet"});
          return;
        }
        dbAPI
        .updateSnippetRefs(req.user, snippet, req.body)
        .then(
          function(item) {
            res.send(item);
          },
          function(error) {
            res.send({status: 500, error:error});
          }
        );
        return;
      },
      function (error) {
        log.info("GOT SNIPPET PROMISE FAILED");
        res.send({error: "Failed to create snippet", status: 400});
    });
}); // PATCH


//
// DELETE snipppet by id
//
server.delete('/api/snippets/:id', ensureAuthenticated, function (req, res) {
    dbAPI
        .deleteSnippetById(req.params.id, req.user.id)
        .then(
            function (result) {
                res.send(result);
            },
            function (error) {
                res.send({error: "Failed to remove snippet", status: 400});
            }); // got user complete
}); // DELETE

/////////////////////////////////////////// DASHBOARD API ///////////
//
// Request user subscriptions
//
server.get('/api/dashboard', ensureAuthenticated, function (req, res) {
    console.log("DASHBOARD");
    var page = req.query.page || 0;
    console.log("FFFFFFFFFFF" + req.query.page);
    dbAPI.dashboard(req.user.id, page).then(function (activityLogs) {
        console.log("COMPLETE !!!");
            res.send(activityLogs);
        },
        function (err) {
            console.log("ERROR COMPLETE !!!");
            log.info("ERROR: " + err);
            res.send(err);
        });
});
//
// Request user public activity log
//
server.get('/api/dashboard/:id', ensureAuthenticated, function (req, res) {
    console.log("DASHBOARD: " + req.params.id);
    var page = req.query.page || 0;
    dbAPI.userDashboard(req.params.id, page).then(function (activityLogs) {
        console.log("COMPLETE MINI DASHBOARD!!!");
            res.send(activityLogs);
        },
        function (err) {
            console.log("ERROR COMPLETE MINI DASHBOARD !!!");
            log.info("ERROR: " + err);
            res.send(err);
        });
});

server.get("/", function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect('/github.com/' + req.user.username);
    }
    else
        res.redirect('/index.html');
});

server.get("/js/app/access_token.js", ensureAuthenticated);
server.get("/js/app/access_token.js", function (req, res) {
    res.send("define([], function() { return '" + req.user.accessToken + "'});");
});

// FrontEnd files mappings
// TODO: Add browserify
server.all("/*", function (req, res, next) {
    var fileStream = fs.createReadStream(__dirname + "/../public/index.html");
    fileStream.on('open', function () {
        fileStream.pipe(res);
    });
});

//server.use(server.router);

// Start servier 
// ======

// Start Node.js Server
http.createServer(server).listen(config.get('port'), function () {
    log.info('Express server listening on port ' + config.get('port'));
});
