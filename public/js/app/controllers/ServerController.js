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
