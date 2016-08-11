define(['marionette', 'App'], function(Marionette, App) {
    window.Behaviors.PreventNavigation = Backbone.Marionette.Behavior.extend({
        onRender: function() {
            this.$el.find(".sp-navigation").click(function(event) {
                event.preventDefault();
                var reference = $(this).attr("href");
                if (reference) {
                    App.appRouter.navigate(reference, {
                        trigger: true
                    });
                }
            });
        }
    });
    return window.Behaviors.PreventNavigation;
});
