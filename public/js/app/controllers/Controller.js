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
        githubRepoSearch: function(q) {
	       requests.add([{type:"repo-search", query: q || ""}]);
        },
        githubCodeSearchInsideRepo: function(user, repo, q) {
           requests.add([{type:"code-search", query: q, repo: repo, user:user, branch:"master"}]);
        },
        showTreeRoot: function(user, repo) {
           requests.add([{type:"tree-root", repo: user+ "/" + repo}]);
        },
        showBranchTree: function(user, repo, branch) {
          requests.add({type:"tree-root", repo: user+ "/" + repo, branch:branch});
        },
        showSubTree: function(user, repo, branch, id1, id2, id3, id4, id5, id6, id7) {
		   var path = "", splitter = "";
		   for (var i=3; i<10; ++i) {
			   if (arguments[i] != undefined) {
				   path = path + splitter + arguments[i];
			   }
			   splitter = "/";
		   }
           requests.add({type:"tree-root", repo: user+ "/" + repo, branch:branch, path: path, sha:""});
        },
        githubShowBlob: function(user, repo, branch, id1, id2, id3, id4, id5, id6, id7) {
		   var path = "", splitter = "";
		   for (var i=3; i<10; ++i) {
			   if (arguments[i] != undefined) {
				   path = path + splitter + arguments[i];
			   }
			   splitter = "/";
		   }
	       requests.add({type:"show-blob", repo: user+ "/" + repo, branch:branch, path: path, sha:null});
        }
    });
});
