define( [ 'marionette', 'base-64', 'App', 'text!templates/new_snippet.html'], function(Marionette, base64, App, templateNewSnippet) {
      return Marionette.ItemView.extend({
		  className: "issues-listing",
          ui: {
              save: "button.sp-submit-all",
              title: "input#issue_title",
              hashtags: "#issue_hashtag",
              description: "#issue_body"

          },
          events: {
              "click @ui.save": "onSave"
          },
          onSave: function(e) {
              e.preventDefault();
              
              App.vent.trigger("snippet:save", this.model,
                {title:this.ui.title.val(), hashtags: this.ui.hashtags.val(), description: this.ui.description.val()},
                // On Complete Callback
                function(error, data) {
                  if (!error) {
                      App.appRouter.navigate("/github.com/snippets", {trigger:true});
                  }
                  else {
                     // Keep state and try again
                     alert("FAILED: " + error);
                  }
              });
/*              var list = this.snippetor.getHistoryList();
              var repos  = [];
              var rref = [];
              var nextSnippet = [];
              var that = this;
                  
              var arrayOfPromiseCallmethod = new Array();

              list.each(function(model) {
                  var repo_ref = model.get("repo_ref");

                  rref.push(model.get("repo_ref"));

                  var next = {full_name: model.get("repo"), branch: model.get("branch"), data_provider: "GitHub"};
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

                  model.comments.each(function(comment) {
                      // @param comment - snippet comment
                      // @param model - history item model 
                      // TBD ? where is repo_id ????
                      arrayOfPromiseCallmethod.push(_.bind(that.server.commitComment, that.server, comment, model));

                      // that.server.commitComment(comment, model);
                      nextSnippet.push(comment); // {comment: comment.get("comment"), line: comment.get("linenum"), path: model.get("path"), repoId: idx});
                  });
              });

// Update current model
this.model.set({title:this.ui.title.val(), tags: this.ui.hashtags.val(), description: this.ui.description.val(), repos: rref});

              arrayOfPromiseCallmethod.push(_.bind(that.server.commitSnippet, that.server, this.model, nextSnippet));

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

              commitHandler(arrayOfPromiseCallmethod, function(error, data) {
                  if (!error) {
                      App.appRouter.navigate("/github.com/snippets", {trigger:true});
                  }
                  else {
                     // Keep state and try again
                     alert("FAILED: " + error);
                  }
              });*/
          },
		  initialize: function(options) {
              // github api
//              this.github = options.githubAPI;
//              cachedGithub = this.github;
			  this.snippetor = options.snippetorAPI;
              this.server = options.serverAPI;

              this.all_items = this.snippetor.getNextPrevController();
              var that = this;
              this.all_items.collection.on("add remove", function(model, action) {
                that.$el.find("button.sp-submit-all").prop("disabled", model.collection.length == 0);
              });
//              this.collection = this.snippetor.getHistoryList();

              // return opened snippet reference or create an new model
			  this.model = this.server.getWorkingSnippet();
		  },
          onRender: function() {
              this.$el.find("button.sp-submit-all").prop("disabled", this.all_items.collection.length == 0);
              if (this.model.get("tags"))
              this.$el.find("input#issue_hashtag").attr("value", this.model.get("tags"));
              if (this.model.get("name"))
              this.$el.find("input#issue_title").attr("value", this.model.get("name"));
              if (this.model.get("description"))
              this.$el.find("textarea#issue_body").text(this.model.get("description"));
          },
          template: function() {
              return _.template(templateNewSnippet);
          }

      });
});

