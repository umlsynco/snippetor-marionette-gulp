define(['App', 'backbone', 'marionette'],
    function (App, Backbone, Marionette) {
		
	var historyItem = Marionette.ItemView.extend({
		tagName: 'li',
		className: 'list-group-item',
		template : _.template('<p class="title"><a class="sp-github-blob-id" sphlist=1 sha="<%= sha %>" repo="<%= repo %>"><%= path %></a><br>\
			   <span class="text-small text-muted match-count"><%= repo %></span></p>')
	});
		
    var historyListView = Marionette.CollectionView.extend({
		tagName: "ul",
		childView: historyItem
	});

    return Backbone.Marionette.Controller.extend({
        initialize:function (options) {
           //App.rootLayout.headerRegion.show(new HeaderView());
           this.view = new historyListView({collection:options.collection});
        },
        getView: function() {
			return this.view;
        }
    });
});
