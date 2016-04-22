define([
  'jquery',
  'backbone',
  'marionette',
  'underscore',
  'layouts/RootLayoutView'
],
       function($, Backbone, Marionette, _, RootLayoutView) {

         window.Behaviors = window.Behaviors || {};

         Marionette.Behaviors.behaviorsLookup = function() {
           return window.Behaviors;
         };
         var App = new Backbone.Marionette.Application();

         App.rootLayout = new RootLayoutView({
           regions : {
             headerRegion : "#wrapper",
             activeReposRegion : "DIV#snipettor-active-repos",
             mainRegion : "#snippetor-page-scroller"
           }
         });

         function isMobile() {
           var ua = (navigator.userAgent || navigator.vendor || window.opera,
                     window, window.document);
           return (/iPhone|iPod|iPad|Android|BlackBerry|Opera Mini|IEMobile/)
               .test(ua);
         }

         App.static = {};

         App.static.mobile = isMobile();

         App.on('start', function(options) {
           if (Backbone.history)
             Backbone.history.start({pushState : true});
         });

         return App;
       });
