define( [ 'App', 'marionette', 'models/Model'],
    function( App, Marionette, Model, template) {
        //ItemView provides some default rendering logic
        return Marionette.ItemView.extend( {
            className: "paginate-container",
            template: _.template('\
    <div class="pagination" data-pjax="true">\
        <span class="previous_page disabled">Previous</span>\
        <em class="current">1</em>\
        <a rel="next" href="/umlsynco/umlsync-framework/search?p=2&amp;q=border&amp;utf8=%E2%9C%93">2</a>\
        <a href="/umlsynco/umlsync-framework/search?p=3&amp;q=border&amp;utf8=%E2%9C%93">3</a>\
        <a href="/umlsynco/umlsync-framework/search?p=4&amp;q=border&amp;utf8=%E2%9C%93">4</a>\
        <a href="/umlsynco/umlsync-framework/search?p=5&amp;q=border&amp;utf8=%E2%9C%93">5</a>\
        <a href="/umlsynco/umlsync-framework/search?p=6&amp;q=border&amp;utf8=%E2%9C%93">6</a>\
        <a href="/umlsynco/umlsync-framework/search?p=7&amp;q=border&amp;utf8=%E2%9C%93">7</a>\
        <a class="next_page" rel="next" href="/umlsynco/umlsync-framework/search?p=2&amp;q=border&amp;utf8=%E2%9C%93">Next</a>\
    </div>'),
 modelEvents: {
    "change": "modelChanged"
  },
  modelChanged: function() {
      var limit = this.model.get("limit"),
      page = this.model.get("page"),
      total = this.model.get("total");
      // 1. If page == 0 then disable prev navigation
      if (page ==0) {
      }
      // 2. if total/limit < 7 then hide some items
      // 3. if it is final page then disable next
      // 4. Hilight current position
  }
        });
    });
