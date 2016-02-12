define( [ 'marionette'], function(Marionette) {
	
	  // GitHub Repository item description:
	
      var repoItem = Marionette.ItemView.extend({
         template: _.template('\
			    <li class="repo-list-item <%= getPrivate() %> source">\
                    <div class="repo-list-stats">\
                          <%= getLanguage() %>\
                        <a class="repo-list-stat-item tooltipped tooltipped-s" href="https://github.com/<%= full_name %>/stargazers" aria-label="Stargazers">\
                          <svg aria-hidden="true" class="octicon octicon-star" height="16" role="img" version="1.1" viewBox="0 0 14 16" width="14">\
                          <path d="M14 6l-4.9-0.64L7 1 4.9 5.36 0 6l3.6 3.26L2.67 14l4.33-2.33 4.33 2.33L10.4 9.26 14 6z"></path></svg>\
                          <%= stargazers_count %>\
                        </a>\
                        <a class="repo-list-stat-item tooltipped tooltipped-s" href="https://github.com/<%= full_name %>/network" aria-label="Forks">\
                          <svg aria-hidden="true" class="octicon octicon-git-branch" height="16" role="img" version="1.1" viewBox="0 0 10 16" width="10">\
                          <path d="M10 5c0-1.11-0.89-2-2-2s-2 0.89-2 2c0 0.73 0.41 1.38 1 1.72v0.3c-0.02 0.52-0.23 0.98-0.63 1.38s-0.86 0.61-1.38 0.63c-0.83 0.02-1.48 0.16-2 0.45V4.72c0.59-0.34 1-0.98 1-1.72 0-1.11-0.89-2-2-2S0 1.89 0 3c0 0.73 0.41 1.38 1 1.72v6.56C0.41 11.63 0 12.27 0 13c0 1.11 0.89 2 2 2s2-0.89 2-2c0-0.53-0.2-1-0.53-1.36 0.09-0.06 0.48-0.41 0.59-0.47 0.25-0.11 0.56-0.17 0.94-0.17 1.05-0.05 1.95-0.45 2.75-1.25s1.2-1.98 1.25-3.02h-0.02c0.61-0.36 1.02-1 1.02-1.73zM2 1.8c0.66 0 1.2 0.55 1.2 1.2s-0.55 1.2-1.2 1.2-1.2-0.55-1.2-1.2 0.55-1.2 1.2-1.2z m0 12.41c-0.66 0-1.2-0.55-1.2-1.2s0.55-1.2 1.2-1.2 1.2 0.55 1.2 1.2-0.55 1.2-1.2 1.2z m6-8c-0.66 0-1.2-0.55-1.2-1.2s0.55-1.2 1.2-1.2 1.2 0.55 1.2 1.2-0.55 1.2-1.2 1.2z"></path></svg>\
                          <%= forks_count %>\
                        </a>\
                      </div>\
                    \
                      <h3 class="repo-list-name">\
                        <a href="<%= full_name %>">\
                          <%= full_name %></a>\
                          <%= getPrivateSpan() %>\
                      </h3>\
                        <p class="repo-list-description">\
                          <%= description %>\
                        </p>\
                      <p class="repo-list-meta">\
                          Updated <time title="25 янв. 2016 г., 18:05 GMT+4" datetime="2016-01-25T14:05:08Z" is="relative-time">2 days ago</time>\
                      </p>\
                    </li>'),
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
		  className: "repo-tab",
		  childView: repoItem,
		  childViewContainer: "ul.repo-list",
		  initialize: function(options) {
			  this.github = options.githubAPI;
			  this.collection = new Backbone.Collection;
			  var that = this;
			  var user = this.github.getUser();
			  user.repos({type:'all'}, function(err, repo) {
				  if (!err)
				    that.collection.add(repo);
		      });

		  },
          template: _.template('<div class="filter-bar">\
     <ul class="repo_filterer">\
        <li><a href="#" class="repo_filter js-repo-filter-tab" data-filter=".following">Watching</a></li>\
          <li><a href="#" class="repo_filter js-repo-filter-tab" data-filter=".starred">Starred</a></li>\
          <li><a href="#" class="repo_filter js-repo-filter-tab filter-selected" data-filter=".public">Yours</a></li>\
        <li class="all_repos"><a href="#" class="repo_filter js-repo-filter-tab" data-filter=".all">All</a></li>\
      </ul>\
\
      <form accept-charset="UTF-8" action="/search" class="repo-search" method="get" role="search"><div style="margin:0;padding:0;display:inline"><input name="utf8" value="✓" type="hidden"></div>\
        <input name="user" value="umlsynco" type="hidden">\
        <input id="your-repos-filter" name="q" class="filter_input js-filterable-field" placeholder="Find a repository…" tabindex="2" aria-label="Filter your repositories by name" type="text">\
        <input id="custom-repos-search" value="Search" class="btn">\
      </form></div>\
      <ul class="repo-list js-repo-list" data-filterable-for="your-repos-filter" data-filterable-type="substring"></ul>')

      });
});

