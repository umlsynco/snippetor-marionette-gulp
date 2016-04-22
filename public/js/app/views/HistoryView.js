define(['App', 'backbone', 'marionette'],
    function (App, Backbone, Marionette) {
    var ActiveComment = null;
    var ActiveItem = null;
    var commentItem = Marionette.ItemView.extend({
		tagName: 'li',
		className: 'list-group-item',
		template : _.template('<p>\
		  <span id="name" class="text-small text-muted match-count"><%= comment %></span><a id="linenum" class="right"><i>:<%= linenum %></i><i class="fa fa-remove fa-fw"></i></a></p>'),
        events: {
            "click i.fa-remove": "removeItem",
            "click span.text-small": "onSelect"
        },
        modelEvents: {
            "change:active": "ChangeColor",
            "change:comment": "ChangeView",
            "change:linenum": "ChangeView",
        },
        ChangeView: function() {
            this.$el.find("span#name").text(this.model.get("comment"));
            this.$el.find("a#linenum").text(this.model.get("linenum"));
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
  <div class="dropdown">\
    <button class="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown"><i class="fa fa-align-justify fw"></i></button>\
    <button class="btn btn-default user-snippet-group" type="button"><i class="fa fa-save fw"></i></button>\
    <button class="btn btn-default user-snippet-group" type="button"><i class="fa fa-trash fw"></i></button>\
    <button class="btn btn-default another-user-snippet-group" type="button"><i class="fa fa-code-fork fw"></i></button>\
    <button class="btn btn-default another-user-snippet-group" type="button"><i class="fa fa-star fw"></i></button>\
    <button class="btn btn-default another-user-snippet-group" type="button"><i class="fa fa-eye fw"></i></button>\
    <ul class="dropdown-menu">\
        <li><a href="#">&nbsp\
            <i class="fa fa-save fw"></i>&nbsp&nbsp&nbsp&nbsp&nbsp\
            <i class="fa fa-repeat fw"></i>&nbsp&nbsp&nbsp&nbsp&nbsp\
            <i class="fa fa-trash fw"></i>&nbsp&nbsp&nbsp&nbsp&nbsp\
            <i class="fa fa-close fw"></i>\
        </a></li>\
        <li><a class="sp-menu-item" href="#"><i class="fa fa-code-fork fw"></i> Fork snippet</a></li>\
        <li><a class="sp-menu-item" href="#"><i class="fa fa-star fw"></i> Star snippet</a></li>\
        <li><a class="sp-menu-item" href="#"><i class="fa fa-user fw"></i> More user\'s snippets </a></li>\
        <li><a class="sp-menu-item" href="#"><i class="fa fa-eye-open fw"></i> Watch </a></li>\
        <li><a class="sp-menu-item" href="#"><i class="fa fa-question fw"></i> Questions ???</a></li>\
    </ul>\
  </div>\
  <br><ul class="history-list"></ul>'),
        childViewContainer: "ul.history-list",
        ui: {
            save: "i.fa-save",
            do_action: "i.fa"
        },
		childView: historyItem,
        'collectionEvents': {
          'add': 'onAdd',
          'remove': 'onRemove'
        },
        events: {
            "click @ui.save": "onSave",
            "click i.fa" : "OnAction",
            "click button" : "OnButton",
            "click a.sp-menu-item" : "OnTextMenu"
        },
        showType: function(ifa) {
            if (ifa.hasClass("fa-user")) {
                // show user for current snippet
                App.trigger("snippet:user", {});
            }
            else if (ifa.hasClass("fa-star")) {
                App.trigger("snippet:star", {});
            }
            else if (ifa.hasClass("fa-code-fork")) {
                App.trigger("snippet:fork", {});
            }
            else if (ifa.hasClass("fa-eye-open")) {
                App.trigger("snippet:watch", {});
            }
            else if (ifa.hasClass("fa-question")) {
                App.trigger("snippet:question", {});
            }
            else if (ifa.hasClass("fa-save")) {
                App.appRouter.navigate("/github.com/snippets/save", {trigger: true});
            }
            else if (ifa.hasClass("fa-repeat")) {
                App.trigger("snippet:reload", {});
            }
        },
        OnTextMenu: function(e) {
            this.showType($(e.target).children("i.fa"));
        },
        OnButton: function(e) {
            this.showType($(e.target).children("i.fa"));
        },
        OnAction: function(e) {
            this.showType($(e.target));
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
        }
	});

    return historyListView;
});
