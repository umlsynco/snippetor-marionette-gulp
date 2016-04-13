//
// In the best case this interface should be unifid
// and extended for the Bibtback and other data
// providers
//
//
define([ 'App', 'backbone', 'marionette', 'github-api' ],
   function(App, Backbone, Marionette, GitHubApi) {
  //
  // Github JS-API
  //
  var github = new Github(
      {token : "", auth : "oauth"});
  //
  // Github API controller-wrapper
  // - uses to cache requests to the github
  //
  return Backbone.Marionette.Controller.extend({
    initialize : function(options) {
      this.user_repositories = new Backbone.Collection();
      this.search_repositories = new Backbone.Collection();

    },
    getAPI : function() { return github; },
    //
    // Get current user repositories if user == null
    //
    getUserRepositories : function(user, callback) {
      // Get current user or concreate user
      var user = (user ? github.getUser(user) : github.getUser());
      var that = this;
      // request
      user.repos({type : 'all'}, function(err, repo) {
        if (!err) {
          that.user_repositories.reset();
          that.user_repositories.add(repo);
          callback(null, that.user_repositories);
        } else {
          callback(err, null);
        }
      });
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
    // Load content by data
    //
    loadContent : function(data, callback) {

    }

  });

}); // define
