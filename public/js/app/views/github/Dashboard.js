define(
    [ 'marionette', 'App', 'utils/DateToString'],
    function(Marionette, App, DateToString) {
      var serverAPI = null;
      
      var snippetActionView = Marionette.ItemView.extend({
        template : _.template('<div class="alert watch_started simple"><div class="body">\
<div class="simple">\
  <%= getActionIcon() %>\
  <div class="title">\
    <a href="/github.com/<%= getUserName() %>"><%= getUserName() %></a> <%= getAction() %> snippet: <a href="/github.com/snippets/<%= getSnippetId() %>" > <%= getSnippetTitle() %></a>\
  </div>\
  <div class="time">\
    <relative-time title="3 июня 2016 г., 14:17 GMT+4" datetime="<%= createdAt %>"><%= getRelativeTime() %></relative-time>\
  </div>\
</div>\
</div></div>'),
         templateHelpers: function(){
           return {
             getActionIcon: function() {
               var action = this["action"];
               if (action == "create-snippet") return '<i class="fa fa-cogs" aria-hidden="true"></i>'; // "remove-snippet", "update-snippet", "fork-snippet",
               if (action == "remove-snippet") return '<i class="fa fa-trash" aria-hidden="true"></i>';
               if (action == "update-snippet") return '<i class="fa fa-cog" aria-hidden="true"></i>';
               if (action == "fork-snippet") return '<i class="fa fa-code-fork" aria-hidden="true"></i>';
               if (action == "start-snippet") return '<i class="fa fa-star" aria-hidden="true"></i>';
               if (action == "unstart-snippet") return '<i class="fa fa-star-o" aria-hidden="true"></i>';
               if (action == "follow-snippet") return '<i class="fa fa-eye" aria-hidden="true"></i>';
               if (action == "unfollow-snippet") return '<i class="fa fa-eye-slash" aria-hidden="true"></i>';
               return '';
               
             },
             getRelativeTime: function() {
                 return DateToString(this["createdAt"]);
             },
             getUserName: function(){ 
               return this["user"] ? this["user"]["username"] : 'UNKNOWN';
             },
             getAction: function(){ 
               var action = this["action"];
               if (action == "create-snippet") return " created "; // "remove-snippet", "update-snippet", "fork-snippet",
               if (action == "remove-snippet") return " removed ";
               if (action == "update-snippet") return " updated ";
               if (action == "fork-snippet") return " forked ";
               if (action == "start-snippet") return " starred ";
               if (action == "unstart-snippet") return " un-starred ";
               if (action == "follow-snippet") return " followed ";
               if (action == "unfollow-snippet") return " un-followed ";
               return " did somthing with ";
             },
             getSnippetId: function() {
				return  (this["snippet"] != null ? this["snippet"]["_id"] : '');
			 },
             getSnippetTitle: function() {
                 return  (this["snippet"] != null ? this["snippet"]["name"] : '% TITLE %');
             }
         };
        } // template helper
      }); // snippet action

      // Repository actions
      var repoActionView = Marionette.ItemView.extend({
        template : _.template('<div class="alert watch_started simple"><div class="body">\
<div class="simple">\
  <%= getActionIcon() %>\
  <div class="title">\
    <a href="/github.com/<%= getUserName()  %>"><%= getUserName() %></a> <%= getAction() %>  repository <a href="/github.com/<%= getRepoName() %>" ><%= getRepoName() %></a>\
  </div>\
  <div class="time">\
    <relative-time title="3 июня 2016 г., 14:17 GMT+4" datetime="<%= createdAt %>"><%= getRelativeTime() %></relative-time>\
  </div>\
</div>\
</div></div>'),

         templateHelpers: function(){
           return {
             getActionIcon: function() {
               var action = this["action"];
               if (action == "follow-repo") return '<i class="fa fa-eye" aria-hidden="true"></i>'; // "remove-snippet", "update-snippet", "fork-snippet",
               if (action == "unfollow-repo") return '<i class="fa fa-eye-slash" aria-hidden="true"></i>';
               return '';
             },
             getRelativeTime: function() {
                 return DateToString(this["createdAt"]);
             },
             getUserName: function(){ 
               return this["user"] ? this["user"]["username"] : 'UNKNOWN';
             },
             getRepoName: function(){ 
               return this["repository"] ? this["repository"]["repository"] : 'UNKNOWN';
             },
             getAction: function(){
                 return (this["action"] == "follow-repo" ? "followed" : "unfollowed");
             }
             };
         } // helpers
      }); // repository

      // User follow action
      var userActionView = Marionette.ItemView.extend({
        template : _.template('<div class="alert watch_started simple"><div class="body">\
<div class="simple">\
  <%= getActionIcon() %>\
  <div class="title">\
    <a href="/github.com/<%= getUserName()  %>"><%= getUserName() %></a> <%= getAction() %>  user: <a href="/github.com/<%= getFollowUser() %>" ><%= getFollowUser() %></a>\
  </div>\
  <div class="time">\
    <relative-time title="3 июня 2016 г., 14:17 GMT+4" datetime="<%= createdAt %>"><%= getRelativeTime() %></relative-time>\
  </div>\
</div>\
</div></div>'),
         templateHelpers: function(){
           return {
             getActionIcon: function() {
               var action = this["action"];
               if (action == "follow-user") return '<i class="fa fa-eye" aria-hidden="true"></i>'; // "remove-snippet", "update-snippet", "fork-snippet",
               if (action == "unfollow-user") return '<i class="fa fa-eye-slash" aria-hidden="true"></i>';
               return '';
             },
             getRelativeTime: function() {
                 return DateToString(this["createdAt"]);
             },
             getUserName: function(){ 
               return this["user"] ? this["user"]["username"] : 'UNKNOWN';
             },
             getFollowUser: function(){ 
               return this["mixed"] ? this["mixed"] : 'UNKNOWN';
             },
             getAction: function(){
                 return (this["action"] == "follow-user" ? "followed" : "unfollowed");
             }
             };
         } // helpers
      }); // repository

      var starSnippetView = Marionette.ItemView.extend({
        template : _.template('<div class="alert fork simple"><div class="body">\
<div class="simple">\
  <svg aria-label="Fork" class="octicon octicon-git-branch dashboard-event-icon" height="16" role="img" version="1.1" viewBox="0 0 10 16" width="10"><path d="M10 5c0-1.11-.89-2-2-2a1.993 1.993 0 0 0-1 3.72v.3c-.02.52-.23.98-.63 1.38-.4.4-.86.61-1.38.63-.83.02-1.48.16-2 .45V4.72a1.993 1.993 0 0 0-1-3.72C.88 1 0 1.89 0 3a2 2 0 0 0 1 1.72v6.56c-.59.35-1 .99-1 1.72 0 1.11.89 2 2 2 1.11 0 2-.89 2-2 0-.53-.2-1-.53-1.36.09-.06.48-.41.59-.47.25-.11.56-.17.94-.17 1.05-.05 1.95-.45 2.75-1.25S8.95 7.77 9 6.73h-.02C9.59 6.37 10 5.73 10 5zM2 1.8c.66 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2C1.35 4.2.8 3.65.8 3c0-.65.55-1.2 1.2-1.2zm0 12.41c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zm6-8c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2z"></path></svg>\
  <div class="title">\
    <a href="/rprichard" data-ga-click="News feed, event click, Event click type:ForkEvent target:actor">rprichard</a> forked <a href="/JetBrains/intellij-community" data-ga-click="News feed, event click, Event click type:ForkEvent target:repo">JetBrains/intellij-community</a> to <a href="/rprichard/intellij-community" data-ga-click="News feed, event click, Event click type:ForkEvent target:parent" title="rprichard/intellij-community">rprichard/intellij-community</a>\
  </div>\
  <div class="time">\
    <relative-time title="2 июня 2016 г., 10:08 GMT+4" datetime="2016-06-02T06:08:51Z">7 days ago</relative-time>\
  </div>\
</div>\
</div></div>')
  }); // Fork

      return Marionette.CompositeView.extend({
        className : "page-content container news column two-thirds",
        template: _.template("<div class='sp-dashboard'></div><p><a class='sp-dashboard-load-more btn btn-default btn-large' style='width:100%;'>More &raquo;</a></p>"),
        childViewContainer: "div.sp-dashboard",
        events: {
          "click a.sp-dashboard-load-more": 'loadMore'
        },
        page: 0,
        initialize : function(options) {
          serverAPI = options.serverAPI;
          this.collection = serverAPI.getDashboard(options.user);
        },
        loadMore: function() {
          this.page++;
          this.collection.fetch({data: {page: this.page}, add: true, remove: false});
        },
        getChildView: function(model) {
/* See mongoose database for the actual list of actions
 * ["create-snippet", "remove-snippet", "update-snippet", "fork-snippet",
                   "star-snippet", "unstar-snippet",
                   "follow-snippet", "unfollow-snippet",
                   "follow-user", "unfollow-user",
                   "follow-repo", "unfollow-repo"],*/
          if (model.get("action").indexOf("snippet") > -1) {
            return snippetActionView;
          }
          else if (model.get("action").indexOf("repo") > -1) {
            return repoActionView;
          }
          else if (model.get("action").indexOf("user") > -1) {
            return userActionView;
          }
          return starSnippetView;
        } // getChildView
      });
    });
