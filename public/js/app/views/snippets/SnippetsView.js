define( [ 'App', 'marionette', 'behaviours/navigation', 'views/PaginationView',
         'text!templates/snippet_item.html', 'text!templates/snippets.html', 'text!templates/snippets_search_form.html',
         'utils/DateToString'],
  function(App, Marionette, PreventNavigation, PaginationView,
     templateSnippetItem, templateSnippets, searchTemplateForm,
     DateToString) {

      var snippetorAPI = null;
      var serverAPI = null;

	  // GitHub Snippet item description:
      var snippetItem = Marionette.ItemView.extend({
		  tagName: "LI",
		  className: "selectable read table-list-item js-navigation-item js-issue-row",
         template: _.template(templateSnippetItem),
         templateHelpers: function(){
           return {
             getPrivate: function(){ 
               return this["private"] ? 'private' : 'public';
             },
             getPrivateSpan: function(){ 
               return (this["private"] ? '<span class="repo-private-label">Private</span>': '');
             },
             getLanguage: function() {
				return  (this["language"] != null ? this["language"] : '');
			 },
             getUserId: function() {
                 if (this["userId"] && this["userId"].username) return this["userId"].username;
                 return "";
             },
             getForks: function() {
                 return this["forks"] || 0;
             },
             getStars: function() {
                 return this["stars"] || 0;
             },
             getWatches: function() {
                 return this["watches"] || 0;
             },
             userName: function() {
                 if (this["userId"] && this["userId"].displayName) return this["userId"].displayName;
                 return "";
             },
             UpdatedAt: function() {
                 return DateToString(this["updatedAt"]);
             },
             CreatedAt: function() {
                 return DateToString(this["updatedAt"]);
             }
           }
         },
         ui : {
             play: "a#sp-play-snippet",
             fork: "i.fa-code-fork",
             trash: "i.fa-trash",
             star: "i.fa-star",
             checkbox: "input[type=checkbox]"
         },
         events: {
             "click @ui.play": "onPlay",
             "click @ui.star": "onStar",
             "click @ui.fork": "onFork",
             "click @ui.trash": "onSnippetRemove",
             "click @ui.checkbox": "OnChecked"
         },
         behaviors: {
             PreventNavigation: {
             }
         },
         OnChecked: function() {
             this.model.set({selected: this.ui.checkbox.is(":checked")});
         },
         onSnippetRemove: function(e) {
             e.preventDefault();
             this.model.collection.remove(this.model);
         },
         onStar: function() {
             
         },
         onFork: function() {
         },
         onPlay: function(evt) {
           evt.preventDefault();
           App.vent.trigger("snippet:open", this.model);
         }
    });
          
      var SearchResultTable = Marionette.CompositeView.extend({
		  className: "issues-listing",
		  childView: snippetItem,
		  childViewContainer: "ul.table-list-issues",
          page: 0,
		  initialize: function(options) {
			  this.snippets = options.snippetorAPI;
              snippetorAPI = options.snippetorAPI;
              serverAPI = options.serverAPI;

			  this.collection = serverAPI.getSnippets();
              var that = this;
              // latest modified for current user
              this.collection.fetch({data: this.model.get("query")}).then(function(data) {
                  // Sync-up pagination
                  that.options.model.set({limit: data.limit, page: data.page + 1, total: data.total});
               });
		  },
          modelEvents: {
             "change": "modelChanged"
          },
          modelChanged: function(model) {
              if (model.changed.limit && model.changed.total)
                return;
              // Fetch another page
              if (model.changed.page) {
                var xxx = this.model.get("query") || {};
                xxx.page = model.changed.page;
                this.collection.fetch({data: xxx});
              }
          },
          template: _.template(templateSnippets),
          behaviors: {
              PreventNavigation: {
              }
          },
          events: {
              "click a.snippets-remove": "removeSelected",
              "click a.sp-snippets-search": "searchScope",
              "click ": 'loadPage'
          },
          loadPage: function(e) {
              // 1. 
          },
          onRender: function() {
              var $input = this.$el.find("#sp-snippets-search>input#q");
              if (this.model.get("repo")) {
                  this.$el.find("#sp-snippets-repo>span").html(this.model.get("repo"));
                  this.$el.find("#sp-snippets-repo>input").prop("checked", true );
                  $input.val("repo:" + this.model.get("repo") + " " + $input.val());
              }
              if (this.model.has("user")) {
                  this.$el.find("#sp-snippets-user>span").html(this.model.get("user"));
                  this.$el.find("#sp-snippets-user>input").prop("checked", true );
                  $input.val("user:" + this.model.get("user") + " " + $input.val());
              }
          },
          searchScope: function(e) {
              e.preventDefault();
              var selected_item = $(e.currentTarget);
              var got_switch = selected_item.attr("data-selected-links");
              if (got_switch == "user") {
                  var text = this.$el.find("input#js-issues-search").val();
                  this.$el.find("input#js-issues-search").val("user:umlsynco " + text);
              }
              else if (got_switch == "global") {
                  var text = this.$el.find("input#js-issues-search").val();
                  this.$el.find("input#js-issues-search").val("global");
              }
          },
          removeSelected: function(e) {
              e.preventDefault();
              var removeItems = this.collection.where({selected: true});
              _.each(removeItems, function(item) {
                   item.set({id: item.get("_id")});
                   item.destroy();
               });
          }
    });


    var SnippetSearchForm = Marionette.ItemView.extend({
       template: _.template(searchTemplateForm),
       events: {
           "click #sp-snippets-dropdown-filter": "toggleSearchTools"
       },
       toggleSearchTools: function(event) {
           this.$el.find("div.panel-body").slideToggle();
       }
    });

    return Marionette.LayoutView.extend({
        template: _.template("<div class='subnav' id='sp-snippet-search-form'></div><div id='sp-snippet-search-table'></div><div id='sp-snippet-search-pagination'></div>"),
        regions: {
           searchForm: "#sp-snippet-search-form",
           searchTable: "#sp-snippet-search-table",
           pagination: "#sp-snippet-search-pagination"
        },
        search_table_view: null,
        onBeforeShow: function() {
            this.showChildView('searchForm', new SnippetSearchForm(this.options));
            // fill pagination model
            this.showChildView('searchTable', new SearchResultTable(this.options));
            // update pagination model
            this.showChildView('pagination', new PaginationView(this.options));
        }
    });

});

