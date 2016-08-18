define([
  'App',
  'backbone',
  'marionette',
  'controllers/SnippetNextPrevController',
  'views/HistoryView'
],
       function(App, Backbone, Marionette,
                SnippetNextPrevController, historyListView) {

         var serverAPI = null;

         //
         // History model item (left side history item)
         //
         var historyModel = Backbone.Model.extend({
           defaults : {branch : "master", repo : null, path : null},
           initialize : function(options) {
             this.comments = new Backbone.Collection;
           }
         });

         //
         // The major difference is default values and list of comments
         //
         var historyCollection =
             Backbone.Collection.extend({model : historyModel});

         // List of the visited sites + comments for them
         var historyList = new Backbone.Collection;

         var nextPrevController =
             new SnippetNextPrevController({historyList : historyList});

         var toolboxModel = new Backbone.Model;

         App.addInitializer(function() {
           // Add visited page to the list
           //
           App.vent.on("history:report", function(data) {
             // Add data directly
             // history list trigger on add
             // and set active model
             var active = historyList.where({"active" : true});
             if (active.length == 0) {
               historyList.add(new historyModel(data));
             } else {
               // insert right after active element
               // TODO: check that it is not the same file !!!
               historyList.add(new historyModel(data),
                               {at : historyList.indexOf(active[0]) + 1});
             }
           });

           //
           // On save comment to the history
           // Get item in focus, compare with model, add comment to the  item
           //
           App.vent.on("history:bubble", function(data) {
             toolboxModel.set({"modified": true});
             if (toolboxModel.get("owner") == "init") {
                 toolboxModel.set({"owner": "new"});
             }

             var wms = historyList.where(
                 {repo : data.repo, branch : data.branch, path : data.path});
             if (wms.length == 0) {
               alert("There is no history item which comment belong to");
               return;
             }
             if (wms[0]) {
               //
               // Make comment model, which we could save on server
               //
               var newComment = serverAPI.getCommentModel({
                 comment : data.comment,
                 linenum : data.linenum,
                 line : data.linenum,
                 path : data.path,
                 sha : data.sha,
                 repository : wms[0].get("repo_ref")
               });

               if (wms[0].comments) {
                 var hasActive = wms[0].comments.where({active : true});
                 if (hasActive.length == 0) {
                   // add to the end of comment list
                   wms[0].comments.add(newComment);
                 } else {
                   // insert right after active comment
                   var insertAt = wms[0].comments.indexOf(hasActive[0]);
                   wms[0].comments.add(newComment, {at : insertAt + 1});
                 }
               } else {
                 // MAy be this code will never be called,
                 // because comments should be setup
                 // in the history item model initializer
                 var cms = wms[0].get("comments") || [];
                 cms.push(newComment);
                 wms[0].set("comments", cms);
               }
             }
           });

           //
           // Handle item click on the left side menu
           // adaptor history:open -> page:navigate
           //
           App.vent.on("history:open", function(model) {
             // FIXME: temporary solution for the demo only
             var is_uml = (model.get("path").indexOf(".plantuml") != -1);
             App.vent.trigger("page:navigate", {
               navigate : {
                 repo : model.get("repo"),
                 branch : model.get("branch"),
                 path : model.get("path"),
                 sha : model.get("sha")
               },
               request : {
                 type : is_uml ? "uml" : "show-blob",
                 ref : model.cid,
                 repo : model.get("repo"),
                 branch : model.get("branch"),
                 path : model.get("path"),
                 sha : null
               }
             }); // page:navigate
           });
           //
           // Handle item prev or next
           //
           App.vent.on("history:navigate", function(activeModel, isPrev) {
             var idx = historyList.indexOf(activeModel);
             var model;
             if (idx < 0) {
               alert("WTF: unknown active history item");
               return;
             }

             if (isPrev) {
               if (idx == 0) {
                 alert("Attempt history item befor first one !!!");
                 return;
               }
               model = historyList.get(idx - 1);
             } else {
               if (idx >= historyList.length) {
                 alert("Stack overflow, wrong position");
                 return;
               }
               model = historyList.get(idx + 1);
             }
             // FIXME: temporary solution for the demo only
             var is_uml = (model.get("path").indexOf(".plantuml") != -1);
             App.vent.trigger("page:navigate", {
               navigate : {
                 repo : model.get("repo"),
                 branch : model.get("branch"),
                 path : model.get("path"),
                 sha : model.get("sha")
               },
               request : {
                 type : is_uml ? "uml" : "show-blob",
                 ref : model.id,
                 comment_number : selected
               }
             }); // page:navigate
           });   // history:navigate

           //
           // This event trigger on snippet open and close only
           //
           App.vent.on("snippet:new", function(snippet) {
               // @toolbox - change
               if (snippet == null) {
                 // null happen on close active snippet
                 // therefore toolbox show be recovered
                 toolboxModel.set({"owner": "init"});
               }
               else {
                 // Split owner and 3pp snippets
                 var owner = snippet.get("owner");
                 if (owner == "new") {
                    toolboxModel.set({"owner":  "new"});
                 }
                 else
                    toolboxModel.set({"owner":  owner ? "owner" : "3pp"});
               }
               toolboxModel.set({"modified": false});
           });
         });     // addInitializer

         return Backbone.Marionette.Controller.extend({
           initialize : function(options) {
             // left side history view
             this.server = options.backend;
             serverAPI = options.backend;
             this.view = new historyListView({collection : historyList, model: toolboxModel});
           },
           resetWorkingSnippet: function(snippet) {

           },
           //
           // Left side view
           //
           getView : function() { return this.view; },
           //
           // Next/Prev snippet controller
           //
           getNextPrevController : function() { return nextPrevController; },
           //
           // Get working comments for the current history item
           //
           getWorkingComments : function(model) {
             var data = model.attributes;
             // TODO: Merge all places of the snippet
             var wms = historyList.where(
                 {repo : data.repo, branch : data.branch, path : data.path});
             if (wms.length == 0)
               return null;
             if (wms[0]) {
               if (wms[0].comments) {
                 return wms[0].comments;
               }
             }
           },
           //
           // This is the right place to keep
           // opened snippet model, or request a new one
           //
           getWorkingSnippet : function() {
             return this.server.getWorkingSnippet();
           },

           //
           // Find current history item
           //
           getHistoryItem : function(model) {
             function findItem(data) {
               var wms = historyList.where(
                   {repo : data.repo, branch : data.branch, path : data.path});
               if (wms.length == 0)
                 return null;
               if (wms.length == 1)
                 return wms[0];
               // Get active item
               return wms.find(function(item) { return item.get("active"); });
             }
             return findItem(model.attributes);
           },
           //
           // [???]: history items
           //
           getHistoryList : function() { return historyList; },
           //
           // Add history item
           //
           addHistory : function(data) {
             var hm = new historyModel(data);
             historyList.add(hm);
             return hm;
           }

         }); // Controller
       });   // define
