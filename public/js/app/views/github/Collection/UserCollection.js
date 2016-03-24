define( [ 'backbone', 'views/github/Model/UserModel'], function(Backbone, userModel) {
        return Backbone.Collection.extend({
		urlRoot: '/api/users',
		url: function() {
			return this.urlRoot + '/' + this.id;
		}
	});	
});

