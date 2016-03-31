define( [ 'marionette', 'text!templates/snippets.html'], function(Marionette, templateSnippets) {

      var snippetorAPI = null;
	
	  // GitHub Repository item description:
 	
      var repoItem = Marionette.ItemView.extend({
		  tagName: "LI",
		  className: "selectable read table-list-item js-navigation-item js-issue-row",
         template: _.template('\
    <label class="table-list-cell table-list-cell-checkbox">\
      <input class="select-toggle-check js-check-all-item js-issues-list-check" name="snippets[]" value="8" type="checkbox">\
    </label>\
  <div class="table-list-cell table-list-cell-type">\
    <a aria-label="Start to view snipppet" class="tooltipped tooltipped-n">\
      <i class="fa fa-play fa-fw"></i><br>\
</a><a href="/github.com/snippets/<%= _id %>" aria-label="Like it!" class="tooltipped tooltipped-n">\
      <i class="fa fa-star fa-fw"></i>133<br>\
</a><a href="/github.com/snippets/<%= _id %>" aria-label="Remove snipppet" class="tooltipped tooltipped-n">\
      <i class="fa fa-trash fa-fw"></i><br>\
</a><a href="/github.com/snippets/<%= _id %>" aria-label="Fork snipppet" class="tooltipped tooltipped-n">\
      <i class="fa fa-code-fork fa-fw"></i>4<br>\
</a>\
</a><a href="/github.com/snippets/<%= _id %>" aria-label="Share snipppet" class="tooltipped tooltipped-n">\
      <i class="fa fa-share fa-fw"></i><br>\
</a>\
</a><a href="/github.com/snippets/<%= _id %>" aria-label="Follow snipppet" class="tooltipped tooltipped-n">\
      <i class="fa fa-watch fa-fw"></i>On<br>\
</a>  </div>\
  <div class="table-list-cell issue-title">\
    <a href="/github.com/umlsynco/<%= _id %>" class="issue-title-link js-navigation-open">\
      <%= name %>\
    </a>\
    <div class="issue-meta">\
      <span class="issue-meta-section opened-by">\
          <%= description %>  \
      </span>\
      <span class="issue-meta-section css-truncate issue-milestone">\
      </span>\
      <span class="issue-meta-section task-progress"><svg aria-hidden="true" class="octicon octicon-checklist" height="16" role="img" version="1.1" viewBox="0 0 16 16" width="16"><path d="M16 8.5L10 14.5 7 11.5l1.5-1.5 1.5 1.5 4.5-4.5 1.5 1.5zM5.7 12.2l0.8 0.8H2c-0.55 0-1-0.45-1-1V3c0-0.55 0.45-1 1-1h7c0.55 0 1 0.45 1 1v6.5l-0.8-0.8c-0.39-0.39-1.03-0.39-1.42 0L5.7 10.8c-0.39 0.39-0.39 1.02 0 1.41zM4 4h5v-1H4v1z m0 2h5v-1H4v1z m0 2h3v-1H4v1z m-1 1h-1v1h1v-1z m0-2h-1v1h1v-1z m0-2h-1v1h1v-1z m0-2h-1v1h1v-1z"></path></svg><span class="task-progress-counts">1 of 3</span><br><span class="progress-bar"><span class="progress" style="width: 33%"></span></span></span>\
    </div>\
  </div>\
  <div class="table-list-cell table-list-cell-avatar">\
  </div>\
  <div class="table-list-cell issue-comments">\
    <a href="/umlsynco/snippetor-marionette-gulp/issues/8" class="muted-link ">\
      <svg aria-hidden="true" class="octicon octicon-comment" height="16" role="img" version="1.1" viewBox="0 0 14 16" width="14"><path d="M13 2H1c-0.55 0-1 0.45-1 1v8c0 0.55 0.45 1 1 1h2v3.5l3.5-3.5h6.5c0.55 0 1-0.45 1-1V3c0-0.55-0.45-1-1-1z m0 9H6L4 13V11H1V3h12v8z"></path></svg>\
      <%= ccount %>\
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
         },
         ui : {
             play: "i.fa-play",
             fork: "i.fa-code-fork",
             trash: "i.fa-trash",
             star: "i.fa-star"
         },
         events: {
             "click @ui.play": "onPlay",
             "click @ui.star": "onStar",
             "click @ui.fork": "onFork",
             "click @ui.trash": "onSnippetRemove"
         },
         onSnippetRemove: function() {
             this.model.collection.remove(this.model);
         },
         onStar: function() {
             
         },
         onFork: function() {
         },
         onPlay: function() {
             
             var snid = this.model.get("_id");
             this.model.comments = new (Backbone.Collection.extend({
                 url: "/api/comments/" + snid + "/",
             }));
             
             this.model.repos = new (Backbone.Collection.extend({
                 url: "/api/repos/",
                 model : Backbone.Model.extend({
                     urlRoot: function() {
                         return "/api/repos/" + this.model.get("_id");
                     }
                 })
             }));
             
             var repoCollection = this.model.repos;
             this.model.comments.fetch().always(function(data, status) {
                 if (status == "success" && snippetorAPI) {
                     snippetorAPI.getHistoryList().reset();
                     _.each(data, function(item, idx) {
                         var repo = new (Backbone.Model.extend({
                            urlRoot: function() {
                              return "/api/repos/" + item.commentId.repository;
                            }
                         })) ({ _id: item.commentId.repository});

                         repo.fetch()
                         .always(function(repoItem, success) {
                             if (success == "success") {
                               var hm = snippetorAPI.addHistory({repo: repoItem.repository, branch: "master", path: item.commentId.path, sha:""});
                               hm.comments.add({linenum: item.commentId.line, comment: item.commentId.comment});
                             }
                         });
                   });
                 }
             });
         }
    });
          
      return Marionette.CompositeView.extend({
		  className: "issues-listing",
		  childView: repoItem,
		  childViewContainer: "ul.table-list-issues",
		  initialize: function(options) {
			  this.snippets = options.snippetorAPI;
              snippetorAPI = options.snippetorAPI;
			  this.collection = new (Backbone.Collection.extend({url: "/api/snippets",
                  model: Backbone.Model.extend({
                      defaults: {ccount: 0}})}));
              this.collection.fetch();
		  },
          template: _.template(templateSnippets)

      });
});

