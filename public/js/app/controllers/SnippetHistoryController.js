define(['App', 'backbone', 'marionette'],
    function (App, Backbone, Marionette) {
		
	var historyItem = Marionette.ItemView.extend({
		tagName: 'li',
		className: 'list-group-item',
		template : _.template('<p class="title">\
		  <a class="sp-github-blob-id" sphlist=1 sha="<%= sha %>" repo="<%= repo %>" href="/github.com/<%= repo %>/blob/<%= branch %>/<%= path %>"><%= path %></a><br>\
		  <span class="text-small text-muted match-count"><%= repo %></span><a class="right"><i class="fa fa-comments fa-fw"></i>4<a></p>'),
		ui : {
		  "blob": "A.sp-github-blob-id"
		},
	    events: {
			"click @ui.blob": "onSelect"
		},
		onSelect: function(e) {
			e.preventDefault();
			var url = this.ui.blob.attr("href");
			this.model.set({active: true});
			App.vent.trigger("history:open", this.model);
		}
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
