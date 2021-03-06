define( [ 'App', 'marionette',
          "views/github/SearchRepoView", "views/github/SearchCodeInRepo", // search views
          "views/github/ListRootView", // "views/github/ListBranchRootView", "views/github/ListSubTreeView", // Tree views
          "views/github/ShowContentView",
          "views/github/UserProfile",
          "views/github/Dashboard",
          "views/UmlView",
          "views/snippets/SnippetsView", "views/snippets/NewSnippetView"], // content view
    function(App, Marionette,
             gSearchRepoView, gSearchCodeView, gListTreeRoot, gShowContentView, // GitHub related views
             gUserProfile, // Github User information
             DashboardView, // Dashboard view
             UmlView, // Edit/view UML diagram
             SnippetsView, NewSnippetView) { // Snippetor's views

        // Collection of the different content which was loaded
        return Marionette.CompositeView.extend({
            template: _.template('\
            <ul class="nav nav-tabs" id="sp-content-tabs">\
              <li id="tab-tree" class="active"><a data-target="#tree" data-toggle="tab">Tree <i class="fa fa-close fa-fw"></i></a></li>\
              <li id="tab-code"><a data-target="#code" data-toggle="tab">Code <i class="fa fa-close fa-fw"></i></a></li>\
              <li id="tab-uml"><a data-target="#uml" data-toggle="tab">UML <i class="fa fa-close fa-fw"></i></a></li>\
              <li id="tab-search"><a data-target="#search" data-toggle="tab">Search <i class="fa fa-close fa-fw"></i></a></li>\
              <li id="tab-search-repo"><a data-target="#search-repo" data-toggle="tab" data-route="/github.com/search"><i class="fa fa-search fa-fw"></i> Repo <i class="fa fa-close fa-fw"></i></a></li>\
              <li id="tab-snippets"><a data-target="#snippets" data-toggle="tab" data-route="/github.com/snippets">Snippets <i class="fa fa-close fa-fw"></i></a></li>\
              <li id="tab-profile"><a data-target="#profile" class="sp-default-user-name" data-toggle="tab" data-route="/login">Profile <i class="fa fa-close fa-fw"></i></a></li>\
              <li id="tab-dashboard"><a data-target="#dashboard" data-toggle="tab" data-route="/github.com/">Dashboard<i class="fa fa-close fa-fw"></i></a></li>\
            </ul>\
            <div class="tab-content">\
              <div class="tab-pane active" id="tree"></div>\
              <div class="tab-pane" id="code"></div>\
              <div class="tab-pane" id="uml"></div>\
              <div class="tab-pane" id="search"></div>\
              <div class="tab-pane" id="search-repo"></div>\
              <div class="tab-pane" id="snippets"></div>\
              <div class="tab-pane" id="profile"></div>\
              <div class="tab-pane" id="dashboard"></div>\
            </div>'),
            getChildView: function(model) {
                // work-around for snippets switch
                this.activeModel = model;

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
                else if (model.get("type") == "dashboard") {
                    return DashboardView;
                }
                else if (model.get("type") == "uml") {
                    return UmlView;
                }
                return gSearchRepoView;
            },
            // Contain all childs
            childViewContainer: "div.tab-content",
            // Wrapp all
            getChildViewContainer: function(containerView, childView) {
                this.skipClick = true;
                var containter = Marionette.CompositeView.prototype.getChildViewContainer.apply(this, arguments);

                if (!containter) return containter;

                if (childView.model.get("type") == "repo-search") {
                    $("ul#sp-content-tabs>li#tab-search-repo>a").trigger("click", {skip:true});
                    containter.children("div#search-repo").empty();
                    return containter.children("div#search-repo");
                }
                else if (childView.model.get("type") == "user-info") {
                    $("ul#sp-content-tabs>li#tab-profile>a").trigger("click", {skip:true});
                    containter.children("div#profile").empty();
                    return containter.children("div#profile");
                }
                else if (childView.model.get("type") == "tree-root") {
                    $("ul#sp-content-tabs>li#tab-tree>a").trigger("click", {skip:true});
                    containter.children("div#tree").empty();
                    return containter.children("div#tree");
                }
                else if (childView.model.get("type") == "show-blob") {
                    $("ul#sp-content-tabs>li#tab-code>a").trigger("click", {skip:true});
                    containter.children("div#code").empty();
                    return containter.children("div#code");
                }
                else if (childView.model.get("type") == "code-search") {
                    $("ul#sp-content-tabs>li#tab-search>a").trigger("click", {skip:true});
                    containter.children("div#search").empty();
                    return containter.children("div#search");
                }
                else if (childView.model.get("type") == "snippets") {
                    $("ul#sp-content-tabs>li#tab-snippets>a").trigger("click", {skip:true});
                    containter.children("div#snippets").empty();
                    containter.children("div#snippets").append("<br><br>");
                    return containter.children("div#snippets");
                }
                else if (childView.model.get("type") == "new-snippet") {
                    $("ul#sp-content-tabs>li#tab-snippets>a").trigger("click", {skip:true});
                    containter.children("div#snippets").empty();
                    containter.children("div#snippets").append("<br><br>");
                    return containter.children("div#snippets");
                }
                else if (childView.model.get("type") == "dashboard") {
                    $("ul#sp-content-tabs>li#tab-dashboard>a").trigger("click", {skip:true});
                    containter.children("div#dashboard").empty();
                    containter.children("div#dashboard").append("<br><br>");
                    return containter.children("div#dashboard");
                }
                else if (childView.model.get("type") == "uml") {
                    $("ul#sp-content-tabs>li#tab-uml>a").trigger("click", {skip:true});
                    containter.children("div#uml").empty();
                    containter.children("div#uml").append("<br><br>");
                    return containter.children("div#uml");
                }
                return containter;
            },
            skipClick: true,
            collectionEvents: {
                 "add": "modelAdded"
            },
            modelAdded: function(model) {
                //$("DIV#page-wrapper").empty();
            },
            onRender: function(view) {
                var that = this;
                // trigger data rouing
                this.options.githubAPI.getUser().then(function(data) {
                    var $ptab = that.$el.find(".sp-default-user-name");
                    if ($ptab.attr("data-route") == "/login")
                      $ptab.attr("data-route", "/github.com/"+data.login);
                });

                var $t = $("DIV#page-wrapper").children("DIV").children("DIV");
                $t.hide();
                view.$el.show();

                var that = this;
                this.$el.find("ul#sp-content-tabs>li>a").click(function(e) {
                    if (e && e.data && e.skip) return;
                    // skip click if data was not rendered yet
                    if (that.skipClick) {
                        that.skipClick = false;
                        return;
                    }

                    var $this = $(this);
                    // There is no loaded content
                    if ($("div" + $this.attr("data-target")).children().length == 0
                      && $this.attr("data-route")) {
                        App.appRouter.navigate($this.attr("data-route"), {trigger: true});
                    }
                });
/*
                this.$el.find("ul#sp-content-tabs>li#tab-snippets>a").click(function(e) {
                  if (e && e.data && e.skip) return;
                  if ($("div#snippets").hasClass("active")) {
                    if ($("div#snippets>div.issues-listing").length > 0) {
                      App.appRouter.navigate("/github.com/snippets", {trigger: true});
                    }
                  }
                });*/
            }
        });
    });
