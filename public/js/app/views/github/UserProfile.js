define( ['marionette', 'App', 'text!templates/user_profile.html'], function(Marionette, App, user_profile) {
      var serverAPI = null;
      // GitHub Repository item description:
      var repositoryShortItem = Marionette.ItemView.extend({
         template: _.template('<span class="css-truncate css-truncate-target">\
         <a href="/github.com/<%= getRepo() %>/<%= getType() %>/master/<%= path %>" gtype="<%= type %>" class="sp-item js-directory-link js-navigation-open" id="<%= sha %>" title="<%= getTitle() %>"><%= getTitle() %></a></span>'),
      });

      var  repoListView  = Marionette.ItemView.extend({
          className: "public source",
          tagName: "li",
          template: _.template('<a href="#" id="sp-repo-item" class="mini-repo-list-item css-truncate">\
        <svg aria-hidden="true" class="octicon octicon-repo repo-icon" height="16" role="img" version="1.1" viewBox="0 0 12 16" width="12"><path d="M4 9h-1v-1h1v1z m0-3h-1v1h1v-1z m0-2h-1v1h1v-1z m0-2h-1v1h1v-1z m8-1v12c0 0.55-0.45 1-1 1H6v2l-1.5-1.5-1.5 1.5V14H1c-0.55 0-1-0.45-1-1V1C0 0.45 0.45 0 1 0h10c0.55 0 1 0.45 1 1z m-1 10H1v2h2v-1h3v1h5V11z m0-10H2v9h9V1z"></path></svg>\
      <span class="repo-and-owner css-truncate-target">\
<span class="repo" title="node-github"><%=full_name%></span>\
      </span>\
      <span class="stars">\
        <%=stargazers_count%>\
        <svg aria-label="stars" class="octicon octicon-star" height="16" role="img" version="1.1" viewBox="0 0 14 16" width="14"><path d="M14 6l-4.9-0.64L7 1 4.9 5.36 0 6l3.6 3.26L2.67 14l4.33-2.33 4.33 2.33L10.4 9.26 14 6z"></path></svg>\
      </span>\
      <span class="repo-description css-truncate-target"><%=description%></span>\
    </a>'),
         ui : {
             "item": "a#sp-repo-item"
         },
         events: {
             "click @ui.item" : "onNavigate"
         },
         onNavigate: function(e) {
             e.preventDefault();
             App.appRouter.navigate("/github.com/" + this.model.get("full_name"), {trigger: true});

             // Save selected model
             if (this.snippet_repo_model && !this.snippet_repo_model.has("_id")) {
                 this.snippet_repo_model.save({wait:true});
             }
             
             App.vent.trigger("repo:select", {github: this.model, server: this.snippet_repo_model});
         },
         snippet_repo_model: null,
         onRender: function() {
             var that = this;
             serverAPI.getRepoModel({
                gid: this.model.get("id"), // github id
                repository: this.model.get("full_name"), // repository full name
                branch: this.model.get("default_branch") // default branch
            },
            function(err, model) {
                    if (model && model.has("count")) {
                       that.$el.find("#repo-snippets-count").append(model.get("count"));
                    }
                    that.snippet_repo_model = model;
            });
         }
      });
    
    var miniRepoList = Marionette.CompositeView.extend({
        className: "boxed-group flush",
        template: _.template('<h3>Popular repositories</h3><ul class="boxed-group-inner mini-repo-list"></ul>'),
        childView: repoListView,
        childViewContainer: "ul.mini-repo-list"
    });

      var VcardView = Marionette.ItemView.extend({
          template: _.template('<a href="<%= avatar_url%>&amp;s=400" aria-hidden="true" class="vcard-avatar d-block position-relative" itemprop="image">\
          <img alt="" class="avatar rounded-2" src="<%= avatar_url%>&amp;s=460" width="230" height="230"></a>\
       <h1 class="vcard-names my-3"><div class="vcard-fullname" itemprop="name"><%= name %></div><div class="vcard-username" itemprop="additionalName"><%=login%></div></h1>\
       <ul class="vcard-details border-top border-gray-light py-3">\
         <li class="vcard-detail py-1 css-truncate css-truncate-target" itemprop="worksFor" title="Mozilla"><svg aria-hidden="true" class="octicon octicon-organization" height="16" role="img" version="1.1" viewBox="0 0 14 16" width="14"><path d="M4.75 4.95c0.55 0.64 1.34 1.05 2.25 1.05s1.7-0.41 2.25-1.05c0.34 0.63 1 1.05 1.75 1.05 1.11 0 2-0.89 2-2s-0.89-2-2-2c-0.41 0-0.77 0.13-1.08 0.33C9.61 1 8.42 0 7 0S4.39 1 4.08 2.33c-0.31-0.2-0.67-0.33-1.08-0.33-1.11 0-2 0.89-2 2s0.89 2 2 2c0.75 0 1.41-0.42 1.75-1.05z m5.2-1.52c0.2-0.38 0.59-0.64 1.05-0.64 0.66 0 1.2 0.55 1.2 1.2s-0.55 1.2-1.2 1.2-1.17-0.53-1.19-1.17c0.06-0.19 0.11-0.39 0.14-0.59zM7 0.98c1.11 0 2.02 0.91 2.02 2.02s-0.91 2.02-2.02 2.02-2.02-0.91-2.02-2.02S5.89 0.98 7 0.98zM3 5.2c-0.66 0-1.2-0.55-1.2-1.2s0.55-1.2 1.2-1.2c0.45 0 0.84 0.27 1.05 0.64 0.03 0.2 0.08 0.41 0.14 0.59-0.02 0.64-0.53 1.17-1.19 1.17z m10 0.8H1c-0.55 0-1 0.45-1 1v3c0 0.55 0.45 1 1 1v2c0 0.55 0.45 1 1 1h1c0.55 0 1-0.45 1-1v-1h1v3c0 0.55 0.45 1 1 1h2c0.55 0 1-0.45 1-1V12h1v1c0 0.55 0.45 1 1 1h1c0.55 0 1-0.45 1-1V11c0.55 0 1-0.45 1-1V7c0-0.55-0.45-1-1-1zM3 13h-1V10H1V7h2v6z m7-2h-1V9h-1v6H6V9h-1v2h-1V7h6v4z m3-1h-1v3h-1V7h2v3z"></path></svg>Mozilla</li>\
         <li class="vcard-detail py-1 css-truncate css-truncate-target" itemprop="homeLocation" title="<%=location%>"><svg aria-hidden="true" class="octicon octicon-location" height="16" role="img" version="1.1" viewBox="0 0 12 16" width="12"><path d="M6 0C2.69 0 0 2.5 0 5.5c0 4.52 6 10.5 6 10.5s6-5.98 6-10.5C12 2.5 9.31 0 6 0z m0 14.55C4.14 12.52 1 8.44 1 5.5 1 3.02 3.25 1 6 1c1.34 0 2.61 0.48 3.56 1.36 0.92 0.86 1.44 1.97 1.44 3.14 0 2.94-3.14 7.02-5 9.05z m2-9.05c0 1.11-0.89 2-2 2s-2-0.89-2-2 0.89-2 2-2 2 0.89 2 2z"></path></svg><%=location%></li>\
         <li class="vcard-detail py-1 css-truncate css-truncate-target"><svg aria-hidden="true" class="octicon octicon-mail" height="16" role="img" version="1.1" viewBox="0 0 14 16" width="14"><path d="M0 4v8c0 0.55 0.45 1 1 1h12c0.55 0 1-0.45 1-1V4c0-0.55-0.45-1-1-1H1c-0.55 0-1 0.45-1 1z m13 0L7 9 1 4h12zM1 5.5l4 3L1 11.5V5.5z m1 6.5l3.5-3 1.5 1.5 1.5-1.5 3.5 3H2z m11-0.5L9 8.5l4-3v6z"></path></svg><a class="email" href="mailto:%69%6e%66%6f@%6d%69%6b%65%64%65%62%6f%65%72.%6e%6c"><%=email%></a></li>\
         <li class="vcard-detail py-1 css-truncate css-truncate-target" itemprop="url"><svg aria-hidden="true" class="octicon octicon-link" height="16" role="img" version="1.1" viewBox="0 0 16 16" width="16"><path d="M4 9h1v1h-1c-1.5 0-3-1.69-3-3.5s1.55-3.5 3-3.5h4c1.45 0 3 1.69 3 3.5 0 1.41-0.91 2.72-2 3.25v-1.16c0.58-0.45 1-1.27 1-2.09 0-1.28-1.02-2.5-2-2.5H4c-0.98 0-2 1.22-2 2.5s1 2.5 2 2.5z m9-3h-1v1h1c1 0 2 1.22 2 2.5s-1.02 2.5-2 2.5H9c-0.98 0-2-1.22-2-2.5 0-0.83 0.42-1.64 1-2.09v-1.16c-1.09 0.53-2 1.84-2 3.25 0 1.81 1.55 3.5 3 3.5h4c1.45 0 3-1.69 3-3.5s-1.5-3.5-3-3.5z"></path></svg><a href="<%=blog%>" class="url" rel="nofollow me"><%=blog%></a></li>\
         <li class="vcard-detail py-1 css-truncate css-truncate-target"><svg aria-hidden="true" class="octicon octicon-clock" height="16" role="img" version="1.1" viewBox="0 0 14 16" width="14"><path d="M8 8h3v2H7c-0.55 0-1-0.45-1-1V4h2v4z m-1-5.7c3.14 0 5.7 2.56 5.7 5.7S10.14 13.7 7 13.7 1.3 11.14 1.3 8s2.56-5.7 5.7-5.7m0-1.3C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7S10.86 1 7 1z"></path></svg><span class="join-label">Joined on </span><time title="19 окт. 2009 г., 12:29 GMT+4" class="join-date" datetime="2009-10-19T08:29:28Z" day="numeric" is="local-time" month="short" year="numeric"><%=created_at%></time></li>\
      </ul>\
      <div class="vcard-stats border-top border-bottom border-gray-light mb-3 py-3">\
        <a class="vcard-stat" href="/github.com/users/<%=login%>/followers">\
          <strong class="vcard-stat-count d-block"><%=followers%></strong>\
          <span class="text-muted">Followers</span>\
        </a>\
        <a class="vcard-stat" href="/github.com/users/<%=login%>/starred">\
          <strong class="vcard-stat-count d-block">?</strong>\
          <span class="text-muted">Starred</span>\
        </a>\
        <a class="vcard-stat" href="/github.com/users/<%=login%>/following">\
          <strong class="vcard-stat-count d-block"><%=following%></strong>\
          <span class="text-muted">Following</span>\
        </a>\
      </div>')
      });

      return Marionette.LayoutView.extend({
          className: "page-content container",
          childView: repositoryShortItem,
          childViewContainer: "ul.mini-repo-list",
          regions: {
             vcard: "div.vcard",
             popularRepos: "div.popular-repos>div.one-half"
          },
          initialize: function(options) {
              this.github = options.githubAPI;
              serverAPI = options.serverAPI;
          },
          onRender: function() {
              var that = this;
              var user = this.github.getUser();
              var username = this.model.get("user");
              user.show(this.model.get("user"), function(err, data) {
                  that.vcard.show(new VcardView({model: new Backbone.Model(data)}));
                  //
                  // Get list of user repositories
                  //
                  user.userRepos(username, {type: data.type}, function(err, data2) {
                     that.popularRepos.show(new miniRepoList({collection: new Backbone.Collection(data2)}));
                  });
              });

              //
              // Get user's snippets repository
              //
              
              // Get snippets repositories ?
/*              this.$el.find("a.sp-routing").click(function(e) {
                  e.stopPropagation();
                  e.preventDefault();
                  App.appRouter.navigate($(this).attr("href"), {trigger: true});
              });
*/
          },
          template: _.template(user_profile)

      });
});

