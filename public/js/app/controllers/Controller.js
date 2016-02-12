define(['App', 'backbone', 'marionette', 'github-api', 'views/WelcomeView', 'views/HeaderView', 'views/PageWrapperView'],
    function (App, Backbone, Marionette, GithubApi, WelcomeView, HeaderView, PageWrapperView) {
	var requests = new Backbone.Collection;
	var github = new Github({
        token: "",
        auth: "oauth"
    });

	var pages = new PageWrapperView({collection: requests, childViewOptions: {githubAPI: github}});
    // Cache of the different pages which were requested
	App.rootLayout.mainRegion.show(pages);

    return Backbone.Marionette.Controller.extend({
        initialize:function (options) {
           App.rootLayout.headerRegion.show(new HeaderView());
        },
        //gets mapped to in AppRouter's appRoutes
        index:function () {
           requests.add({type:"dashboard"});
        },
        githubRepoSearch: function(x, y, z) {
	       requests.add([{type:"repo-search", query: "qwebengine"}]);
        },
        githubCodeSearchInsideRepo: function() {
           requests.add([{type:"code-search", query: "qwebengine", repo: "full/name", branch:"master"}]);
        },
        showTreeRoot: function(user, repo) {
           requests.add([{type:"tree-root", repo: user+ "/" + repo}]);
        },
        showBranchTree: function(user, repo) {
          requests.add({type:"tree-root", repo: user+ "/" + repo, branch:"master"});
        },
        showSubTree: function() {
           requests.add({type:"tree-root", repo: "full/name", branch:"master", path: "/", sha:""});
        },
        githubShowBlob: function() {
	    requests.add({type:"show-blob", repo: "full/name", branch:"master", path: "/", sha:""});
        }
    });
});
