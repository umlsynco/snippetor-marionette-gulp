define( [ 'marionette'], function(Marionette) {
	
	  // GitHub Repository item description:
	
      var contentItem = Marionette.ItemView.extend({
         template: _.template('\
        <tr class="js-navigation-item">\
          <td class="icon"><%= getItemIcon() %><img alt="" class="spinner" src="https://assets-cdn.github.com/images/spinners/octocat-spinner-32.gif" width="16" height="16"></td>\
          <td class="content">\
            <span class="css-truncate css-truncate-target"><a href="<%= path %>" gtype="<%= type %>" class="js-directory-link js-navigation-open" id="<%= sha %>" title="<%= getTitle() %>"><%= getTitle() %></a></span>\
          </td>\
          <td class="message">\
            <span class="css-truncate css-truncate-target">\
                  <a href="commit_message_TBD" class="message" data-pjax="true" title="Version 0.2.25">Version 0.2.25</a>\
            </span>\
          </td>\
          <td class="age">\
            <span class="css-truncate css-truncate-target"><time title="24 дек. 2015 г., 19:11 GMT+4" datetime="2015-12-24T15:11:34Z" is="time-ago">a month ago</time></span>\
          </td>\
        </tr>'),
         templateHelpers: function(){
           return {
             getItemIcon: function(){ 
	           return (this["type"] == "blob" ?
                      '<svg aria-hidden="true" class="octicon octicon-file-text" height="16" role="img" version="1.1" viewBox="0 0 12 16" width="12"><path d="M6 5H2v-1h4v1zM2 8h7v-1H2v1z m0 2h7v-1H2v1z m0 2h7v-1H2v1z m10-7.5v9.5c0 0.55-0.45 1-1 1H1c-0.55 0-1-0.45-1-1V2c0-0.55 0.45-1 1-1h7.5l3.5 3.5z m-1 0.5L8 2H1v12h10V5z"></path></svg>'
                      : '<svg aria-hidden="true" class="octicon octicon-file-directory" height="16" role="img" version="1.1" viewBox="0 0 14 16" width="14"><path d="M13 4H7v-1c0-0.66-0.31-1-1-1H1c-0.55 0-1 0.45-1 1v10c0 0.55 0.45 1 1 1h12c0.55 0 1-0.45 1-1V5c0-0.55-0.45-1-1-1z m-7 0H1v-1h5v1z"></path></svg>');
             },
             getTitle: function(){ 
			   return (this["path"].split("/").pop());
             }
           }
         }
    });
          
      return Marionette.CompositeView.extend({
		  className: "file-wrap",
		  childView: contentItem,
		  childViewContainer: "tbody",
          template: _.template('\
               <a href="/tehmaze/diagram/tree/24c3ba0cf7b3f3abdb0e9312b440099f8ff16d3e" class="hidden js-permalink-shortcut" data-hotkey="y">Permalink</a>\
               <table class="files js-navigation-container js-active-navigation-container" data-pjax="">\
    <tbody>\
      <tr class="warning include-fragment-error">\
        <td class="icon"><svg aria-hidden="true" class="octicon octicon-alert" height="16" role="img" version="1.1" viewBox="0 0 16 16" width="16"><path d="M15.72 12.5l-6.85-11.98C8.69 0.21 8.36 0.02 8 0.02s-0.69 0.19-0.87 0.5l-6.85 11.98c-0.18 0.31-0.18 0.69 0 1C0.47 13.81 0.8 14 1.15 14h13.7c0.36 0 0.69-0.19 0.86-0.5S15.89 12.81 15.72 12.5zM9 12H7V10h2V12zM9 9H7V5h2V9z"></path></svg></td>\
        <td class="content" colspan="3">Failed to load latest commit information.</td>\
      </tr>\
    </tbody>\
  </table>')

      });
});

