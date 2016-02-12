require.config({
    baseUrl:"/js/app/",
    // 3rd party script alias names (Easier to type "jquery" than "../libs/jquery/dist/jquery.min, etc")
    // probably a good idea to keep version numbers in the file names for updates checking
    paths:{
        // Core Libraries
        "jquery":"../libs/jquery/dist/jquery",
        "underscore":"../libs/lodash/lodash",
        "backbone":"../libs/backbone/backbone",
        "marionette":"../libs/marionette/lib/core/backbone.marionette",

        // Plugins
        "backbone.validateAll":"../libs/Backbone.validateAll/src/javascripts/Backbone.validateAll",
        "text":"../libs/text/text",
        "backbone.wreqr" : "../libs/backbone.wreqr/lib/backbone.wreqr",
        "backbone.eventbinder" : "../libs/backbone.eventbinder/lib/amd/backbone.eventbinder",
        "backbone.babysitter" : "../libs/backbone.babysitter/lib/backbone.babysitter",
        "es6-promise": "../libs/es6-promise/promise",
        "utf8": "../libs/utf8/utf8",
        "base-64" : "../libs/base64/base64",
        
        axios: "../libs/axios/dist/axios",
//    "backbone.marionette": "../libs/backbone.marionette/lib/core/backbone.marionette",
        bootstrap: "../libs/bootstrap/dist/js/bootstrap",
//    datatables: "../libs/datatables/media/js/jquery.dataTables",
//  "datatables-responsive": "../libs/datatables-responsive/js/dataTables.responsive",
//    flot: "../libs/flot/jquery.flot",
//    "flot.tooltip": "../libs/flot.tooltip/js/jquery.flot.tooltip",
        "font-awesome": "../libs/font-awesome/fonts/*",
        "github-api": "../libs/github-api/src/github",
//    holderjs: "../libs/holderjs/holder",
        metisMenu: "../libs/metisMenu/dist/metisMenu",
        morrisjs: "../libs/morrisjs/morris",
        requirejs: "../libs/requirejs/require"

    },
    // Sets the configuration for your third party scripts that are not AMD compatible
    shim:{
        "jquery" : {
            exports : "jQuery"
        },
        "underscore": {
            exports: "_"
        },
        "bootstrap": {
           "deps" : ["jquery"]
        },
        "backbone":{
            "deps":["jquery", "underscore"],
            // Exports the global window.Backbone object
            "exports":"Backbone"
        },
        "github-api": {
            "deps":["backbone", "es6-promise"],
            "exports": "Github"
        },
        // Backbone.validateAll plugin (https://github.com/gfranko/Backbone.validateAll)
        "backbone.validateAll":["backbone"],
        "bootstrap-social": {
            deps: [
              "bootstrap",
              "font-awesome"
            ]
        },
        "datatables-responsive": {
            deps: [
              "datatables"
            ]
        },
        metisMenu: {
            deps: [
              "bootstrap"
            ]
        }
    }
});

// Includes Desktop Specific JavaScript files here (or inside of your Desktop router)
require(["jquery","App", "routers/AppRouter", "controllers/Controller"],
    function ($, App, AppRouter, Controller) {

    $(function() {
        App.appRouter = new AppRouter({
            controller:new Controller()
        });

        App.start();
    });

    $(function() {

//    $('#side-menu').metisMenu();

    });

//Loads the correct sidebar on window load,
//collapses the sidebar on window resize.
// Sets the min-height of #page-wrapper to window size
$(function() {
    $(window).bind("load resize", function() {
        topOffset = 50;
        width = (this.window.innerWidth > 0) ? this.window.innerWidth : this.screen.width;
        if (width < 768) {
            $('div.navbar-collapse').addClass('collapse');
            topOffset = 100; // 2-row-menu
        } else {
            $('div.navbar-collapse').removeClass('collapse');
        }

        height = ((this.window.innerHeight > 0) ? this.window.innerHeight : this.screen.height) - 1;
        height = height - topOffset;
        if (height < 1) height = 1;
        if (height > topOffset) {
            $("#page-wrapper").css("min-height", (height) + "px");
        }
    });

    var url = window.location;
    var element = $('ul.nav a').filter(function() {
        return this.href == url || url.href.indexOf(this.href) == 0;
    }).addClass('active').parent().parent().addClass('in').parent();
    if (element.is('li')) {
        element.addClass('active');
    }
});

});
