define(['App', 'backbone', 'marionette'],
    function (App, Backbone, Marionette) {

    return Backbone.Marionette.Controller.extend({
        initialize:function (options) {
           this.historyList = options.historyList;
           // next-prev items
           this.collection = new Backbone.Collection;

           options.historyList.bind("add remove", this.handleHistoryItem, this);
        },
        handleHistoryItem: function(historyItem, collection, action) {
            if (!historyItem.comments) {
                $.log("Something wrong with context of NextPrevController::addHistoryItem");
                return;
            }
            if (action.add) {
			  historyItem.comments.on("add remove", _.bind(this.handleCommentItem, this, historyItem));
            }
            if (action.remove) {
			  historyItem.comments.off("add remove", this.handleCommentItem, this, historyItem);
              // remove comments in scope
              var comments = this.collection.where({hcid: historyItem.cid});
              if (comments.length > 0)
                this.collection.remove(comments);
            }
        },
        handleCommentItem: function(historyItem, commentItem, idx, action) {
            if (action.add) {
              this.collection.add({hcid: historyItem.cid, ccid: commentItem.cid});
            }
            if (action.remove) {
              var toRemove = this.collection.where({hcid: historyItem.cid, ccid: commentItem.cid});
              this.collection.remove(toRemove);
            }
        },
        hasPrevNext: function(historyItem, commentItem) {
            var item = this.collection.where({hcid: historyItem.cid, ccid: commentItem.cid});
            if (item.length != 1) {
                var idx = this.collection.indexOf(item[0]);
                return {hasNext:(idx != this.collection.length), hasPrev: (idx > 0)};
            }
            return {hasNext:false, hasPrev: false};
        }
    });
});
