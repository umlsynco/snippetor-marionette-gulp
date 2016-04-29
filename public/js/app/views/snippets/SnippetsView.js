define( [ 'App', 'marionette', 'behaviours/navigation', 'text!templates/snippets.html'], function(App, Marionette, PreventNavigation, templateSnippets) {

      var snippetorAPI = null;
      var serverAPI = null;
	
	  // GitHub Repository item description:
 	
      var repoItem = Marionette.ItemView.extend({
		  tagName: "LI",
		  className: "selectable read table-list-item js-navigation-item js-issue-row",
         template: _.template('\
    <label class="table-list-cell table-list-cell-checkbox">\
      <input class="select-toggle-check js-check-all-item js-issues-list-check" name="snippets[]" value="8" type="checkbox">\
    </label>\
  <div class="table-list-cell table-list-cell-type">\
    <a aria-label="Stars" class="tooltipped tooltipped-n">\
</a><a aria-label="Like it!" class="tooltipped tooltipped-n">\
      <i class="fa fa-star fa-fw"></i>133<br>\
</a></div>  <div class="table-list-cell table-list-cell-type">\
<a aria-label="Forks" class="tooltipped tooltipped-n">\
      <i class="fa fa-code-fork fa-fw"></i>4<br>\
</a></div>\
  <div class="table-list-cell snippet-title">\
    <a href="/github.com/snippets/<%= _id %>" class="issue-title-link js-navigation-open">\
      <%= name %>\
    </a>\
    <div class="issue-meta">\
      <span class="issue-meta-section opened-by">\
          <%= description %>  \
      </span>\
      <span class="issue-meta-section css-truncate issue-milestone">\
      </span>\
    </div>\
  </div>\
  <div class="table-list-cell sp-play-comments">\
    <a id="sp-play-snippet" href="/github.com/snippets/<%= _id %>" aria-label="Play snipppet" class="tooltipped tooltipped-n">\
      <svg aria-hidden="true" class="octicon octicon-comment" height="16" role="img" version="1.1" viewBox="0 0 14 16" width="14"><path d="M13 2H1c-0.55 0-1 0.45-1 1v8c0 0.55 0.45 1 1 1h2v3.5l3.5-3.5h6.5c0.55 0 1-0.45 1-1V3c0-0.55-0.45-1-1-1z m0 9H6L4 13V11H1V3h12v8z"></path></svg>\
      <%= ccount %>\
    </a>\
  </div>\
  <div class="table-list-cell table-list-cell-avatar">\
  </div>\
  <div class="table-list-cell snippet-author" aria-label="User snipppets" class="tooltipped tooltipped-n">\
    <a href="/github.com/snippets?user=<%= getUserId() %>" class="muted-link ">\
      <%= getUserId() %>\
    </a>\
  </div>'),
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
          
      return Marionette.CompositeView.extend({
		  className: "issues-listing",
		  childView: repoItem,
		  childViewContainer: "ul.table-list-issues",
		  initialize: function(options) {
			  this.snippets = options.snippetorAPI;
              snippetorAPI = options.snippetorAPI;
              serverAPI = options.serverAPI;

			  this.collection = serverAPI.getSnippets();
              // latest modified for current user
              this.collection.fetch();
		  },
          template: _.template(templateSnippets),
          behaviors: {
              PreventNavigation: {
              }
          },
          events: {
              "click a.snippets-remove": "removeSelected",
              "click a.sp-snippets-search": "searchScope"
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
});

