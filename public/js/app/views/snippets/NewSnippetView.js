define( [ 'marionette', 'base-64', 'App', 'text!templates/new_snippet.html'], function(Marionette, base64, App, templateNewSnippet) {
      return Marionette.ItemView.extend({
		  className: "issues-listing",
          ui: {
              save: "button.sp-submit-all",
              title: "input#issue_title",
              hashtags: "#issue_hashtag",
              description: "#issue_body"

          },
          events: {
              "click @ui.save": "onSave"
          },
          onSave: function(e) {
              e.preventDefault();
              
              App.vent.trigger("snippet:save", this.model,
                {title:this.ui.title.val(), hashtags: this.ui.hashtags.val(), description: this.ui.description.val()},
                // On Complete Callback
                function(error, data) {
                  if (!error) {
                      App.appRouter.navigate("/github.com/snippets", {trigger:true});
                  }
                  else {
                     // Keep state and try again
                     alert("FAILED: " + error);
                  }
              });
          },
		  initialize: function(options) {
			  this.snippetor = options.snippetorAPI;
              this.server = options.serverAPI;

              this.all_items = this.snippetor.getNextPrevController();
              var that = this;
              this.all_items.collection.on("add remove", function(model, action) {
                that.$el.find("button.sp-submit-all").prop("disabled", model.collection.length == 0);
              });

              // return opened snippet reference or create an new model
			  this.model = this.server.getWorkingSnippet();
		  },
          onRender: function() {
              this.$el.find("button.sp-submit-all").prop("disabled", this.all_items.collection.length == 0);
              if (this.model.get("tags"))
              this.$el.find("input#issue_hashtag").attr("value", this.model.get("tags"));
              if (this.model.get("name"))
              this.$el.find("input#issue_title").attr("value", this.model.get("name"));
              if (this.model.get("description"))
              this.$el.find("textarea#issue_body").text(this.model.get("description"));
          },
          template: function() {
              return _.template(templateNewSnippet);
          }

      });
});

