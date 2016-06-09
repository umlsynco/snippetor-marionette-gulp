define(
    [ 'marionette', 'App'],
    function(Marionette, App) {
      var serverAPI = null;

      var watchView = Marionette.ItemView.extend({
        template : _.template('<div class="alert watch_started simple"><div class="body">\
<div class="simple">\
  <svg aria-label="Watch" class="octicon octicon-star dashboard-event-icon" height="16" role="img" version="1.1" viewBox="0 0 14 16" width="14"><path d="M14 6l-4.9-.64L7 1 4.9 5.36 0 6l3.6 3.26L2.67 14 7 11.67 11.33 14l-.93-4.74z"></path></svg>\
  <div class="title">\
    <a href="/kalaidin" data-ga-click="News feed, event click, Event click type:WatchEvent target:actor">kalaidin</a> starred <a href="/aymericdamien/TensorFlow-Examples" data-ga-click="News feed, event click, Event click type:WatchEvent target:repo">aymericdamien/TensorFlow-Examples</a>\
  </div>\
  <div class="time">\
    <relative-time title="3 июня 2016 г., 14:17 GMT+4" datetime="2016-06-03T10:17:19Z">6 days ago</relative-time>\
  </div>\
</div>\
</div></div>'),
      }); // Watch

      // star snippet item
      var starSnippetView = Marionette.ItemView.extend({
        template : _.template('<div class="alert watch_started simple"><div class="body">\
<div class="simple">\
  <svg aria-label="Watch" class="octicon octicon-star dashboard-event-icon" height="16" role="img" version="1.1" viewBox="0 0 14 16" width="14"><path d="M14 6l-4.9-.64L7 1 4.9 5.36 0 6l3.6 3.26L2.67 14 7 11.67 11.33 14l-.93-4.74z"></path></svg>\
  <div class="title">\
    <a href="/kalaidin" data-ga-click="News feed, event click, Event click type:WatchEvent target:actor">kalaidin</a> starred <a href="/aymericdamien/TensorFlow-Examples" data-ga-click="News feed, event click, Event click type:WatchEvent target:repo">aymericdamien/TensorFlow-Examples</a>\
  </div>\
  <div class="time">\
    <relative-time title="3 июня 2016 г., 14:17 GMT+4" datetime="2016-06-03T10:17:19Z">6 days ago</relative-time>\
  </div>\
</div>\
</div></div>'),
      }); // Star

      var forkSnippetView = Marionette.ItemView.extend({
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

      return Marionette.CollectionView.extend({
        className : "page-content container news column two-thirds",
        childView : watchView,
        initialize : function(options) {
          this.github = options.githubAPI;
          serverAPI = options.serverAPI;
          this.collection = new Backbone.Collection();
          this.collection.add(new Backbone.Model);
          this.collection.add(new Backbone.Model);
          this.collection.add(new Backbone.Model);
          this.collection.add(new Backbone.Model);
        }
      });
    });
