define( [ 'marionette', 'base-64', 'App', 'text!templates/new_snippet.html'], function(Marionette, base64, App, templateNewSnippet) {
      /*var cachedGithub = null;
  	  var ContentView  = Marionette.ItemView.extend({
		 tagName: "pre",
		 className: "prettyprint linenums:1",
         template: _.template('<code class="html"><%= getContent() %></code>'),
         templateHelpers: function(){
		   var content = this.options.content;
           return {
             getContent: function(){
                if (!content) return;
				var res = content.replace(/\</g, "&lt;");
				res = res.replace(/\>/g, "&gt;");
				return res;
			 }
		   };
		 },
		 ui: {
			 code: "code.html"
		 },
		 onRender: function() {
			 prettyPrint();
		 }
      });

      var codeSearchItem = Marionette.LayoutView.extend({
         template: _.template('\
<div class="code-list-item code-list-item-public repo-specific">\
  <span class="language"><%= getLanguage() %></span>\
  <p class="title">\
      <a  class="sp-github-blob-id" sha="<%= sha %>" repo="<%= full_name() %>" href="/github.com/<%= full_name() %>/blob/master/<%= path %>"><%= path %></a> <br>\
      <span class="text-small text-muted match-count">Showing the top three matches.</span>\
      <span class="text-small text-muted updated-at">Last indexed <time title="11 окт. 2015 г., 13:12 GMT+4" datetime="2015-10-11T09:12:25Z" is="relative-time">on 11 Oct 2015</time>.</span>\
  </p>\
  <div class="file-box blob-wrapper" id="<%= sha %>" repo="<%= full_name() %>"></div>\
 </div><br>'),
         templateHelpers: function(){
           return {
			 sha: this.model.get("sha"),
             full_name: function(){ 
               return this["repo"];
             },
             getLanguage: function() {
				return  (this["language"]  ? this["language"] : '');
			 }
           }
         },
         regions: {
			 "content": "DIV.file-box"
		 },
		 onRender: function(options) {
			 // Request code
			 var repo = cachedGithub.getRepo(this.model.get("repo"));
			 var that = this;
			 repo.contents(this.model.get("branch"), this.model.get("path"), function(err, data) {
               if (data && data.encoding == "base64") {
                 var content = base64.decode(data.content);
                 that.content.show(new ContentView({content: content}));
               }
			 });

             this.$el.find("a.sp-github-blob-id").click(function(e) {
                  e.stopPropagation();
                  e.preventDefault();
                  App.appRouter.navigate($(this).attr("href"), {trigger: true});
             });
		 }
    });

	*/
      return Marionette.ItemView.extend({
		  className: "issues-listing",
//		  childView: codeSearchItem,
//		  childViewContainer: "DIV.code-list",
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
              var list = this.snippetor.getHistoryList();
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
                     alert("FAILED: " + msg);
                  }
              });

      /*        var result = JSON.stringify({
                  title:this.ui.title.val(),
                  tags: this.ui.hashtags.val(),
                  description: this.ui.description.val(),
                  repos: repos,
                  comments: nextSnippet
              });

              $.ajax({
                  url: "/api/snippets",
                  type: "POST",
                  data: {title:this.ui.title.val(), tags: this.ui.hashtags.val(), description: this.ui.description.val(), repos: repos, comments: nextSnippet},
                  success: function(bxzzz) {alert(bxzzz);},
                  dataType: "JSON"
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
          },
          template: _.template(templateNewSnippet)

      });
});

