define(['App', 'backbone', 'marionette'], function (App, Backbone, Marionette) {
    var SERVER_API_URL = "/api/";

    // Repository Models
    var repositoryModel = Backbone.Model.extend({
       rootUrl: SERVER_API_URL + "repos" 
    });

    var repositoryModel = Backbone.Collection.extend({
       onAdd: {
       }
    });

    //
    // User model
    //
    var userModel = Backbone.Model.extend({
       rootUrl: SERVER_API_URL + "repos" 
    });

    //
    // user repo search model
    //
    var userRepoModel = Backbone.Model.extend({
       rootUrl: SERVER_API_URL + "repos" 
    });
    
    return Backbone.Marionette.Controller.extend({
        initialize:function (options) {
        },
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
