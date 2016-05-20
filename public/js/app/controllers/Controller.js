define(
    [
      'App',
      'backbone',
      'marionette',
      'views/WelcomeView',
      'views/HeaderView',
      'controllers/HistoryController',
      'controllers/PageController',
      'controllers/GithubController',
      'controllers/ServerController',
      'controllers/ActiveRepoController',
      'controllers/SnippetController',
      'metisMenu'
    ],
    function(App, Backbone, Marionette, WelcomeView, HeaderView,
             HistoryController, PageController, GithubController,
             ServerController, ActiveRepoController, SnippetController) {

      // Server API
      var serverAPI = new ServerController;

      // Initialize LEFT-SIDE HISTORY VIEW & CONTROLLER
      var snippetorAPI = new HistoryController({backend : serverAPI});

      //
      // Github API
      // TODO: wrapp all code to cache items
      //
      var githubAPI = new GithubController;

      // Initialize PAGES
      var pageAPI = new PageController({
        githubAPI : githubAPI.getAPI(),
        githubAPI2 : githubAPI,
        snippetorAPI : snippetorAPI,
        serverAPI : serverAPI
      });

      var activeRepoCtl = new ActiveRepoController({
        githubAPI : githubAPI.getAPI(),
        githubAPI2 : githubAPI,
        snippetorAPI : snippetorAPI,
        serverAPI : serverAPI
      });

      var snippetController = new SnippetController({
          server: serverAPI,
          history: snippetorAPI,
          github: githubAPI,
          active_repo_ctl: activeRepoCtl
      });

      // Cache of the different pages which were requested
      App.rootLayout.mainRegion.show(pageAPI.getView());
      App.rootLayout.activeReposRegion.show(activeRepoCtl.getView());

      return Backbone.Marionette.Controller.extend({
        initialize : function(options) {
          var hv = new HeaderView();
          App.rootLayout.headerRegion.show(hv);
          // Show history in a left side menu
          hv.historyRegion.show(snippetorAPI.getView());

          $('#side-menu').metisMenu();
        },
        // gets mapped to in AppRouter's appRoutes
        //
        // Base template loader and default dashboard
        //
        index : function() { pageAPI.request({type : "dashboard"}); },
        //
        // Some information about user
        //
        githubUserInfo : function(q) {
          pageAPI.request([{type : "user-info", user : q || ""}]);
        },
        //
        // Find repository by name
        //
        githubRepoSearch : function(q) {
          pageAPI.request([{type : "repo-search", query : q || ""}]);
        },
        //
        // Search code inside repository
        //
        githubCodeSearchInsideRepo : function(user, repo, q) {
          pageAPI.request([{
            type : "code-search",
            query : q,
            repo : repo,
            user : user,
            branch : "master"
          }]);
        },
        //
        // Show github default root
        // (it is similar to branch tree, but default branch doesn't have
        //  it's name in routing: for example:
        //  http://github.com/qtproject/qtwebengine
        //  but it shows "dev"-branch)
        //
        // The major idea is to re-use github's routing behavior
        //
        showTreeRoot : function(user, repo) {
          pageAPI.request([{type : "tree-root", repo : user + "/" + repo}]);
          // TBD: do nothing if repo was loaded before
          // serviceAPI.loadRepo({repo: user+ "/" + repo, branch : "master"});
        },
        //
        // Show github branch-root
        //
        showBranchTree : function(user, repo, branch) {
          pageAPI.request(
              {type : "tree-root", repo : user + "/" + repo, branch : branch});
          // TBD: do nothing if repo was loaded before
          // serviceAPI.loadRepo({repo: user+ "/" + repo, branch : branch});
        },
        //
        // Show github sub-tree
        //
        showSubTree : function(user, repo, branch, id1, id2, id3, id4, id5, id6,
                               id7, id8, id9) {
          var path = "", splitter = "";
          for (var i = 3; i < 12; ++i) {
            if (arguments[i] != undefined) {
              path = path + splitter + arguments[i];
            }
            splitter = "/";
          }
          pageAPI.request({
            type : "tree-root",
            repo : user + "/" + repo,
            branch : branch,
            path : path,
            sha : ""
          });

          // TBD: do nothing if repo was loaded before
          // serviceAPI.loadRepo({repo: user+ "/" + repo, branch : branch});
        },
        //
        // Show github content file
        //
        githubShowBlob : function(user, repo, branch, id1, id2, id3, id4, id5,
                                  id6, id7, id8, id9) {
          var path = "", splitter = "";
          for (var i = 3; i < 12; ++i) {
            if (arguments[i] != undefined) {
              path = path + splitter + arguments[i];
            }
            splitter = "/";
          }

          pageAPI.request({
            type : "show-blob",
            repo : user + "/" + repo,
            branch : branch,
            path : path,
            sha : null,
            repo_ref : activeRepoCtl.getRepoRef(user + "/" + repo)
          });
          // TBD: do nothing if repo was loaded before
          // serviceAPI.loadRepo({repo: user+ "/" + repo, branch : branch});
        },
        //
        // Show list of the user snippets
        //
        showSnippets : function(q) { pageAPI.request({type : "snippets", query:q || ""}); },
        //
        // Create new snippet
        //
        newSnippetForm : function() {
             pageAPI.request({type : "new-snippet"});
        }
      }); // Controller
    });   // define
