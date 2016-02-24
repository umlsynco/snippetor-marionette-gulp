define( [ 'marionette', 'hljs'], function(Marionette) {
	
	  var cachedGithub = null, searchData = "";
	  // GitHub Repository item description:
	  var ContentView  = Marionette.ItemView.extend({
		 tagName: "pre",
		 className: "prettyprint linenums:1",
         template: _.template('<code class="html"><%= getContent() %></code>'),
         templateHelpers: function(){
		   var content = this.options.content;
           return {
             getContent: function(){
				var res = content.replace(/\</g, "&lt;");
				res = res.replace(/\>/g, "&gt;");
				var datar = res.split("\n");
				var resdata = "";
				var counter = 0;
				$.each(datar, function(idx, line) {
				    if (line.indexOf(searchData) > -1 && (counter < 3))  {
					    var fff = datar[idx].replace(searchData, "<b style='color:black;'>"+searchData+"</b>");
						resdata += datar[idx-3] + "\n" + datar[idx-2] + "\n" + datar[idx-1] + "\n" + fff + "\n" + datar[idx+1] + "\n" + "..." + "\n";
						++counter;
				    }
				    
				});
				return resdata;
			 }
		   };
		 },
		 ui: {
			 code: "code.html"
		 },
		 onRender: function() {
			 //hljs.highlightBlock(this.ui.code);
			 prettyPrint();
		 }
      });
	
	
      var codeSearchItem = Marionette.LayoutView.extend({
         template: _.template('\
<div class="code-list-item code-list-item-public repo-specific">\
  <span class="language"><%= getLanguage() %></span>\
  <p class="title">\
      <a  class="sp-github-blob-id" sha="<%= sha %>" repo="<%= full_name() %>" href="/github.com/<%= full_name() %>/blob/master/<%= path %>"><%= path %></a> <br>\
      <span class="text-small text-muted match-count">Showing the top three matches.</span>\
      <span class="text-small text-muted updated-at">Last indexed <time title="11 окт. 2015 г., 13:12 GMT+4" datetime="2015-10-11T09:12:25Z" is="relative-time">on 11 Oct 2015</time>.</span>\
  </p>\
  <div class="file-box blob-wrapper" id="<%= sha %>" repo="<%= full_name() %>"></div>\
 </div>'),
         templateHelpers: function(){
           return {
			 sha: this.model.get("sha"),
             full_name: function(){ 
               return this["repository"].full_name;
             },
             getLanguage: function() {
				return  (this["language"] != null ? this["language"] : '');
			 }
           }
         },
         regions: {
			 "content": "DIV.file-box"
		 },
		 onRender: function(options) {
			 // Request code
			 var repo = cachedGithub.getRepo(this.model.get("repository").full_name);
			 var that = this;
			 repo.getBlob(this.model.get("sha"), function(err, data) {
				 if (data)
			       that.content.show(new ContentView({content: data}));
			 });
		 }
    });
      
      return Marionette.CompositeView.extend({
		  className: "repo-tab",
		  childView: codeSearchItem,
		  childViewContainer: "DIV.code-list",
		  ui : {
			  total_count: "span#total_count"
		  },
		  initialize: function(options) {
			  this.github = options.githubAPI;
			  // TODO: HACK provide to the concreate child view !!
			  cachedGithub = options.githubAPI;
			  this.collection = new Backbone.Collection;
			  var that = this;
			  var user = this.github.getUser();
			  var req = "";
			  _.each(this.model.get("query").split("&"), function(item) {
				  var kv = item.split("=");
				  if (kv.length == 2 && kv[0] == "q") {
					  req = kv[1];
				  }
			  });
			  
			  this.model.set("req", req);
			  // TODO: HACK provide to the concreate child view !!
			  searchData = req;

              var search = Github.getSearch(req + "+repo:"+this.model.get("user")+"/"+this.model.get("repo")+"+filename:"+req);

  		      search.code({}, function(error, data) {
			        if (data) {
				        that.collection.add(data.items);
				        that.ui.total_count.html(data.total_count);
				        that.model.set("incomplete_results", data.total_count);
					}
		      });
		  },
          template: _.template('<div class="column three-fourths codesearch-results">\
    <div class="codesearch-head">\
      <form accept-charset="UTF-8" action="/github.com/<%= user %>/<%= repo %>/search" class="flex-table search-form-fluid" id="search_form" method="get"><div style="margin:0;padding:0;display:inline"><input name="utf8" value="✓" type="hidden"></div>\
        <div class="flex-table-item flex-table-item-primary">\
          <input class="input-block" name="q" value="<%= req %>" tabindex="2" autocapitalize="off" autofocus="" type="text">\
          <input id="type_value" name="type" value="Code" type="hidden">\
        </div>\
        <div class="flex-table-item">\
          <button class="btn" type="submit" tabindex="3">Search</button>\
        </div>\
</form>    </div>\
  <div class="sort-bar">\
    <div class="select-menu js-menu-container js-select-menu right select-menu-modal-right">\
      <button class="btn btn-sm select-menu-button js-menu-target" type="button" aria-haspopup="true">\
        <i>Sort:</i>\
        <span class="js-select-button">Best match</span>\
      </button>\
      <div class="select-menu-modal-holder js-menu-content js-navigation-container" aria-hidden="true">\
        <div class="select-menu-modal">\
          <div class="select-menu-header">\
            <svg aria-label="Close" class="octicon octicon-x js-menu-close" height="16" role="img" version="1.1" viewBox="0 0 12 16" width="12"><path d="M7.48 8l3.75 3.75-1.48 1.48-3.75-3.75-3.75 3.75-1.48-1.48 3.75-3.75L0.77 4.25l1.48-1.48 3.75 3.75 3.75-3.75 1.48 1.48-3.75 3.75z"></path></svg>\
            <span class="select-menu-title">Sort options</span>\
          </div>\
          <div class="select-menu-list">\
              <span class="select-menu-item js-navigation-open js-navigation-item selected">\
                <svg aria-hidden="true" class="octicon octicon-check select-menu-item-icon" height="16" role="img" version="1.1" viewBox="0 0 12 16" width="12"><path d="M12 5L4 13 0 9l1.5-1.5 2.5 2.5 6.5-6.5 1.5 1.5z"></path></svg>\
                <span class="select-menu-item-text js-select-button-text">Best match</span>\
</span>              <a class="select-menu-item js-navigation-open js-navigation-item" href="https://github.com/umlsynco/umlsync-framework/search?o=desc&amp;q=border&amp;s=indexed&amp;utf8=%E2%9C%93">\
                <svg aria-hidden="true" class="octicon octicon-check select-menu-item-icon" height="16" role="img" version="1.1" viewBox="0 0 12 16" width="12"><path d="M12 5L4 13 0 9l1.5-1.5 2.5 2.5 6.5-6.5 1.5 1.5z"></path></svg>\
                <span class="select-menu-item-text js-select-button-text">Recently indexed</span>\
</a>              <a class="select-menu-item js-navigation-open js-navigation-item" href="https://github.com/umlsynco/umlsync-framework/search?o=asc&amp;q=border&amp;s=indexed&amp;utf8=%E2%9C%93">\
                <svg aria-hidden="true" class="octicon octicon-check select-menu-item-icon" height="16" role="img" version="1.1" viewBox="0 0 12 16" width="12"><path d="M12 5L4 13 0 9l1.5-1.5 2.5 2.5 6.5-6.5 1.5 1.5z"></path></svg>\
                <span class="select-menu-item-text js-select-button-text">Least recently indexed</span>\
</a>          </div>\
        </div>\
      </div>\
    </div>\
    <h3>\
    We’ve found <span id="total_count">0</span> code results\
</h3>\
  </div>\
\
  <div id="code_search_results">\
    <div class="code-list"></div>\
    <div class="paginate-container">\
       <div class="pagination" data-pjax="true"><span class="previous_page disabled">Previous</span> <em class="current">1</em> <a rel="next" href="/umlsynco/umlsync-framework/search?p=2&amp;q=border&amp;utf8=%E2%9C%93">2</a> <a href="/umlsynco/umlsync-framework/search?p=3&amp;q=border&amp;utf8=%E2%9C%93">3</a> <a href="/umlsynco/umlsync-framework/search?p=4&amp;q=border&amp;utf8=%E2%9C%93">4</a> <a href="/umlsynco/umlsync-framework/search?p=5&amp;q=border&amp;utf8=%E2%9C%93">5</a> <a href="/umlsynco/umlsync-framework/search?p=6&amp;q=border&amp;utf8=%E2%9C%93">6</a> <a href="/umlsynco/umlsync-framework/search?p=7&amp;q=border&amp;utf8=%E2%9C%93">7</a> <a class="next_page" rel="next" href="/umlsynco/umlsync-framework/search?p=2&amp;q=border&amp;utf8=%E2%9C%93">Next</a></div>\
    </div>\
  </div>\
    <div class="context-loader large-format-loader">\
  <p><img alt="" src="https://assets-cdn.github.com/images/spinners/octocat-spinner-128.gif" height="64" width="64"></p>\
  <p>Loading…</p>\
</div>\
  </div>')

      });
});

