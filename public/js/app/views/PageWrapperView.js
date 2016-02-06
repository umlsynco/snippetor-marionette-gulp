define( [ 'marionette',
          "views/github/SearchRepoView", // "views/github/SearchCodeView", // search views
          "views/github/ListRootView"], // "views/github/ListBranchRootView", "views/github/ListSubTreeView", // Tree views
//          "views/github/ShowBlobView"], // content view
    function( Marionette, gSearchRepoView, gListTreeRoot) {
        // Collection of the different content which was loaded
        return Marionette.CollectionView.extend( {
			getChildView: function(model) {
				if (model.get("type") == "repo-search") {
					return gSearchRepoView;
				}
				else if (model.get("type") == "tree-root") {
					return gListTreeRoot;
				}
				return gSearchRepoView;
			}
        });
    });
