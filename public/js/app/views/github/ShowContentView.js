define( [ 'marionette'], function(Marionette) {
    
      // GitHub Repository item description:
    
      var ContentView  = Marionette.ItemView.extend({
		 tagName: "pre",
		 className: "prettyprint linenums:1",
         template: _.template('<%= getContent() %>'),
         templateHelpers: function(){
		   var content = this.options.content;
           return {
             getContent: function(){ 
				 return content;
			 }
		   };
		 }
      });
          
      return Marionette.LayoutView.extend({
          className: "file-wrap",
          regions: {
			  "content": ".blob-wrapper"
		  },
          initialize: function(options) {
              this.github = options.githubAPI;
              this.collection = new Backbone.Collection;
              var that = this;
              var repo = this.github.getRepo(this.model.get("repo"));
              var branch = this.model.get("branch") || "master";
              var path = this.model.get("path") || "";
              if (path != "") {
                 repo.read(branch, path, function(err, data) {
                     if (data) {
                       that.showChildView("content", new ContentView({content: data}));
                       prettyPrint();
				     }
                 });
             }
          },
          template: _.template('\
          <div class="file">\
  <div class="file-header">\
  <div class="file-actions">\
    <div class="btn-group">\
      <a href="/umlsynco/umlsync-framework/raw/7ce846ec3297d3a0d7272dbfa38427d21f650a35/js/Views/framework.js" class="btn btn-sm " id="raw-url">Raw</a>\
        <a href="/umlsynco/umlsync-framework/blame/7ce846ec3297d3a0d7272dbfa38427d21f650a35/js/Views/framework.js" class="btn btn-sm js-update-url-with-hash">Blame</a>\
      <a href="/umlsynco/umlsync-framework/commits/7ce846ec3297d3a0d7272dbfa38427d21f650a35/js/Views/framework.js" class="btn btn-sm " rel="nofollow">History</a>\
    </div>\
        <button type="button" class="btn-octicon disabled tooltipped tooltipped-nw" aria-label="You must be on a branch to make or propose changes to this file">\
          <svg aria-hidden="true" class="octicon octicon-pencil" height="16" role="img" version="1.1" viewBox="0 0 14 16" width="14"><path d="M0 12v3h3l8-8-3-3L0 12z m3 2H1V12h1v1h1v1z m10.3-9.3l-1.3 1.3-3-3 1.3-1.3c0.39-0.39 1.02-0.39 1.41 0l1.59 1.59c0.39 0.39 0.39 1.02 0 1.41z"></path></svg>\
        </button>\
        <button type="button" class="btn-octicon btn-octicon-danger disabled tooltipped tooltipped-nw" aria-label="You must be on a branch to make or propose changes to this file">\
          <svg aria-hidden="true" class="octicon octicon-trashcan" height="16" role="img" version="1.1" viewBox="0 0 12 16" width="12"><path d="M10 2H8c0-0.55-0.45-1-1-1H4c-0.55 0-1 0.45-1 1H1c-0.55 0-1 0.45-1 1v1c0 0.55 0.45 1 1 1v9c0 0.55 0.45 1 1 1h7c0.55 0 1-0.45 1-1V5c0.55 0 1-0.45 1-1v-1c0-0.55-0.45-1-1-1z m-1 12H2V5h1v8h1V5h1v8h1V5h1v8h1V5h1v9z m1-10H1v-1h9v1z"></path></svg>\
        </button>\
  </div>\
  <div class="file-info">\
      245 lines (210 sloc)\
      <span class="file-info-divider"></span>\
    7.59 KB\
  </div>\
  </div>\
  <div class="blob-wrapper data type-javascript"></div></div>')

      });
});

