define([ 'marionette', 'text!templates/header.html', 'behaviours/navigation'],
    function (Marionette, template, navBehav) {
        //ItemView provides some default rendering logic
        return Marionette.LayoutView.extend({
			tagName: 'nav',
			className: 'navbar navbar-default navbar-static-top',
            template: _.template(template),
            onRender: function() {
                var that = this;
                this.options.githubAPI.getUser().then(function(data) {
                    that.$el.find("a.sp-default-user-name").attr("href", "/github.com/" + data.login);
                });
				this.$el.attr({role:"navigation", style:"margin-bottom: 0"});
                this.options.githubAPI.getUser().then(function(userModel) {
                });
			},
			regions: {
				historyRegion: "ul#sp-history"
			},
            behaviors: {
               PreventNavigation: {
               }
            }
        });
    });
