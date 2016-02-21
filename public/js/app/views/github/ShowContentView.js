define( [ 'marionette', 'base-64', 'hljs', 'App'], function(Marionette, base64, hljs, App) {
    
      // GitHub Repository item description:
    
      var ContentView  = Marionette.ItemView.extend({
		 tagName: "pre",
		 className: "prettyprint linenums:1",
         template: _.template('<code class="python"><%= getContent() %></code>'),
         templateHelpers: function(){
		   var content = this.options.content;
           return {
             getContent: function(){ 
				 var res = content.replace(/\</g, "&lt;");
				 res = res.replace(/\>/g, "&gt;");
				 return res;
			 }
		   };
		 },
		 ui: {
			 code: "code.python"
		 },
		 onRender: function() {
//			 hljs.highlightBlock($(this.ui.code));
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
              var repoName = this.model.get("repo");
              var branch = this.model.get("branch") || "master";
              var path = this.model.get("path") || "";
              if (path != "") {
                 repo.contents(branch, path, function(err, data) {
					 var content = "";
                     if (data) {
					   if (data.encoding == "base64") {
						   content = base64.decode(data.content);
					   }
                       that.showChildView("content", new ContentView({content: content}));
                       prettyPrint();
                       $("span.typ").click(function() {
						   App.appRouter.navigate("/github.com/" + repoName + "/search?q=" + $(this).text(), {trigger: true});
				       });
				     }
                 });
             }
          },
          templateHelpers: function(){
           return {
             getBreadcrumbs: function(){
				 if(!this.path) return "";
				 
				 var result = "";
				 var subpath = "";
				 var paths = (this.path || "").split("/");
				 for(var i = 0; i<paths.length; ++i) {
					 subpath = subpath + "/" + paths[i];
					 if (i !=paths.length -1) {
 					   result += '<span itemscope="" itemtype="http://data-vocabulary.org/Breadcrumb"><a href="/github.com/'+this.repo+'/tree/master'+ subpath + '" class="" data-branch="7ce846ec3297d3a0d7272dbfa38427d21f650a35" data-pjax="true" itemscope="url" rel="nofollow"><span itemprop="title">'+paths[i]+'</span></a></span></span><span class="separator">/</span>';
				     }
				     // Final path is not selectable
				     else {
					   result += '<strong class="final-path">'+paths[i]+'</strong>'
					 }
				 } // for
				 return result;
				 // <span itemscope="" itemtype="http://data-vocabulary.org/Breadcrumb"><a href="/github.com/<%= repo%>" class="" data-branch="7ce846ec3297d3a0d7272dbfa38427d21f650a35" data-pjax="true" itemscope="url" rel="nofollow"><span itemprop="title"><%= repo %></span></a></span></span><span class="separator">/</span><span itemscope="" itemtype="http://data-vocabulary.org/Breadcrumb"><a href="/umlsynco/umlsync-framework/tree/7ce846ec3297d3a0d7272dbfa38427d21f650a35/css" class="" data-branch="7ce846ec3297d3a0d7272dbfa38427d21f650a35" data-pjax="true" itemscope="url" rel="nofollow"><span itemprop="title">css</span></a></span><span class="separator">/</span><strong class="final-path">speachBubble.css</strong>
			 }
		   };
	      },
          template: _.template('\
  <div class="breadcrumb js-zeroclipboard-target">\
      <span class="repo-root js-repo-root"><span itemscope="" itemtype="http://data-vocabulary.org/Breadcrumb"><a href="/github.com/<%= repo %>" class="" data-branch="7ce846ec3297d3a0d7272dbfa38427d21f650a35" data-pjax="true" itemscope="url" rel="nofollow"><span itemprop="title"><%= repo %></span></a></span></span><span class="separator">/</span><%= getBreadcrumbs() %>\
  </div>\
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

