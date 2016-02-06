define(['marionette', 'controllers/Controller'], function(Marionette, Controller) {
   return Marionette.AppRouter.extend({
       //"index" must be a method in AppRouter's controller
       appRoutes: {
           "github\.com/search": "githubRepoSearch", // q=query & type=Repositories & utf8 - unused
           "github\.com/:user/:repo": "showTreeRoot",
           "github\.com/:user/:repo/search": "githubCodeSearchInsideRepo",
           "github\.com/:user/:repo/tree/:branch" : "showBranchTree",
           "github\.com/:user/:repo/tree/:branch/*" : "showSubTree",
           "github\.com/:user/:repo/blob/:branch/*" : "githubShowBlob",
           "": "index",
       }
   });
});
