define(['App', 'backbone', 'marionette', 'github-api',
        'views/WelcomeView', 'views/HeaderView', 'views/PageWrapperView',
        'controllers/SnippetHistoryController', "metisMenu"],
    function (App, Backbone, Marionette, GithubApi,
              WelcomeView, HeaderView, PageWrapperView,
              SnippetHistoryController) {
    var requests = new Backbone.Collection; // List of the route requests
    var historyList = new Backbone.Collection; // List of the visited sites + comments for them
    var github = new Github({
        token: "",
        auth: "oauth"
    });

    // Initialize PAGES
    var pages = new PageWrapperView({collection: requests, childViewOptions: {githubAPI: github}});
    // Cache of the different pages which were requested
    App.rootLayout.mainRegion.show(pages);

    // Initialize LEFT-SIDE HISTORY VIEW & CONTROLLER
    var historyController = new SnippetHistoryController({collection: historyList});
    App.addInitializer(function() {
        App.vent.on("history:report", function() {
            alert("Add item to history");
        });
        App.vent.on("history:bubble", function(model) {
            historyList.add(model);
        });
        App.vent.on("history:open", function(model) {
            // route without trigger
            App.appRouter.navigate("/github.com/" + model.get("repo") + "/blob/" + model.get("branch") + "/" + model.get("path"));
            // trigger open manually
            requests.add({type:"show-blob", repo: model.get("repo"), branch:model.get("branch"), path: model.get("path"), sha:null, linenum: model.get("linenum"), comment: model.get("comment")});
        });
    });

    return Backbone.Marionette.Controller.extend({
        initialize:function (options) {
           var hv = new HeaderView();
           App.rootLayout.headerRegion.show(hv);
           // Show history in a left side menu
           hv.historyRegion.show(historyController.getView());

           $('#side-menu').metisMenu();

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
