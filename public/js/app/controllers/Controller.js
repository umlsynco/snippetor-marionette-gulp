define(['App', 'backbone', 'marionette', 'views/WelcomeView', 'views/HeaderView', 'views/PageWrapperView'],
    function (App, Backbone, Marionette, WelcomeView, HeaderView, PageWrapperView) {
	var requests = new Backbone.Collection;
	var pages = new PageWrapperView({collection: requests, childViewOptions: {githubAPI: "TODO: ADD GITHUB API TO PROPAGATE !!!"}});
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
        showTreeRoot: function() {
           requests.add([{type:"tree-root", repo: "full/name"}]);
        },
        showBranchTree: function() {
          requests.add({type:"tree-root", repo: "full/name", branch:"master"});
        },
        showSubTree: function() {
           requests.add({type:"tree-root", repo: "full/name", branch:"master", path: "/", sha:""});
        },
        githubShowBlob: function() {
			requests.add({type:"show-blob", repo: "full/name", branch:"master", path: "/", sha:""});
		 }
    });
});
