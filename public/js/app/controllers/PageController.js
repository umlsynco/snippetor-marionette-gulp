define(['App', 'backbone', 'marionette', 'views/PageWrapperView'],
    function (App, Backbone, Marionette, PageWrapperView) {

    // Prevent multiple check for repository:
    // There are 4 use-casases when we need to create/request repo load:
    // 1. On User's repo select
    // 2. On User search repo select
    // 3. On fist load of path/repo (coverend by this variable)
    // 4. On snippet load
    var isFirstInitialization = true;

    // List of the route requests
    var requests = new Backbone.Collection;

    App.addInitializer(function() {
        //
        // Handle item click on the left side menu
        //
        App.vent.on("page:navigate", function(data) {
            // route without trigger ( + SHA ? )
            var nav = data.navigate;
            App.appRouter.navigate("/github.com/" + nav.repo + "/blob/" + nav.branch + "/" + nav.path);

            // trigger open manually
            requests.add(data.request);
        }); // page:navigate
    }); // addInitializer

    return Backbone.Marionette.Controller.extend({
        initialize:function (options) {
          // Initialize PAGES
          this.pages = new PageWrapperView(
            {collection: requests,
             childViewOptions: {
                 githubAPI: options.githubAPI,
                 snippetorAPI: options.snippetorAPI,
                 //history: options.snippetorAPI.getHistoryList()
                 }}
          );
        }, // initialize
        //
        // Left side view
        //
        getView: function() {
			return this.pages;
        },
        //
        // Request page load
        //
		request: function(data) {
			return requests.add(data);
		}
    }); // Controller
}); // define
