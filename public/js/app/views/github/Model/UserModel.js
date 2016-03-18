define( [ 'backbone'], function(Backbone) {
        return Backbone.Model.extend({
		urlRoot: '/api/users',
		url: function() {
			return this.urlRoot + '/' + this.id;
		}
	});	
});

