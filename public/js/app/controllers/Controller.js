define(['App', 'backbone', 'marionette', 'github-api',
        'views/WelcomeView', 'views/HeaderView', 'views/PageWrapperView',
        'controllers/SnippetHistoryController', "metisMenu"],
    function (App, Backbone, Marionette, GithubApi,
              WelcomeView, HeaderView, PageWrapperView,
              SnippetHistoryController) {

    // List of the route requests
    var requests = new Backbone.Collection;

    //
    // History model item
    //
    var historyModel = Backbone.Model.extend({
      defaults: {
        branch: "master",
        repo: null,
        path: null,
        comments: []  // number of comment + linenum
      }
    });
    var historyCollection = Backbone.Collection.extend({
      model: historyModel
    });
    var historyList = new Backbone.Collection; // List of the visited sites + comments for them

    // Initialize LEFT-SIDE HISTORY VIEW & CONTROLLER
    var historyController = new SnippetHistoryController({collection: historyList});

    App.addInitializer(function() {
        // Add visited page to the list
        // TODO: handle Back and Forward arrows
        //
        App.vent.on("history:report", function(model) {
            historyList.add(model);
        });

        //
        // On save comment to the history
        // Get item in focus, compare with model, add comment to the  item
        //
        App.vent.on("history:bubble", function(model, comment) {
            var wm = historyList.get(model.id);
            if (wm) {
                wm.attributes.comments.push(comment);
            }
        });

        //
        // Handle item click on the left side menu
        //
        App.vent.on("history:open", function(model, selected) {
            // route without trigger ( + SHA ? )
            App.appRouter.navigate("/github.com/" + model.get("repo") + "/blob/" + model.get("branch") + "/" + model.get("path"));

            // trigger open manually
            requests.add({
              type:"show-blob", // Show github blob
              ref: model.id, // history item model
              comment_number: selected || 0}); // selected comment number
        });

        //
        // Handle item prev or next
        //
        App.vent.on("history:navigate", function(activeModel, isPrev) {
            var idx = historyList.indexOf(activeModel);
            var model;
            if (idx < 0) {
                alert("WTF: unknown active history item");
                return;
            }
            
            if (isPrev) {
              if (idx == 0) {
                alert("Attempt history item befor first one !!!");
                return;
              }
              model = historyList.get(idx-1);
            }
            else {
                if (idx >= historyList.length) {
                    alert("Stack overflow, wrong position");
                    return;
                }
                model = historyList.get(idx+1);
            }

            // route without trigger
            App.appRouter.navigate("/github.com/" + model.get("repo") + "/blob/" + model.get("branch") + "/" + model.get("path"));
            // trigger open manually
            requests.add({
                type:"show-blob",
                ref: model.id,
                comment_number: selected}); // selected comment number
        });
    });

    //
    // Github API
    // TODO: wrapp all code to cache items
    //
    var github = new Github({
        token: "",
        auth: "oauth"
    });

    // Initialize PAGES
    var pages = new PageWrapperView({collection: requests, childViewOptions: {githubAPI: github, snippetsAPI:null, history: historyList}});

    // Cache of the different pages which were requested
    App.rootLayout.mainRegion.show(pages);

    return Backbone.Marionette.Controller.extend({
        initialize:function (options) {
           var hv = new HeaderView();
           App.rootLayout.headerRegion.show(hv);
           // Show history in a left side menu
           hv.historyRegion.show(historyController.getView());

           $('#side-menu').metisMenu();

        },
        //gets mapped to in AppRouter's appRoutes
        //
        // Base template loader and default dashboard
        //
        index:function () {
           requests.add({type:"dashboard"});
        },
        //
        // Some information about user
        //
        githubUserInfo:  function(q) {
           requests.add([{type:"user-info", user: q || ""}]);
        },
        //
        // Find repository by name
        //
        githubRepoSearch: function(q) {
           requests.add([{type:"repo-search", query: q || ""}]);
        },
        //
        // Search code inside repository
        //
        githubCodeSearchInsideRepo: function(user, repo, q) {
           requests.add([{type:"code-search", query: q, repo: repo, user:user, branch:"master"}]);
        },
        //
        // Show github default root
        // (it is similar to branch tree, but default branch doesn't have
        //  it's name in routing: for example: http://github.com/qtproject/qtwebengine
        //  but it shows "dev"-branch)
        //
        // The major idea is to re-use github's routing behavior
        //
        showTreeRoot: function(user, repo) {
           requests.add([{type:"tree-root", repo: user+ "/" + repo}]);
        },
        //
        // Show github branch-root
        //
        showBranchTree: function(user, repo, branch) {
          requests.add({type:"tree-root", repo: user+ "/" + repo, branch:branch});
        },
        //
        // Show github sub-tree
        //
        showSubTree: function(user, repo, branch, id1, id2, id3, id4, id5, id6, id7, id8, id9) {
           var path = "", splitter = "";
           for (var i=3; i<12; ++i) {
               if (arguments[i] != undefined) {
                   path = path + splitter + arguments[i];
               }
               splitter = "/";
           }
           requests.add({type:"tree-root", repo: user+ "/" + repo, branch:branch, path: path, sha:""});
        },
        //
        // Show github content file
        //
        githubShowBlob: function(user, repo, branch, id1, id2, id3, id4, id5, id6, id7, id8, id9) {
           var path = "", splitter = "";
           for (var i=3; i<12; ++i) {
               if (arguments[i] != undefined) {
                   path = path + splitter + arguments[i];
               }
               splitter = "/";
           }

           requests.add({type:"show-blob", repo: user+ "/" + repo, branch:branch, path: path, sha:null});
        },
        // 
        // Show list of the user snippets
        //
        showSnippets: function() {
          requests.add({type:"snippets"});
        },
        //
        // Create new snippet
        //
        newSnippetForm: function() {
			requests.add({type:"new-snippet"});
        }
    }); // Controller
}); // define
