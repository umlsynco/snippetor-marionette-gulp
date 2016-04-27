define(['marionette', 'App'], function(Marionette, App) {
   window.Behaviors.PreventSubmission = Backbone.Marionette.Behavior.extend({
            onRender:function(){
                this.$el.find("form.sp-submission").submit(function(event) {
                    event.preventDefault();
                    var reference = $(this).attr("action");
                    if (reference) {
                        var redirect = reference + "?" + $(this).serialize();
                        App.appRouter.navigate(redirect, {trigger : true});
                    }
                });
            }
   });
   return window.Behaviors.PreventSubmission;
});
