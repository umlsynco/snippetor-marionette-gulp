define(['App', 'backbone', 'marionette', 'views/PageWrapperView'],
    function (App, Backbone, Marionette, PageWrapperView) {
    // List of the route requests
    var working_repos = new Backbone.Collection;
    var working_srv_repos = new Backbone.Collection;

	var repoItemView = Marionette.CompositeView.extend({
		tagName: 'h3',
		className: 'entry-title public sp-active-repo-item',
		template : _.template('\
          <svg aria-hidden="true" class="octicon octicon-repo" height="16" role="img" version="1.1" viewBox="0 0 12 16" width="12"><path d="M4 9h-1v-1h1v1z m0-3h-1v1h1v-1z m0-2h-1v1h1v-1z m0-2h-1v1h1v-1z m8-1v12c0 0.55-0.45 1-1 1H6v2l-1.5-1.5-1.5 1.5V14H1c-0.55 0-1-0.45-1-1V1C0 0.45 0.45 0 1 0h10c0.55 0 1 0.45 1 1z m-1 10H1v2h2v-1h3v1h5V11z m0-10H2v9h9V1z"></path></svg>\
          <span class="author" itemprop="author"><a href="/github.com/<%= getUser() %>" class="url fn" rel="author"><%= getUser() %></a></span>\
          <span class="path-divider">/</span>\
          <strong itemprop="name"><a href="/github.com/<%= full_name %>" data-pjax="#js-repo-pjax-container"><%= getRepo() %></a></strong>\
          '),
         templateHelpers: function(){
           return {
             getUser: function(){ 
               return this["full_name"].split("/")[0];
             },
             getRepo: function(){ 
               return this["full_name"].split("/")[1];
             }
           }
         }
      });

    // View of each repo item
	var shortRepoView = Marionette.CompositeView.extend({
		className: 'list-group sp-repos-top',
        childViewContainer: 'div.sp-active-repos-top',
        childView: repoItemView,
		template : _.template('<div class="sp-active-repos-top"></div><h3 class="entry-title public sp-active-repo-item sp-navigator"><a href="/github.com/search" class="reponav-tab " aria-selected="false" role="tab">\
                    <svg aria-hidden="true" class="octicon octicon-diff-added" height="16" role="img" version="1.1" viewBox="0 0 14 16" width="14"><path d="M13 1H1C0.45 1 0 1.45 0 2v12c0 0.55 0.45 1 1 1h12c0.55 0 1-0.45 1-1V2c0-0.55-0.45-1-1-1z m0 13H1V2h12v12zM6 9H3V7h3V4h2v3h3v2H8v3H6V9z"></path></svg>\
                    <strong itemprop="name">Add</strong></a></h3><br>'),
		ui : {
		  "new_repo": "A.reponav-tab",
          "navigate" : "h3.sp-navigator"
		},
	    events: {
			"click @ui.new_repo": "onNewRepo",
            "click @ui.navigate" : "onNavigate"
		},
        onNewRepo: function() {
            // route to the new repo select
        },
        onNavigate: function(e) {
            e.preventDefault();
            App.appRouter.navigate("/github.com/search", {trigger: true});
        }
    });

    App.addInitializer(function() {
        //
        // Handle item click on the left side menu
        //
        App.vent.on("repo:select", function(repo_data) {
            // route without trigger ( + SHA ? )
//            var nav = data.navigate;
//            App.appRouter.navigate("/github.com/" + nav.repo + "/blob/" + nav.branch + "/" + nav.path);

            // trigger open manually
            working_repos.add(repo_data.github);
            working_srv_repos.add(repo_data.server);
        }); // repo:select
    }); // addInitializer

    return Backbone.Marionette.Controller.extend({
        initialize:function (options) {
          // Initialize PAGES
          this.active_repos_view = new shortRepoView({
             collection: working_repos,
             childViewOptions: {
                 githubAPI: options.githubAPI,
                 githubAPI2: options.githubAPI2,
                 snippetorAPI: options.snippetorAPI,
                 serverAPI: options.serverAPI
             }
          });
        }, // initialize
        //
        // Left side view
        //
        getView: function() {
			return this.active_repos_view;
        },
        getRepoRef: function(full_name) {
            var rs = working_srv_repos.where({repository: full_name});
            if (rs.length == 0) return '';
            return rs[0].get("_id");
        }
    }); // Controller
}); // define
