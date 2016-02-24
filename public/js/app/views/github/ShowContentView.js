define( [ 'marionette', 'base-64', 'hljs', 'App'], function(Marionette, base64, hljs, App) {
    
   var BubbleView  = Marionette.ItemView.extend({
	   template: _.template('\
     <div style="top: 350.1px; left: 673px; width:250px; display: block; position:absolute;" id="step-0" class="popover tour-tour tour-tour-0 fade bottom in" role="tooltip">\
       <div style="content: \'\';position: absolute;border-style: solid;border-width: 15px 15px 15px 0;border-color: transparent grey;display: block;width: 0;z-index: 1;left: -15px;top: 12px;"></div>\
       <h3 class="popover-title">Snippet name</h3>\
       <div class="popover-content">Introduce new users to your product by walking them through it step by step.</div>\
       <div class="popover-navigation">\
         <div class="btn-group">\
           <button class="btn btn-sm btn-default disabled" id="bubble-prev">« Prev</button>\
           <button class="btn btn-sm btn-default" id="bubble-next">Next »</button>\
         </div>\
         <div class="btn-group right">\
          <button class="btn btn-sm btn-default" id="bubble-save">Save</button>\
          <button class="btn btn-sm btn-default" id="bubble-close">Close</button>\
         </div>\
       </div></div>'),
       ui: {
		   prev: "button#bubble-prev",
		   next: "button#bubble-next",
		   save: "button#bubble-save",
		   close: "button#bubble-close"
	   },
	   events: {
		   "click @ui.save": "onSave",
		   "click @ui.close": "onClose",
		   "click @ui.prev": "onPrev",
		   "click @ui.next": "onNext"
	   },
	   onSave: function() {
		   App.vent.trigger("history:bubble", {path: "this/contnet.path", sha: "SOME MAGIC", branch: "BRANCH AS IS !", repo:"umlsynco/BUBLIK", comment: "SOME COMMENT"});
			   
	   },
	   onClose: function() {
		   alert("CLOSE");
	   },
	   onPrev: function() {
		   alert("Previous");
	   },
	   onNext: function() {
		   alert("NEXT");
	   }
   });


      // GitHub Repository item description:
    
      var ContentView  = Marionette.ItemView.extend({
		 tagName: "pre",
		 className: "prettyprint linenums:1",
         template: _.template('<%= getContent() %>'),
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
		 onRender: function() {
//			 hljs.highlightBlock($(this.ui.code));
		 }
      });
          
      return Marionette.LayoutView.extend({
          className: "file-wrap",
          regions: {
			  "content": ".blob-wrapper",
			  "bubble" : "div.bubble"
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
				       $("pre.prettyprint>ol>li").click(function() {
                         that.showChildView("bubble", new BubbleView({}));
                         var pos = $(this).position();
                         pos.left += 50;
                         pos.top += 80;
                         var $t = $("div#step-0");
                         $t.css(pos);
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
    <div class="input-group custom-search-form right" style="padding-right:0px; margin-top: -5px;">\
    <form accept-charset="UTF-8" action="/github.com/<%= repo %>/search" class="repo-search" method="get" role="search">\
      <div class="input-group">\
         <input name="utf8" value="✓" type="hidden">\
         <input name="user" value="umlsynco" type="hidden">\
         <span class="input-group-addon beautiful"><span class="fa fa-check-circle-o"></span></span>\
         <input type="text" class="form-control" name="q" placeholder="Search...">\
         <span class="input-group-btn">\
           <button class="btn btn-default" type="button">\
             <i class="fa fa-search"></i>\
           </button>\
           <button class="btn btn-default" type="button">\
             <i class="fa">  File</i>\
           </button>\
         </span></div>\
    </form></div>\
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
  <div class="blob-wrapper data type-javascript"></div></div>\
  <div class="bubble" style="position:absolute; left:250; top:0;"></div>\
    ')

      });
});

