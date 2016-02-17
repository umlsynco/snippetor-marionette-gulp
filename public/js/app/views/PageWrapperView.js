define( [ 'marionette',
          "views/github/SearchRepoView", "views/github/SearchCodeInRepo", // search views
          "views/github/ListRootView", // "views/github/ListBranchRootView", "views/github/ListSubTreeView", // Tree views
          "views/github/ShowContentView"], // content view
    function( Marionette, gSearchRepoView, gSearchCodeView, gListTreeRoot, gShowContentView) {
        // Collection of the different content which was loaded
        return Marionette.CollectionView.extend( {
			getChildView: function(model) {
				if (model.get("type") == "repo-search") {
					return gSearchRepoView;
				}
				else if (model.get("type") == "tree-root") {
					return gListTreeRoot;
				}
				else if (model.get("type") == "show-blob") {
					return gShowContentView;
				}
				else if (model.get("type") == "code-search") {
					return gSearchCodeView;
				}

				return gSearchRepoView;
			}
        });
    });
