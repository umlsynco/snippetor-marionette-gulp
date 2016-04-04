define(['App', 'backbone', 'marionette', 'github-api'],
    function (App, Backbone, Marionette, GitHubApi) {
      var github = new Github({
        token: "",
        auth: "oauth"
      });
    return Backbone.Marionette.Controller.extend({
        initialize:function (options) {
            
        },
        getAPI: function() {
            return github;
        }
    });
    
}); // define
