define( [ 'marionette', 'text!templates/snippets.html'], function(Marionette, templateSnippets) {
	
	  // GitHub Repository item description:
	
      var repoItem = Marionette.ItemView.extend({
		  tagName: "LI",
		  className: "selectable read table-list-item js-navigation-item js-issue-row",
         template: _.template('\
    <label class="table-list-cell table-list-cell-checkbox">\
      <input class="select-toggle-check js-check-all-item js-issues-list-check" name="issues[]" value="8" type="checkbox">\
    </label>\
  <div class="table-list-cell table-list-cell-type">\
    <a href="/umlsynco/snippetor-marionette-gulp/issues?q=is%3Aissue+is%3Aopen" aria-label="View all issues" class="tooltipped tooltipped-n">\
      <svg aria-hidden="true" class="octicon octicon-issue-opened open" height="16" role="img" version="1.1" viewBox="0 0 14 16" width="14"><path d="M7 2.3c3.14 0 5.7 2.56 5.7 5.7S10.14 13.7 7 13.7 1.3 11.14 1.3 8s2.56-5.7 5.7-5.7m0-1.3C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7S10.86 1 7 1z m1 3H6v5h2V4z m0 6H6v2h2V10z"></path></svg>\
</a>  </div>\
  <div class="table-list-cell issue-title">\
    <a href="/umlsynco/snippetor-marionette-gulp/issues/8" class="issue-title-link js-navigation-open">\
      [frontend]: Save comment/s to the list\
    </a>\
    <div class="issue-meta">\
      <span class="issue-meta-section opened-by">\
        #8\
        opened <time title="25 февр. 2016 г., 19:25 GMT+4" datetime="2016-02-25T15:25:46Z" is="relative-time">8 days ago</time> by\
        <a href="/umlsynco/snippetor-marionette-gulp/issues?q=is%3Aissue+is%3Aopen+author%3Aumlsynco" aria-label="View all issues opened by umlsynco" class="tooltipped tooltipped-s muted-link">umlsynco</a>\
      </span>\
      <span class="issue-meta-section css-truncate issue-milestone">\
      </span>\
      <span class="issue-meta-section task-progress"><svg aria-hidden="true" class="octicon octicon-checklist" height="16" role="img" version="1.1" viewBox="0 0 16 16" width="16"><path d="M16 8.5L10 14.5 7 11.5l1.5-1.5 1.5 1.5 4.5-4.5 1.5 1.5zM5.7 12.2l0.8 0.8H2c-0.55 0-1-0.45-1-1V3c0-0.55 0.45-1 1-1h7c0.55 0 1 0.45 1 1v6.5l-0.8-0.8c-0.39-0.39-1.03-0.39-1.42 0L5.7 10.8c-0.39 0.39-0.39 1.02 0 1.41zM4 4h5v-1H4v1z m0 2h5v-1H4v1z m0 2h3v-1H4v1z m-1 1h-1v1h1v-1z m0-2h-1v1h1v-1z m0-2h-1v1h1v-1z m0-2h-1v1h1v-1z"></path></svg><span class="task-progress-counts">1 of 3</span><span class="progress-bar"><span class="progress" style="width: 33%"></span></span></span>\
    </div>\
  </div>\
  <div class="table-list-cell table-list-cell-avatar">\
  </div>\
  <div class="table-list-cell issue-comments">\
    <a href="/umlsynco/snippetor-marionette-gulp/issues/8" class="muted-link ">\
      <svg aria-hidden="true" class="octicon octicon-comment" height="16" role="img" version="1.1" viewBox="0 0 14 16" width="14"><path d="M13 2H1c-0.55 0-1 0.45-1 1v8c0 0.55 0.45 1 1 1h2v3.5l3.5-3.5h6.5c0.55 0 1-0.45 1-1V3c0-0.55-0.45-1-1-1z m0 9H6L4 13V11H1V3h12v8z"></path></svg>\
      1\
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
			 }
           }
         }
    });
          
      return Marionette.CompositeView.extend({
		  className: "issues-listing",
		  childView: repoItem,
		  childViewContainer: "ul.table-list-issues",
		  initialize: function(options) {
			  this.snippets = options.snippetsAPI;
			  this.collection = new Backbone.Collection;
			  this.collection.add([{name:"bublik"}, {name:"bublik2"}, {name:"bublik4"}]);
		  },
          template: _.template(templateSnippets)

      });
});

