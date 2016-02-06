define([ 'marionette', 'text!templates/header.html'],
    function (Marionette, template) {
        //ItemView provides some default rendering logic
        return Marionette.ItemView.extend({
			tagName: 'nav',
			className: 'navbar navbar-default navbar-static-top',
            template: _.template(template),
            onRender: function() {
				this.$el.attr({role:"navigation", style:"margin-bottom: 0"});
			}
        });
    });
