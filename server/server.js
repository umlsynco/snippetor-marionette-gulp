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

            log.info("PROFILE IIIIIIIIIIIIIIIIID = " + profile.id);
            log.info("TOKEN !!! = " + accessToken);

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
                    log.info("ERROR:" + err);
                    return done(err);
                } else {
                    log.info("USER: " + (user ? user._id : " NEW USER !!!"));
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
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    console.log(req.session);
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    if (req.isAuthenticated()) {
        //res.header('Access-Control-Allow-Credentials', 'true');
        return next();
    } else {
        console.log("ERROR");
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
    getUserByName: function (name) {
        return new Promise(function (resolve, reject) {
            models.GithubUserModel.findOne({username: name}, function (error, realUser) {
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
    followUser: function (userId, followId) {
        return new Promise(function (resolve, reject) {
            var followme = model.GithubUserFollow({
                user: userId,
                follow: followId
            });

            followme
                .save(function (err, snippet) {
                    if (err) {
                        log.info(err);
                        reject({message: "Failed to create snippet: ", staus: 500});
                    }
                    else {
                        log.info("DONE SNIPPET");
                        resolve(snippet);
                    }
                }); // save
        });
    },
    checkRepoFollowing: function (userId, repoId) {
        return new Promise(function (resolve, reject) {
            console.log({user: userId, repository: repoId});
            models.GithubUserRefs.findOne({user: userId, repository: repoId},
                function (err, item) {
                    if (err || !item) {
                        reject();
                        log.info("NOTHING FOUND: " + err + ":   : " + item);
                    }
                    else {
                        log.info("FOUND FOLLOW: " + item);
                        resolve(item.follow);
                    }
                });
        });
    },
    followRepo: function (userId, repoId, follow) {
        return new Promise(function (resolve, reject) {
            var searchQuery = {
                user: userId,
                repository: repoId
            };

            var updates = {
                user: userId,
                repository: repoId,
                follow: follow
            };

            var options = {
                upsert: true,
                new: true
            };

            // update the user data if it is exist or add a new user data
            models.GithubUserRefs.findOneAndUpdate(searchQuery, updates, options, function (err, userRef) {
                if (err || !userRef) {
                    log.info("ERROR:" + err);
                    return reject(err);
                } else {
                    log.info("USER REF: " + (userRef ? userRef._id : " NEW USER REF!!!"));
                    console.log(userRef);
                    return resolve(userRef);
                }
            });
        });
    },
    //
    // Repository APIs
    //
    getRepoById: function (id) {
        return new Promise(function (resolve, reject) {
            models.GithubRepoModel.findById(id, function (error, realRepo) {
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
    getRepo: function (descr) {
        return new Promise(function (resolve, reject) {
            models.GithubRepoModel.findOne(descr, function (error, realRepo) {
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
    createRepo: function (descr) {
        return new Promise(function (resolve, reject) {
            var newRepo = models.GithubRepoModel({
                repository: descr.repository,
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
    listSnippet: function (options) {
        options = options || {};
        return new Promise(function (resolve, reject) {
            models
                .SnippetItemModel
                .find(options)
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
                        log.info("FOUND SNIPPET");
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
                .remove()
                .exec(function (err) {
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
                    console.log("ERROR: " + err);
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

server.get('/api/users', function (req, res) {
    if (!req.query.username) {
        return res.send({error: 'Not enough parameters'});
    }

    dbAPI
        .getUserByName(req.query.username)
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
    if (!req.query.follow) {
        res.send({status: 400, error: "Only follow parameter update supported"});
        return;
    }
    return userModel.findById(req.params.id, function (err, user) {
        if (!user) {
            res.statusCode = 404;
            return res.send({error: 'Not found'});
        }
        if (!err) {
            dbAPI.followUser(req.user.id, user._id);
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
            .followRepo(req.user.id, foundRepo.id, req.body.follow)
            .then(function(obj) {
                // Increase/decrease followers
                
// TODO: Compare the previous value with a new one, and do nothing if nothing changed
console.log("BODU IS: " + req.body.follow);
var what_is_going_on = 
(foundRepo.followers == undefined || foundRepo.followers < 0 ? {$set: {followers: 0}} :
                  {$inc: {followers: (req.body.follow == "true" ? 1 : -1)}});

                  console.log(what_is_going_on);

                models.GithubRepoModel.update(foundRepo, what_is_going_on, {wait:true}, function(err, data) {
                      console.log(err);
                      console.log(data);
                      console.log(foundRepo);
                      });
                res.send(obj);
            },
            function(err) {
                res.send({status: 500, error: "Failed to setup the 'follow' status: " + err});
            });
        },
        function (err) {
            log.info("ERROR: " + err);
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

    //log.info("GOT USER PROMISE DONE" + req.session.);
    log.info("_ID: " + req.user._id);
    log.info("ID:" + req.user.id);

    function listSnippetsForQuery(query) {
        dbAPI.listSnippet(query).then(function (snippets) {
                res.send({hasNext: false, limit: 13, page: 0, snippets: snippets});
            },
            function (err) {
                res.send("Failed to get user snippets:" + err);
            });
    }

    if (req.query.user) {
        dbAPI.getUserByName(req.query.user).then(
            function (realUser) {
                if (!realUser) {
                    res.send("No user found:" + req.query.user);
                    return;
                }

                listSnippetsForQuery({userId: realUser._id});
            },
            function (error) {
                res.send("Failed to get user info:" + req.params.user);
            });
    }
    else {
        listSnippetsForQuery({});
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
                res.send(snippet);
            },
            function (error) {
                log.info("GOT SNIPPET PROMISE FAILED");
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
