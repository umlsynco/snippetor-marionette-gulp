define( [ 'marionette', 'App'], function(Marionette, App) {

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
         onNavigate: function(e) {
             e.preventDefault();
             App.appRouter.navigate(this.ui.item.attr("href"), {trigger: true});
         }
    });

      return Marionette.CompositeView.extend({
          className: "file-wrap",
          childView: contentItem,
          childViewContainer: "tbody",
          initialize: function(options) {
              this.github = options.githubAPI;
              this.collection = new Backbone.Collection;

              var that = this;
              var repo = this.github.getAPI().getRepo(this.model.get("repo"));
              var branch = this.model.get("branch") || "master";

              var path = this.model.get("path") || "";
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
          template: _.template('\
  <div class="breadcrumb js-zeroclipboard-target">\
    <span class="repo-root js-repo-root"><span itemscope="" itemtype="http://data-vocabulary.org/Breadcrumb"><a href="/github.com/<%= repo %>" class="sp-routing" data-branch="7ce846ec3297d3a0d7272dbfa38427d21f650a35" data-pjax="true" itemscope="url" rel="nofollow"><span itemprop="title"><%= repo %></span></a></span></span><span class="separator">/</span><%= getBreadcrumbs() %>\
    <div class="input-group custom-search-form right" style="padding-right:0px; margin-top: -5px;">\
<form accept-charset="UTF-8" action="/github.com/<%= repo %>/search" class="repo-search" method="get" role="search">\
<div class="input-group">\
                                <input name="utf8" value="✓" type="hidden">\
                                <input name="user" value="umlsynco" type="hidden">\
<span class="input-group-addon beautiful"><span class="fa fa-check-circle-o"></span></span>\
                                <input type="text" class="form-control" name="q" placeholder="Search...">\
                                <span class="input-group-btn">\
                                  <button class="btn btn-default" type="button">\
                                    <i class="fa fa-search"></i>\
                                  </button>\
                                  <button class="btn btn-default" type="button">\
                                    <i class="fa">  File</i>\
                                  </button>\
                                </span></div>\
                              </form></div>\
  </div>\
          <div class="file-navigation js-zeroclipboard-container has-zeroclipboard-disabled">\
<div class="select-menu js-menu-container js-select-menu left">\
  <button class="btn btn-sm select-menu-button js-menu-target css-truncate" data-hotkey="w" title="" type="button" aria-label="Switch branches or tags" tabindex="0" aria-haspopup="true">\
    <i>Tree:</i>\
    <span class="js-select-button css-truncate-target">7ce846ec32</span>\
  </button>\
\
  <div class="select-menu-modal-holder js-menu-content js-navigation-container" data-pjax="" aria-hidden="true">\
\
    <div class="select-menu-modal">\
      <div class="select-menu-header">\
        <svg aria-label="Close" class="octicon octicon-x js-menu-close" height="16" role="img" version="1.1" viewBox="0 0 12 16" width="12"><path d="M7.48 8l3.75 3.75-1.48 1.48-3.75-3.75-3.75 3.75-1.48-1.48 3.75-3.75L0.77 4.25l1.48-1.48 3.75 3.75 3.75-3.75 1.48 1.48-3.75 3.75z"></path></svg>\
        <span class="select-menu-title">Switch branches/tags</span>\
      </div>\
\
      <div class="select-menu-filters">\
        <div class="select-menu-text-filter">\
          <input aria-label="Find or create a branch…" id="context-commitish-filter-field" class="js-filterable-field js-navigation-enable" placeholder="Find or create a branch…" type="text">\
        </div>\
        <div class="select-menu-tabs">\
          <ul>\
            <li class="select-menu-tab">\
              <a href="#" data-tab-filter="branches" data-filter-placeholder="Find or create a branch…" class="js-select-menu-tab" role="tab">Branches</a>\
            </li>\
            <li class="select-menu-tab">\
              <a href="#" data-tab-filter="tags" data-filter-placeholder="Find a tag…" class="js-select-menu-tab" role="tab">Tags</a>\
            </li>\
          </ul>\
        </div>\
      </div>\
\
      <div class="select-menu-list select-menu-tab-bucket js-select-menu-tab-bucket" data-tab-filter="branches" role="menu">\
\
        <div data-filterable-for="context-commitish-filter-field" data-filterable-type="substring">\
\
\
            <a class="select-menu-item js-navigation-item js-navigation-open " href="/umlsynco/umlsync-framework/blob/master/css/speachBubble.css" data-name="master" data-skip-pjax="true" rel="nofollow">\
              <svg aria-hidden="true" class="octicon octicon-check select-menu-item-icon" height="16" role="img" version="1.1" viewBox="0 0 12 16" width="12"><path d="M12 5L4 13 0 9l1.5-1.5 2.5 2.5 6.5-6.5 1.5 1.5z"></path></svg>\
              <span class="select-menu-item-text css-truncate-target" title="master">\
                master\
              </span>\
            </a>\
        </div>\
\
          <form accept-charset="UTF-8" action="/umlsynco/umlsync-framework/branches" class="js-create-branch select-menu-item select-menu-new-item-form js-navigation-item js-new-item-form" data-form-nonce="22b7455b24aa4c8e2262fb34e8b218be1a6340c3" method="post"><div style="margin:0;padding:0;display:inline"><input name="utf8" value="✓" type="hidden"><input name="authenticity_token" value="whr7g4rusJDTE8oZyBOxSikT5z62u3H1aKsCGyaZ5u/jZqU3MgzAhchbAo9DEFCI5tNpN2++dbnBBT7UAi50SQ==" type="hidden"></div>\
          <svg aria-hidden="true" class="octicon octicon-git-branch select-menu-item-icon" height="16" role="img" version="1.1" viewBox="0 0 10 16" width="10"><path d="M10 5c0-1.11-0.89-2-2-2s-2 0.89-2 2c0 0.73 0.41 1.38 1 1.72v0.3c-0.02 0.52-0.23 0.98-0.63 1.38s-0.86 0.61-1.38 0.63c-0.83 0.02-1.48 0.16-2 0.45V4.72c0.59-0.34 1-0.98 1-1.72 0-1.11-0.89-2-2-2S0 1.89 0 3c0 0.73 0.41 1.38 1 1.72v6.56C0.41 11.63 0 12.27 0 13c0 1.11 0.89 2 2 2s2-0.89 2-2c0-0.53-0.2-1-0.53-1.36 0.09-0.06 0.48-0.41 0.59-0.47 0.25-0.11 0.56-0.17 0.94-0.17 1.05-0.05 1.95-0.45 2.75-1.25s1.2-1.98 1.25-3.02h-0.02c0.61-0.36 1.02-1 1.02-1.73zM2 1.8c0.66 0 1.2 0.55 1.2 1.2s-0.55 1.2-1.2 1.2-1.2-0.55-1.2-1.2 0.55-1.2 1.2-1.2z m0 12.41c-0.66 0-1.2-0.55-1.2-1.2s0.55-1.2 1.2-1.2 1.2 0.55 1.2 1.2-0.55 1.2-1.2 1.2z m6-8c-0.66 0-1.2-0.55-1.2-1.2s0.55-1.2 1.2-1.2 1.2 0.55 1.2 1.2-0.55 1.2-1.2 1.2z"></path></svg>\
            <div class="select-menu-item-text">\
              <span class="select-menu-item-heading">Create branch: <span class="js-new-item-name"></span></span>\
              <span class="description">from ‘7ce846e’</span>\
            </div>\
            <input name="name" id="name" class="js-new-item-value" type="hidden">\
            <input name="branch" id="branch" value="7ce846ec3297d3a0d7272dbfa38427d21f650a35" type="hidden">\
            <input name="path" id="path" value="css/speachBubble.css" type="hidden">\
</form>\
      </div>\
\
      <div class="select-menu-list select-menu-tab-bucket js-select-menu-tab-bucket" data-tab-filter="tags">\
        <div data-filterable-for="context-commitish-filter-field" data-filterable-type="substring">\
\
\
        </div>\
\
        <div class="select-menu-no-results">Nothing to show</div>\
      </div>\
\
    </div>\
  </div>\
</div>\
\
  <div class="btn-group right">\
    <a href="/umlsynco/umlsync-framework/find/7ce846ec3297d3a0d7272dbfa38427d21f650a35" class="js-show-file-finder btn btn-sm" data-pjax="" data-hotkey="t">\
      Find file\
    </a>\
    \
  </div>\
</div>\
               <a href="/tehmaze/diagram/tree/24c3ba0cf7b3f3abdb0e9312b440099f8ff16d3e" class="hidden js-permalink-shortcut" data-hotkey="y">Permalink</a>\
               <table class="files js-navigation-container js-active-navigation-container" data-pjax="">\
    <tbody>\
      <tr class="warning include-fragment-error">\
        <td class="icon"><svg aria-hidden="true" class="octicon octicon-alert" height="16" role="img" version="1.1" viewBox="0 0 16 16" width="16"><path d="M15.72 12.5l-6.85-11.98C8.69 0.21 8.36 0.02 8 0.02s-0.69 0.19-0.87 0.5l-6.85 11.98c-0.18 0.31-0.18 0.69 0 1C0.47 13.81 0.8 14 1.15 14h13.7c0.36 0 0.69-0.19 0.86-0.5S15.89 12.81 15.72 12.5zM9 12H7V10h2V12zM9 9H7V5h2V9z"></path></svg></td>\
        <td class="content" colspan="3">Failed to load latest commit information.</td>\
      </tr>\
    </tbody>\
  </table>')

      });
});

