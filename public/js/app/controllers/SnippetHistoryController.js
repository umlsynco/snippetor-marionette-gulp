define(['App', 'backbone', 'marionette'],
    function (App, Backbone, Marionette) {
    var ActiveComment = null;
    var ActiveItem = null;
    var commentItem = Marionette.ItemView.extend({
		tagName: 'li',
		className: 'list-group-item',
		template : _.template('<p>\
		  <span class="text-small text-muted match-count"><%= comment %></span><a class="right"><i>:<%= linenum %></i><i class="fa fa-remove fa-fw"></i></a></p>'),
        events: {
            "click i.fa-remove": "removeItem",
            "click span.text-small": "onSelect"
        },
        modelEvents: {
            "change:active": "ChangeColor"
        },
        ChangeColor: function() {
            if (this.model.get("active")) {
                if (ActiveComment != null && ActiveComment != this.model)
                  ActiveComment.set("active", false);

                ActiveComment = this.model;
                this.$el.addClass("active");
            }
            else {
                this.$el.removeClass("active");
            }
        },
        onSelect: function() {
            if (ActiveComment) {
                ActiveComment.set("active", false);
            }
            ActiveComment = this.model;
            ActiveComment.set("active", true);
        },
        removeItem: function() {
            if (this.model.get("active")) {
                ActiveComment = null;
            }
            this.model.collection.remove(this.model);
        }
    });
		
	var historyItem = Marionette.CompositeView.extend({
		tagName: 'li',
		className: 'list-group-item',
		template : _.template('<p class="title">\
		  <a class="sp-github-blob-id" sphlist=1 sha="<%= sha %>" repo="<%= repo %>" href="/github.com/<%= repo %>/blob/<%= branch %>/<%= path %>"><%= path %></a><br>\
		  <span class="text-small text-muted match-count"><%= repo %></span><a class="right"><i class="fa fa-comments fa-fw"></i><i class="fa sp-count">0</i></a></p>\
          <p><ul class="sp-comments" style="display:none;"></ul></p>'),
		ui : {
		  "blob": "A.sp-github-blob-id",
          "commentsIcon": "i.fa-comments",
          "comments": "ul.sp-comments"
		},
	    events: {
			"click @ui.blob": "onSelect",
            "click @ui.commentsIcon": "onShowComments"
		},
        modelEvents: {
          'change:active': 'changeActive'
        },
        collectionEvents: {
          'add': 'changeCount',
          'remove': 'changeCount',
          'change:active': 'changeActiveComment'
        },
        changeActiveComment: function(model, value) {
            // Force load of the history item of the current comment
            if (value)
                this.ui.blob.trigger("click");
        },
        changeActive: function(model, value) {
            if (value) {
                var shouldTrigger = (!ActiveItem || ActiveItem != model);
                if (ActiveItem && ActiveItem != model) {
                    ActiveItem.set("active", false);
                }

                ActiveItem = model;
                // change class and trigger open
                if (shouldTrigger) {
                  this.$el.addClass("active");
                  App.vent.trigger("history:open", model);
                }
            }
            else {
              this.$el.removeClass("active");
            }
        },
        onShowComments: function() {
            this.ui.comments.toggle();
        },
        changeCount: function() {
            var $els = this.$el.find("i.sp-count");
            $els.html(this.collection.length);
        },
        childView: commentItem,
        childViewContainer : "ul.sp-comments",
        initialize: function(options) {
            // List of comments
            this.collection = this.model.comments;
            this.changeActive(this.model, this.model.get("active"));
        },
		onSelect: function(e) {
			e.preventDefault();
            this.model.set("active", true);
		}
	});
		
    var historyListView = Marionette.CompositeView.extend({
		template: _.template('\
                <button type="button" class="btn btn-warning sp-fork"><i class="fa fa-code-fork fw"></i></button>\
                <button type="button" class="btn btn-danger sp-star"><i class="fa fa-star fw"></i></button>\
                <button type="button" class="btn btn-warning sp-vote-up"><i class="fa fa-thumbs-up fw"></i></button>\
                <button type="button" class="btn btn-warning sp-vote-down"><i class="fa fa-thumbs-down fw"></i></button>\
                <button type="button" class="btn btn-warning sp-user-info"><i class="fa fa-user fw"></i></button>\
                <button type="button" class="btn btn-danger sp-post-questions"><i class="fa fa-question fw"></i></button><br>\
                <button type="button" class="btn btn-primary sp-save "><i class="fa fa-save fw"></i></button>\
                <button type="button" class="btn btn-warning sp-close "><i class="fa fa-close fw"></i></button>\
                <button type="button" class="btn btn-danger sp-delete "><i class="fa fa-trash fw"></i></button><br>\
                <br><ul class="history-list"></ul>'),
        childViewContainer: "ul.history-list",
        ui: {
            save: "button.sp-save",
            star: "button.sp-star",
            fork: "button.sp-fork",
        },
		childView: historyItem,
        'collectionEvents': {
          'add': 'onAdd',
          'remove': 'onRemove'
        },
        events: {
            "click @ui.save": "onSave"
        },
        onAdd: function(newModel) {
              if (ActiveItem) {
                  ActiveItem.set("active", false);
              }
              ActiveItem = newModel;
              ActiveItem.set("active", true);
        },
        onRemove: function(rmModel) {
            if (ActiveItem == rmModel) {
                ActiveItem.set("active", false);
                ActiveItem = null;
            }
        },
        onSave: function() {
            App.appRouter.navigate("/github.com/snippets/save", {trigger: true});
        }
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
