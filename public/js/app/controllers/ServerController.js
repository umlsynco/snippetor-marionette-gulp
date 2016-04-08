define(['App', 'backbone', 'marionette'], function (App, Backbone, Marionette) {
    var SERVER_API_URL = "/api/";

    // Repository Models
    var repositoryModel = Backbone.Model.extend({
       urlRoot: SERVER_API_URL + "repos"
    });

    var repositoryCollection = Backbone.Collection.extend({
       url: SERVER_API_URL + "repos",
       model: repositoryModel
    });
    
    var serverComment = Backbone.Model.extend({
       urlRoot: SERVER_API_URL + "comments"
    });

    var commentsCollection = Backbone.Collection.extend({
       url: SERVER_API_URL + "comments",
       model: serverComment
    });

    //
    // User model
    //
    var userModel = Backbone.Model.extend({
       rootUrl: SERVER_API_URL + "user" 
    });

    //
    // user repo search model
    //
    var userRepoModel = Backbone.Model.extend({
       rootUrl: SERVER_API_URL + "user/repos" 
    });
    
    return Backbone.Marionette.Controller.extend({
        initialize:function (options) {
        },
        getRepoModel(data, callback) {
            var collection = new repositoryCollection();
            collection
            .fetch({data: data})
            .then(function(models) {
              var item = null;
              if (!models) 
                callback("SOMETHING WRONG WITH GETTING SERVER API !!!", null);

              if (models.length == 0) {
                // Create a new repository model but do not save it
                item = new repositoryModel(data);
              }
              else {
                item = new repositoryModel(models[0]);
              }
              callback(null, item);
            });
        },
        //
        // Get an opened working snippet
        // OR create a new model
        //
        getWorkingSnippet: function() {
            return new Backbone.Model({type:"new-snippet"});
        },
        //
        // 
        //
        getCommentModel: function(data) {
          return new serverComment({comment: data.comment, linenum: data.linenum, line: data.linenum, path: data.path, sha: data.sha, repository: data.repository});
        },
        //
        // There are several options for comments:
        // 1 Commit a new comment => post create
        // 2 Commit an existing comment:
        // 2.1 nothing changed => do nothing, return
        // 2.2 ajax put an update
        //
        commitComment: function(commentModel, historyItem) {
            return new Promise(function(resolve, reject) {
                var save_options = {wait:true, patch: false};

                // update model if it was fetched
                if (!commentModel.isNew()) {
                    save_options.patch = true;
                }

                // trigger post or update
                commentModel.save({
                  succes:function(saved_model) {
                      resolve(saved_mode._id);
                  },
                  error: function(error_msg) {
                      reject(error_msg);
                  },
                  save_options});
               }); // save
        }
/*        // User:
        user: {
           getUserInfo: function(name) {
           }
        },
        // Repo
        repo: {
           getRepoById: function(_id) {
           },
           loadRepo: function(full_name, branch) {
               // if (!findRepoByName) {
               //   requestRepo from service
               // if (!found on server)
               // createRepo
           },
           findRepoByName: function(full_name, branch) {
           },
           createRepo: function(full_name) {
           }
        },
        snippet: {
           getSnippetsByUserId: function(user_id, limit, page) {
           },
           getSnippetsByRepoId: function(repo_id, limit, page) {
           },
           getCommentsBySnippetId: function(snippet_id) {
           }
        }*/
    });
}); // define
