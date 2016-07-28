define( [ 'App', 'marionette', 'models/Model'],
    function( App, Marionette, Model, template) {
        //ItemView provides some default rendering logic
        return Marionette.ItemView.extend( {
            className: "paginate-container",
            template: _.template('\
    <div class="pagination" data-pjax="true">\
        <span class="previous_page disabled">Previous</span>\
        <span class="next_page disabled">Next</span>\
    </div>'),
 modelEvents: {
    "change": "modelChanged"
  },
  ui: {
      "previous": "div.pagination>span.previous_page",
      "next": "div.pagination>span.next_page"
  },
  events: {
      "click @ui.previous": 'onPrev',
      "click @ui.next": 'onNext'
  },
  onPrev: function(e) {
      e.preventDefault();
      if (this.disabled)
        return;
      var $el = this.$el.find("a.current");
      var page = parseInt($el.text());
      if (page > 1) {
        var $aa = $(this.$el.find("a")[page-2]);
        $aa.trigger("click");
      }
  },
  onNext: function(e) {
      e.preventDefault();
      if (this.disabled)
        return;
      var $el = this.$el.find("a.current");
      var page = parseInt($el.text());
      var $els = this.$el.find("a");
      // Prevent array out of bounds
      if ($els.length > page) {
        var $aa = $($els[page]);
        $aa.trigger("click");
      }
  },
  initialize: function(options) {
      this.model.set({url: "/github.com/search"});
      this.current_page = 1;
      if (this.model.get("total") > 0) {
        this.disabled = false;
      }
  },
  current_page: 0,
  disabled: true,
  onPageSelect: function(e) {
      e.preventDefault();
      if (this.disabled)
        return;

      var $el = $(e.target);
      var page = parseInt($el.text());
      if (this.current_page == page)
        return;
      
      if (page) {
        this.current_page = page;
        this.model.set({page: parseInt(page)});
        // Toggle class current
        $el.parent().children("a.current").removeClass("current");
        $el.addClass("current");
      }

  },
  onRender: function() {
      this.$el.find("div.pagination>a").addClass("disabled");
  },
  // 1. Hide/show previous
  // 2. if total/limit < 7 then hide some items
  // 3. if it is final page then disable next
  // 4. Hilight current position
  modelChanged: function(model) {
      var init_bubbles = model.changed.limit && model.changed.total;

      var limit = this.model.get("limit"),
      page = this.model.get("page"),
      total = this.model.get("total");

      // 1. If page == 0 then disable prev navigation
      if (page == 1)
          this.ui.previous.addClass("disabled");
      else
          this.ui.previous.removeClass("disabled");

      var x = total/limit;
      if (x > 0) {
          this.disabled = false;
      }
      var url = this.model.get("url");
      // hide pagination ???
      if (init_bubbles) {
        for (var t=1; t <=x+1; ++t) {
          if (t == page) {
            this.$el.find("span.next_page").before('<a rel="current" class="current active" href="'+url+'&page='+t+'">'+t+'</a>');
          }
          else if (t == page+1) {
            this.$el.find("span.next_page").before('<a rel="next" class="next" href="'+url+'&page='+t+'">'+t+'</a>');
          }
          else
            this.$el.find("span.next_page").before('<a href="'+url+'&page='+t+'">'+t+'</a>');
        }

        this.$el.find("a").click(_.bind(this.onPageSelect, this));
      }// init bubbles
      
      if (page >= x)
          this.ui.next.addClass("disabled");
      else 
          this.ui.next.removeClass("disabled");
  }
        });
    });
