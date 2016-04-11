define([ 'App', 'backbone', 'marionette' ], function(App, Backbone,
                                                     Marionette) {

  return Backbone.Marionette.Controller.extend({
    initialize : function(options) {
      this.historyList = options.historyList;
      // next-prev items
      this.collection = new Backbone.Collection;

      options.historyList.bind("add remove", this.handleHistoryItem, this);
      options.historyList.bind("reset", this.handleHistoryReset, this);
    },
    handleHistoryReset : function() { this.collection.reset(); },
    handleHistoryItem : function(historyItem, collection, action) {
      if (!historyItem.comments) {
        alert(
            "Something wrong with context of NextPrevController::addHistoryItem");
        return;
      }
      if (action.add) {
        // placeholder ????
        historyItem.comments.on(
            "add", _.bind(this.handleAddCommentItem, this, historyItem));
        historyItem.comments.on(
            "remove", _.bind(this.handleRemoveCommentItem, this, historyItem));
      }
      if (action.remove) {
        historyItem.comments.off("add remove", this.handleCommentItem, this,
                                 historyItem);
        // remove comments in scope
        var comments = this.collection.where({hcid : historyItem.cid});
        if (comments.length > 0)
          this.collection.remove(comments);
      }
    },
    handleAddCommentItem : function(historyItem, commentItem, idx, action) {
      if (action.add) {
        var hms = this.collection.where({hcid : historyItem.cid});
        var pos = hms.length - 1;
        if (action.at) {
          if (hms.length <= action.at) {
            alert("Something wrong with data insertion!!!");
            return;
          }
          pos = action.at;
        }
        this.collection.add({hcid : historyItem.cid, ccid : commentItem.cid},
                            {at : this.collection.indexOf(hms[pos]) + 1});
      }
    },
    handleRemoveCommentItem : function(historyItem, commentItem, idx, action) {
      var toRemove = this.collection.where({ccid : commentItem.cid});
      this.collection.remove(toRemove[0]);
    },
    hasPrevNext : function(historyItem, commentItem) {
      var item = this.collection.where(
          {hcid : historyItem.cid, ccid : commentItem.cid});
      if (item.length == 1) {
        var idx = this.collection.indexOf(item[0]);
        return {
          hasNext : (idx < this.collection.length - 1),
          hasPrev : (idx > 0)
        };
      }
      return {
        hasNext : false,
        hasPrev : false
      };
    },
    stepNext : function(historyItem, commentItem) {
      var item = this.collection.where(
          {hcid : historyItem.cid, ccid : commentItem.cid});
      if (item.length == 1) {
        var idx = this.collection.indexOf(item[0]);
        if (idx >= this.collection.length - 1) {
          alert("it is final element !!!");
          return;
        }
        var nextOne = this.collection.at(idx + 1);
        var nextHistoryItem =
            historyItem.collection.get({cid : nextOne.get("hcid")});
        if (nextHistoryItem != historyItem) {
          nextHistoryItem.set("active", true);
        }
        var nextComment =
            nextHistoryItem.comments.get({cid : nextOne.get("ccid")});
        nextComment.set("active", true);
      }
    },
    stepPrev : function(historyItem, commentItem) {
      var item = this.collection.where(
          {hcid : historyItem.cid, ccid : commentItem.cid});
      if (item.length == 1) {
        var idx = this.collection.indexOf(item[0]);
        if (idx == 0) {
          alert("it is final element !!!");
          return;
        }
        var nextOne = this.collection.at(idx - 1);
        var nextHistoryItem =
            historyItem.collection.get({cid : nextOne.get("hcid")});
        if (nextHistoryItem != historyItem) {
          nextHistoryItem.set("active", true);
        }
        var nextComment =
            nextHistoryItem.comments.get({cid : nextOne.get("ccid")});
        nextComment.set("active", true);
      }
    }
  });
});
