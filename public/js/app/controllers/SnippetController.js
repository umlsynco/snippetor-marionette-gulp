//
// It should be bridge between snippet and history models
// It should be github independent part and should not provide
// storage specific options for comment and history items
//
//
define([
  'App',
  'backbone',
  'marionette'
],
       function(App, Backbone, Marionette) {
         return Backbone.Marionette.Controller.extend({
           initialize : function(options) {
             // left side history view
             this.server = options.server;
             this.history = options.history;
             this.active_repo_ctl = options.active_repo_ctl;

             var that = this;

             App.addInitializer(function() {
               // 
               App.vent.on("snippet:open", _.bind(that.openSnippet, that));
               App.vent.on("snippet:close", _.bind(that.closeSnippet, that));
               App.vent.on("snippet:reload", _.bind(that.reloadSnippet, that));
               App.vent.on("snippet:save", _.bind(that.saveSnippet, that));
               App.vent.on("snippet:user", _.bind(that.userSnippet, that));
               App.vent.on("snippet:remove", _.bind(that.removeSnippet, that));
               App.vent.on("snippet:fork", _.bind(that.forkSnippet, that));
               App.vent.on("snippet:follow", _.bind(that.followSnippet, that));
               App.vent.on("snippet:star", _.bind(that.starSnippet, that));
             });     // addInitializer
           },
           //
           // Show snippet's user profile
           //
           userSnippet: function() {
             var snippet = this.server.getWorkingSnippet();
             if (snippet) {
                 
             }
           },
           //
           // map snippet data structure to the framework's history
           //
           openSnippet : function(model) {
             model.set({id: model.get("_id")});
             var that = this;
             model.fetch({
                 success: function(dataModel, status) {
                 if (dataModel && that.history) {
                     // RESET CURRENT HISTORY STATUS
                     that.history.getHistoryList().reset();
                     that.active_repo_ctl.reset();
                     
                     dataModel.repos.each(function(repoItem) {
                         that.active_repo_ctl.addSnippetRepo(null, repoItem);
                     });
                     
                     dataModel.comments.each(function(item, idx) {
                         var working_repo = dataModel.repos.where({_id: item.get("repository")});
                         working_repo = (working_repo.length == 0) ? null : working_repo[0];

                         if (working_repo) {
                           var hm = that.history.addHistory({
                               repo: working_repo.get("repository"),
                               branch: working_repo.get("branch"),
                               path: item.get("path"),
                               sha: item.get("sha"),
                               repo_ref: item.get("repository")});
                           item.set({linenum: item.get("line"), id: item.get("_id"), repo_ref: item.get("repository")});
                           hm.comments.add(item);
                         }
                   });
                 }
             }});
             this.server.resetWorkingSnippet(model);
             this.history.resetWorkingSnippet(model);
           },
           //
           // reload current snippet
           //
           reloadSnippet : function() {
               
           },
           //
           //
           //
           saveSnippet : function(snippetModel, data, OnSaveCallback) {
              var list = this.history.getHistoryList();
              var repos  = [];
              var rref = [];
              var nextSnippet = [];
              var that = this;
                  
              var arrayOfPromiseCallmethod = new Array();

              list.each(function(historiItemModel) {
                  var repo_ref = historiItemModel.get("repo_ref");

                  rref.push(historiItemModel.get("repo_ref"));

                  var next = {full_name: historiItemModel.get("repo"), branch: historiItemModel.get("branch"), data_provider: "GitHub"};
                  var idx = -1;
                  for (var t = 0; t < repos.length; ++t) {
                      if (repos[t].repo == next.repo
                        && repos[t].branch == next.branch) {
                            idx = t;
                            break;
                      }
                  }
                  if (idx == -1) {
                      repos.push(next);
                      idx = repos.length - 1;
                  }

                  historiItemModel.comments.each(function(comment) {
                      arrayOfPromiseCallmethod.push(_.bind(that.server.commitComment, that.server, comment, snippetModel));
                      nextSnippet.push(comment);
                  });
              });

              // Update current snippet model
              snippetModel.set({title:data.title, tags: data.hashtags || "", description: data.description, repos: rref});

              arrayOfPromiseCallmethod.push(_.bind(that.server.commitSnippet, that.server, snippetModel, nextSnippet));

              // POST commit snippets to the end
              var commitHandler = function(listOfPromistFuncs, doneCallback) {
                  var itemFunc = listOfPromistFuncs.shift();
                  var promise = itemFunc();
                  promise.then(
                    function(data) {
                        // success
                        if (listOfPromistFuncs.length == 0) {
                            doneCallback(null, data);
                        }
                        else {
                          commitHandler(listOfPromistFuncs, doneCallback);
                        }
                    },
                    function(err) {
                        doneCallback("Save failed: " + err, null);
                    });
              };

              commitHandler(arrayOfPromiseCallmethod, OnSaveCallback);
           },
           //
           // Check if snippet doesn't have
           // changes and close it
           //
           closeSnippet: function() {
             var snippet = this.server.getWorkingSnippet();
             if (snippet) {
               this.server.resetWorkingSnippet(null);
               this.history.getHistoryList().reset();
               this.active_repo_ctl.reset();
             }
           },
           //
           // Fork snippet for user
           //
           forkSnippet : function(snippet) {
               alert("FORK SNIPPET");
           },
           //
           // Star snippet for user
           //
           starSnippet : function(star) {
             var snippet = this.server.getWorkingSnippet();
             if (snippet && snippet.get("_id")) {
                 star ? snippet.star() : snippet.unstar();
             }
           },
           //
           // Remove snippet for user
           //
           removeSnippet : function(snippet) {
             var snippet = this.server.getWorkingSnippet();
             if (snippet) {
               snippet.set({id: snippet.get("_id")});
               snippet.destroy();
               this.server.resetWorkingSnippet(null);
               this.history.getHistoryList().reset();
               this.active_repo_ctl.reset();
             }
           },
           followSnippet: function(follow) {
             var snippet = this.server.getWorkingSnippet();
             if (snippet  && snippet.get("_id")) {
                 follow ? snippet.follow() : snippet.unfollow();
             }
           }
         }); // Controller
       });   // define
