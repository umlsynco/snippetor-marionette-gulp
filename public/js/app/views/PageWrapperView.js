define( [ 'marionette',
          "views/github/SearchRepoView", "views/github/SearchCodeInRepo", // search views
          "views/github/ListRootView", // "views/github/ListBranchRootView", "views/github/ListSubTreeView", // Tree views
          "views/github/ShowContentView",
          "views/github/UserProfile",
          "views/snippets/SnippetsView", "views/snippets/NewSnippetView"], // content view
    function(Marionette,
             gSearchRepoView, gSearchCodeView, gListTreeRoot, gShowContentView, // GitHub related views
             gUserProfile, // Github User information
             SnippetsView, NewSnippetView) { // Snippetor's views

        // Collection of the different content which was loaded
        return Marionette.CompositeView.extend({
            template: _.template('\
            <h3 class="entry-title public ">\
  <svg aria-hidden="true" class="octicon octicon-repo" height="16" role="img" version="1.1" viewBox="0 0 12 16" width="12"><path d="M4 9h-1v-1h1v1z m0-3h-1v1h1v-1z m0-2h-1v1h1v-1z m0-2h-1v1h1v-1z m8-1v12c0 0.55-0.45 1-1 1H6v2l-1.5-1.5-1.5 1.5V14H1c-0.55 0-1-0.45-1-1V1C0 0.45 0.45 0 1 0h10c0.55 0 1 0.45 1 1z m-1 10H1v2h2v-1h3v1h5V11z m0-10H2v9h9V1z"></path></svg>\
  <span class="author" itemprop="author"><a href="/umlsynco" class="url fn" rel="author">umlsynco</a></span><!--\
--><span class="path-divider">/</span><!--\
--><strong itemprop="name"><a href="/umlsynco/snippetor-marionette-gulp" data-pjax="#js-repo-pjax-container">snippetor-marionette-gulp</a></strong>\
\
<a href="/github.com/search" class="tabnav-tab " aria-selected="false" role="tab">\
            <svg aria-hidden="true" class="octicon octicon-diff-added" height="16" role="img" version="1.1" viewBox="0 0 14 16" width="14"><path d="M13 1H1C0.45 1 0 1.45 0 2v12c0 0.55 0.45 1 1 1h12c0.55 0 1-0.45 1-1V2c0-0.55-0.45-1-1-1z m0 13H1V2h12v12zM6 9H3V7h3V4h2v3h3v2H8v3H6V9z"></path></svg>\
            <strong itemprop="name">Add</strong>\
          </a>\
</h3>\
       <ul class="nav nav-tabs" id="sp-content-tabs">\
              <li id="tab-tree" class="active"><a data-target="#tree" data-toggle="tab">Tree <i class="fa fa-close fa-fw"></i></a></li>\
              <li id="tab-code"><a data-target="#code" data-toggle="tab">Code <i class="fa fa-close fa-fw"></i></a></li>\
              <li id="tab-search"><a data-target="#search" data-toggle="tab">Search <i class="fa fa-close fa-fw"></i></a></li>\
              <li id="tab-snippets"><a data-target="#snippets" data-toggle="tab">Snippets <i class="fa fa-close fa-fw"></i></a></li>\
              <li id="tab-profile"><a data-target="#profile" data-toggle="tab">Profile <i class="fa fa-close fa-fw"></i></a></li>\
            </ul>\
            <div class="tab-content">\
              <div class="tab-pane active" id="tree"></div>\
              <div class="tab-pane" id="code"></div>\
              <div class="tab-pane" id="search"></div>\
              <div class="tab-pane" id="snippets"></div>\
              <div class="tab-pane" id="profile"></div>\
            </div>'),
            getChildView: function(model) {
                if (model.get("type") == "repo-search") {
                    return gSearchRepoView;
                }
                else if (model.get("type") == "user-info") {
                    return gUserProfile;
                }
                else if (model.get("type") == "tree-root") {
                    return gListTreeRoot;
                }
                else if (model.get("type") == "show-blob") {
                    return gShowContentView;
                }
                else if (model.get("type") == "code-search") {
                    return gSearchCodeView;
                }
                else if (model.get("type") == "snippets") {
                    return SnippetsView;
                }
                else if (model.get("type") == "new-snippet") {
                    return NewSnippetView;
                }

                return gSearchRepoView;
            },
            // Contain all childs
            childViewContainer: "div.tab-content",
            // Wrapp all
            getChildViewContainer: function(containerView, childView) {
                var containter = Marionette.CompositeView.prototype.getChildViewContainer.apply(this, arguments);

                if (!containter) return containter;

                if (childView.model.get("type") == "repo-search_TODO") {
                    return containter.children("div#tree");
                }
                else if (childView.model.get("type") == "user-info") {
                    $("ul#sp-content-tabs>li#tab-profile>a").trigger("click");
                    containter.children("div#profile").empty();
                    return containter.children("div#profile");
                }
                else if (childView.model.get("type") == "tree-root") {
                    $("ul#sp-content-tabs>li#tab-tree>a").trigger("click");
                    containter.children("div#tree").empty();
                    return containter.children("div#tree");
                }
                else if (childView.model.get("type") == "show-blob") {
                    $("ul#sp-content-tabs>li#tab-code>a").trigger("click");
                    containter.children("div#code").empty();
                    return containter.children("div#code");
                }
                else if (childView.model.get("type") == "code-search") {
                    $("ul#sp-content-tabs>li#tab-search>a").trigger("click");
                    containter.children("div#search").empty();
                    return containter.children("div#search");
                }
                else if (childView.model.get("type") == "snippets") {
                    $("ul#sp-content-tabs>li#tab-snippets>a").trigger("click");
                    containter.children("div#snippets").empty();
                    containter.children("div#snippets").append("<br><br>");
                    return containter.children("div#snippets");
                }
                else if (childView.model.get("type") == "new-snippet") {
                    $("ul#sp-content-tabs>li#tab-snippets>a").trigger("click");
                    containter.children("div#snippets").empty();
                    containter.children("div#snippets").append("<br><br>");
                    return containter.children("div#snippets");
                }

                return containter;
            },
            collectionEvents: {
                 "add": "modelAdded"
            },
            modelAdded: function(model) {
                //$("DIV#page-wrapper").empty();
            },
            onRender: function(view) {
                var $t = $("DIV#page-wrapper").children("DIV").children("DIV");
                $t.hide();
                view.$el.show();
            }
        });
    });
