define(['App', 'backbone', 'marionette'], function (App, Backbone, Marionette) {
/*
(function() {

  var proxiedSync = Backbone.sync;

  Backbone.sync = function(method, model, options) {
    options || (options = {});

    if (!options.crossDomain) {
      options.crossDomain = true;
    }

    if (!options.xhrFields) {
      options.xhrFields = {withCredentials:true};
    }

    return proxiedSync(method, model, options);
  };
})();
*/
  var SERVER_API_URL = "/api/";

  // Repository Models
  var repositoryModel =
      Backbone.Model.extend({urlRoot : SERVER_API_URL + "repos"});

  var repositoryCollection = Backbone.Collection.extend(
      {url : SERVER_API_URL + "repos", model : repositoryModel});

  // SERVER models
  var serverComment =
      Backbone.Model.extend({urlRoot : SERVER_API_URL + "comments"});

  var commentsCollection = Backbone.Collection.extend(
      {url : SERVER_API_URL + "comments", model : serverComment});

  // SNIPPETS models
  var snippetItem =
      Backbone.Model.extend({
          defaults: {
              type : "new-snippet"
          },
          urlRoot : SERVER_API_URL + "snippets",
          comments: [],
          repositories: [],
          parse : function(response, options){
             if (options.collection) return response;
             // models of comments
             this.comments = new commentsCollection(response.comments);
             this.repos = new repositoryCollection(response.repositories);
             // clean current model
             response.comments = [];
             response.repos = [];
             return response;
          } // parse
          });

  var snippetsCollection = Backbone.Collection.extend(
      {url : SERVER_API_URL + "snippets",
       model : snippetItem,
       limit: 13,
       hasNextPage: false,
       hasNext: function() { return false; },

       parse : function(response, options) {
          this.hasNextPage = response.hasNext || false;
          this.page = response.page;
          this.limit = response.limit; // Changed on the nearest supported limit
          return response.snippets;
       }
       });

  //
  // User model
  //
  var userModel = Backbone.Model.extend({rootUrl : SERVER_API_URL + "user"});

  //
  // user repo search model
  //
  var userRepoModel =
      Backbone.Model.extend({rootUrl : SERVER_API_URL + "user/repos"});
    
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
    } else {
      item = new repositoryModel(models[0]);
    }
    callback(null, item);
            });
        },
        working_snippet: null,
        resetWorkingSnippet: function(ws) {
            this.working_snippet = ws;
        },
        //
        // Get an opened working snippet
        // OR create a new model
        //
        getWorkingSnippet: function() {
            if (!this.working_snippet)
              this.working_snippet = new snippetItem();
           return this.working_snippet;
        },
        //
        // 
        //
        getCommentModel: function(data) {
  return new serverComment({
    comment : data.comment,
    linenum : data.linenum,
    line : data.linenum,
    path : data.path,
    sha : data.sha,
    repository : data.repository
  });
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
    // update model if it was fetched
    var save_options = {
      wait : true,
      patch : !commentModel.isNew()
    };

    // Nothing to update
    if (save_options.patch && !commentModel.hasChanged("comment") && !commentModel.hasChanged("line")) {
      resolve(commentModel);
      return;
    }

    // trigger post or update
    commentModel.save(
      {},
      {
        success : function(saved_model) {
          resolve(saved_model);
        },
        error : function(error_msg) {
          reject(error_msg);
       }},
       save_options
    );// save
  });  // Promise
        }, // commitComment
    commitSnippet: function(snippetModel, comments) {
  return new Promise(function(resolve, reject) {
      
    var save_options = {
      wait : true,
      patch : false
    };

    var coms = [];
    for (var i =0; i < comments.length; ++i) {
        coms.push(comments[i].get("_id"));
    }

    snippetModel.set({comments:coms});

    // update model if it was fetched
    if (!snippetModel.isNew()) {
      save_options.patch = true;
    }

    // trigger post or update
    snippetModel.save(
      {},
      {
        success : function(saved_model) {
          resolve(saved_model._id);
        },
        error : function(error_msg) {
          reject(error_msg);
       }},
       save_options
    );// save
  });  // Promise
        }, // commitSnippet
        //
        // Get snippets:
        // @param data - fetch data
        //    user - user name, by default it is current user
        //    repo - repository name
        //    regexp - regexp for title and description
        //
        getSnippets: function() {
            return (new snippetsCollection());
        }
}); // return Controller
}); // define
