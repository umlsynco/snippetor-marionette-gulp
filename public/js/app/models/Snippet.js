define(["jquery", "backbone"],
    function ($, Backbone) {
        // Creates a new Backbone Model class object
        var Model = Backbone.Model.extend({
            urlRoot : '/api/snippets',
            initialize:function () {

            },

            // Default values for all of the Model attributes
            defaults:{
               "data_provider": "github",
               "repositories" : [], // List of affected reopositories
               "comments": [] // List of comments
            },

            // Get's called automatically by Backbone when the set and/or save methods are called (Add your own logic)
            validate: function (attrs) {

            }
        });

        var Collection = Backbone.Collection.extend({
            model: Model,
            url: '/api/snippets'
        });

        return Collection;
    }
);
