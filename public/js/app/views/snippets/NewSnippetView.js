define( [ 'marionette', 'text!templates/new_snippet.html'], function(Marionette, templateNewSnippet) {
	
      return Marionette.CompositeView.extend({
		  className: "issues-listing",
		  initialize: function(options) {
			  this.snippets = options.snippetsAPI;
			  this.model = new Backbone.Model({type:"new-snippet"});
			  //this.collection.add([{name:"bublik"}, {name:"bublik2"}, {name:"bublik4"}]);
		  },
          template: _.template(templateNewSnippet)

      });
});

