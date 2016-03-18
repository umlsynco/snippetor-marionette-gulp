define(['marionette', 'controllers/Controller'], function(Marionette, Controller) {
   return Marionette.AppRouter.extend({
       //"index" must be a method in AppRouter's controller
       appRoutes: {
           "github\.com/search": "githubRepoSearch", // q=query & type=Repositories & utf8 - unused
           "github\.com/user/:name": "githubUserInfo", // show user information
           "github\.com/:user/:repo": "showTreeRoot",
           "github\.com/:user/:repo/search": "githubCodeSearchInsideRepo",
           "github\.com/:user/:repo/tree/:branch" : "showBranchTree",
           "github\.com/:user/:repo/tree/:branch/:id1" : "showSubTree",
           "github\.com/:user/:repo/tree/:branch/:id1/:id2" : "showSubTree",
           "github\.com/:user/:repo/tree/:branch/:id1/:id2/:id3" : "showSubTree",
           "github\.com/:user/:repo/tree/:branch/:id1/:id2/:id3/:id4" : "showSubTree",
           "github\.com/:user/:repo/tree/:branch/:id1/:id2/:id3/:id4/:id5" : "showSubTree",
           "github\.com/:user/:repo/tree/:branch/:id1/:id2/:id3/:id4/:id5/:id6" : "showSubTree",
           "github\.com/:user/:repo/tree/:branch/:id1/:id2/:id3/:id4/:id5/:id6/:id7" : "showSubTree",
           "github\.com/:user/:repo/tree/:branch/:id1/:id2/:id3/:id4/:id5/:id6/:id7/:id8" : "showSubTree",
           "github\.com/:user/:repo/tree/:branch/:id1/:id2/:id3/:id4/:id5/:id6/:id7/:id8/:id9" : "showSubTree",
           "github\.com/:user/:repo/blob/:branch/:id1" : "githubShowBlob",
           "github\.com/:user/:repo/blob/:branch/:id1/:id2" : "githubShowBlob",
           "github\.com/:user/:repo/blob/:branch/:id1/:id2/:id3" : "githubShowBlob",
           "github\.com/:user/:repo/blob/:branch/:id1/:id2/:id3/:id4" : "githubShowBlob",
           "github\.com/:user/:repo/blob/:branch/:id1/:id2/:id3/:id4/:id5" : "githubShowBlob",
           "github\.com/:user/:repo/blob/:branch/:id1/:id2/:id3/:id4/:id5/:id6" : "githubShowBlob",
           "github\.com/:user/:repo/blob/:branch/:id1/:id2/:id3/:id4/:id5/:id6/:id7" : "githubShowBlob",
           "github\.com/:user/:repo/blob/:branch/:id1/:id2/:id3/:id4/:id5/:id6/:id7/:id8" : "githubShowBlob",
           "github\.com/:user/:repo/blob/:branch/:id1/:id2/:id3/:id4/:id5/:id6/:id7/:id8/:id9" : "githubShowBlob",
           "snippets/new": "newSnippetForm",
           "snippets": "showSnippets",
           "": "index",
       },
       onRoute: function(x) {
		   // TODO: handle routing
	   }
       
   });
});
