define( [ 'marionette', 'App', 'text!templates/directory_raw_list.html'], function(Marionette, App, rawDirectoryTemplate) {

      // GitHub Repository item description:
      var contentItem = Marionette.ItemView.extend({
         template: _.template('\
        <tr class="js-navigation-item">\
          <td class="icon"><%= getItemIcon() %><img alt="" class="spinner" src="https://assets-cdn.github.com/images/spinners/octocat-spinner-32.gif" width="16" height="16"></td>\
          <td class="content">\
            <span class="css-truncate css-truncate-target"><a href="/github.com/<%= getRepo() %>/<%= getType() %>/master/<%= path %>" gtype="<%= type %>" class="sp-item js-directory-link js-navigation-open" id="<%= sha %>" title="<%= getTitle() %>"><%= getTitle() %></a></span>\
          </td>\
          <td class="message">\
            <span class="css-truncate css-truncate-target">\
                  <a href="commit_message_TBD" class="message" data-pjax="true" title="Version 0.2.25">Version 0.2.25</a>\
            </span>\
          </td>\
          <td class="age">\
            <span class="css-truncate css-truncate-target"><time title="24 дек. 2015 г., 19:11 GMT+4" datetime="2015-12-24T15:11:34Z" is="time-ago">a month ago</time></span>\
          </td>\
        </tr>'),
         templateHelpers: function(){
           return {
             getItemIcon: function(){
               return (this["type"] == "file" || this["type"] == "blob" ?
                      '<svg aria-hidden="true" class="octicon octicon-file-text" height="16" role="img" version="1.1" viewBox="0 0 12 16" width="12"><path d="M6 5H2v-1h4v1zM2 8h7v-1H2v1z m0 2h7v-1H2v1z m0 2h7v-1H2v1z m10-7.5v9.5c0 0.55-0.45 1-1 1H1c-0.55 0-1-0.45-1-1V2c0-0.55 0.45-1 1-1h7.5l3.5 3.5z m-1 0.5L8 2H1v12h10V5z"></path></svg>'
                      : '<svg aria-hidden="true" class="octicon octicon-file-directory" height="16" role="img" version="1.1" viewBox="0 0 14 16" width="14"><path d="M13 4H7v-1c0-0.66-0.31-1-1-1H1c-0.55 0-1 0.45-1 1v10c0 0.55 0.45 1 1 1h12c0.55 0 1-0.45 1-1V5c0-0.55-0.45-1-1-1z m-7 0H1v-1h5v1z"></path></svg>');
             },
             getTitle: function(){
               return (this["path"].split("/").pop());
             },
             getType: function() {
                 if (this["type"] == "file" || this["type"] == "blob") return "blob";
                 return "tree";
             },
             getRepo: function() {
                 if (this["repo"]) return this["repo"];
             }
           }
         },
         ui : {
             "item": "A.sp-item"
         },
         events: {
             "click @ui.item" : "onNavigate"
         },
         modelEvents: {
           "change hidden": "hideView"
         },
         hideView: function() {
           if (this.$el)
             (this.model.get("hidden") ? this.$el.hide() : this.$el.show())

         },
         onNavigate: function(e) {
             e.preventDefault();
             App.appRouter.navigate(this.ui.item.attr("href"), {trigger: true});
         }
      });

      return Marionette.CompositeView.extend({
          className: "file-wrap",
          childView: contentItem,
          childViewContainer: "tbody",
          emptyView: Marionette.ItemView.extend({
              template: _.template("<h1 class='has-error' style='color:red;'>&nbsp;&nbsp;&nbsp;\
              Loading ... <br>&nbsp;&nbsp;&nbsp;</h1>")
          }),
          events: {
            "click span.sp-search-checker": "toggleSearchCheck",
            "keyup input.sp-dir-search-filter": "filterDirectory"
          },
          // TODO: Move this functionality into the separate popupp
          filterDirectory: function(event) {
            var text = this.$el.find("input.sp-dir-search-filter").val();
            var doFilter = text != "";
            this.collection.each(function(file) {
              var name = file.get("name") || file.get("path");
              var hasIt = name.indexOf(text) == -1;
              file.set("hidden", doFilter && hasIt);
            });
          },
          searchInScope: true,
          toggleSearchCheck: function() {
            this.searchInScope = !this.searchInScope;
            var $scope = this.$el.find("span.sp-search-checker>span");

            // trigger sexy checkbox
            if (!this.searchInScope) {
              $scope.removeClass("fa-check-circle-o")
              $scope.addClass("fa-circle-o");

            }
            else {
              $scope.addClass("fa-check-circle-o")
              $scope.removeClass("fa-circle-o");
            }
            // disable/enable form "path" scope
            this.$el
            .find("input.sp-search-path")
            .prop("disabled", !this.searchInScope);
          },
          initialize: function(options) {
              this.github = options.githubAPI;
              this.collection = new Backbone.Collection;

              var that = this;
              var repo = this.github.getAPI().getRepo(this.model.get("repo"));
              var branch = this.model.get("branch") || "master";

              var path = this.model.get("path") || "";
              this.model.set("path", path);
              var repoName = this.model.get("repo");

              if (path != "") {
                 repo.read(branch, path, function(err, data) {
                     if (data) {
                       _.each(data, function(val) {
                           val.repo = repoName;
                       });
                       that.collection.add(data);
                     }
                 });
             }
             else {
                 repo.getSha(branch, path, function(err, sha) {
                     if (sha)
                       repo.getTree(sha, function(err, data) {
                           if (data) {
                                _.each(data, function(val) {
                                    val.repo = repoName;
                               });
                               that.collection.add(data);
                          }
                     });
                 });
             }
          },
          templateHelpers: function(){
           return {
             getBreadcrumbs: function(){
                 if(!this.path) return "";

                 var result = "";
                 var subpath = "";
                 var paths = (this.path || "").split("/");
                 for(var i = 0; i<paths.length; ++i) {
                     subpath = subpath + "/" + paths[i];
                     if (i !=paths.length -1) {
                        result += '<span itemscope="" itemtype="http://data-vocabulary.org/Breadcrumb"><a href="/github.com/'+this.repo+'/tree/master'+ subpath + '" class="sp-routing" data-branch="7ce846ec3297d3a0d7272dbfa38427d21f650a35" data-pjax="true" itemscope="url" rel="nofollow"><span itemprop="title">'+paths[i]+'</span></a></span></span><span class="separator">/</span>';
                     }
                     // Final path is not selectable
                     else {
                       result += '<strong class="final-path">'+paths[i]+'</strong>'
                     }
                 } // for
                 return result;
                 // <span itemscope="" itemtype="http://data-vocabulary.org/Breadcrumb"><a href="/github.com/<%= repo%>" class="" data-branch="7ce846ec3297d3a0d7272dbfa38427d21f650a35" data-pjax="true" itemscope="url" rel="nofollow"><span itemprop="title"><%= repo %></span></a></span></span><span class="separator">/</span><span itemscope="" itemtype="http://data-vocabulary.org/Breadcrumb"><a href="/umlsynco/umlsync-framework/tree/7ce846ec3297d3a0d7272dbfa38427d21f650a35/css" class="" data-branch="7ce846ec3297d3a0d7272dbfa38427d21f650a35" data-pjax="true" itemscope="url" rel="nofollow"><span itemprop="title">css</span></a></span><span class="separator">/</span><strong class="final-path">speachBubble.css</strong>
             }
           };
          },
          onRender: function() {
              this.$el.find("a.sp-routing").click(function(e) {
                  e.stopPropagation();
                  e.preventDefault();
                  App.appRouter.navigate($(this).attr("href"), {trigger: true});
              });
          },
          behaviors: {
              PreventSubmission: {}
          },
          template: _.template(rawDirectoryTemplate)
      });
});
