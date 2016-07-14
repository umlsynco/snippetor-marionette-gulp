//
// In the best case this interface should be unifid
// and extended for the Bibtback and other data
// providers
//
//
define([ 'App', 'backbone', 'marionette', 'github-api', 'access_token' ],
   function(App, Backbone, Marionette, GitHubApi, access_token) {
  //
  // Github JS-API
  //
  var github = new Github(
      {token : access_token, auth : "oauth"});
  //
  // Github API controller-wrapper
  // - uses to cache requests to the github
  //
  return Backbone.Marionette.Controller.extend({
    initialize : function(options) {
      this.user_repositories = new Backbone.Collection();
      this.search_repositories = new Backbone.Collection();
    },
    loginUser: "",
    userCache: {},
    getUser: function(userName) {
        var name = userName? userName: this.loginUser;
        var that = this;
        if (!this.userCache[name])
          this.userCache[name] = new Promise(function(resolve, reject) {
            var user = github.getUser(name);
            user.show(name, function(err, data) {
                if (!err) {
                  resolve(data);
                  // Avoid double request of the user name
                  if (name == "") {
                    that.userCache[data.login] = that.userCache[name];
                    that.loginUser = data.login;
                  }
                }
                else
                  reject(err);
            });
          });
        return this.userCache[name];
    },
    
    getAPI : function() { return github; },
    //
    // Get current user repositories if user == null
    //
    getUserRepositories : function(userName, callback) {
      // Get current user or concreate user
      var user = (userName ? github.getUser(userName) : github.getUser());
      var that = this;
      // request
      var handler = function(err, repo) {
        if (!err) {
          that.user_repositories.reset();
          that.user_repositories.add(repo);
          callback(null, that.user_repositories);
        } else {
          callback(err, null);
        }
      };

      // There are two different APIs for log-ined user and another one
      if (!userName)
        user.repos({type : 'all'}, handler);
      else
        user.userRepos(userName, {type : 'Users'}, handler);
    },
    //
    // Make query for the github repository search
    //
    searchRepositories : function(query, callback) {
      var gs = github.getSearch(query), that = this;
      gs.repositories({}, function(error, repos) {
        if (!error) {
          that.search_repositories.reset();
          that.search_repositories.add(repos.items);
          callback(null, that.search_repositories);
        } else {
          callback(err, null);
        }
      });
    },
    //
    // Get repository info by name
    // Uses to load repo information from github for snippet
    //
    getRepositoryInfo: function(full_name) {
        return new Promise(function(resolve, reject) {
          var splitted = full_name.split("/");
          var repo = github.getRepo(splitted[0], splitted[1]);
          repo.show(function(err, repository) {
              if (err) reject(err)
              else resolve(repository);
          });
      });
    },
    //
    // Load content by data
    //
    loadContent : function(data, callback) {

    }

  });

}); // define
