define(['marionette', 'hljs', 'App', 'behaviours/submission'], function(Marionette, hljs, App, PreventSubmission) {

    var cachedGithub = null,
        searchData = "";

    // GitHub content-file preview:
    var ContentView = Marionette.ItemView.extend({
        tagName: "pre",
        className: "prettyprint linenums:1",
        template: _.template('<code class="html"><%= getContent() %></code>'),
        templateHelpers: function() {
            var content = this.options.content;
            return {
                getContent: function() {
                    if (!content) return;
                    // FIXME: why JSON based content is comming as JSON
                    //        while string is expected
                    if (!(typeof content === "string"))
                      content = JSON.stringify(content);

                    var res = content.replace(/\</g, "&lt;");
                    res = res.replace(/\>/g, "&gt;");
                    var datar = res.split("\n");
                    var resdata = "";
                    var counter = 0;
                    $.each(datar, function(idx, line) {
                        if (line.indexOf(searchData) > -1 && (counter < 3)) {
                            var fff = datar[idx].replace(searchData, "<b style='color:black;'>" + searchData + "</b>");
                            resdata += datar[idx - 3] + "\n" + datar[idx - 2] + "\n" + datar[idx - 1] + "\n" + fff + "\n" + datar[idx + 1] + "\n" + "..." + "\n";
                            ++counter;
                        }
                    }); // $.each
                    return resdata;
                }
            };
        },
        ui: {
            code: "code.html"
        },
        onRender: function() {
            prettyPrint();
        }
    });

    // show content
    var codeSearchItem = Marionette.LayoutView.extend({
        template: _.template('\
<div class="code-list-item code-list-item-public repo-specific">\
  <span class="language"><%= getLanguage() %></span>\
  <p class="title">\
      <a  class="sp-github-blob-id" sha="<%= sha %>" repo="<%= full_name() %>" href="/github.com/<%= full_name() %>/blob/master/<%= path %>"><%= path %></a> <br>\
      <span class="text-small text-muted match-count">Showing the top three matches.</span>\
      <span class="text-small text-muted updated-at">Last indexed <time title="11 окт. 2015 г., 13:12 GMT+4" datetime="2015-10-11T09:12:25Z" is="relative-time">on 11 Oct 2015</time>.</span>\
  </p>\
  <div class="file-box blob-wrapper" id="<%= sha %>" repo="<%= full_name() %>"></div>\
</div>'),
        templateHelpers: function() {
            return {
                sha: this.model.get("sha"),
                full_name: function() {
                    return this["repository"].full_name;
                },
                getLanguage: function() {
                    return (this["language"] != null ? this["language"] : '');
                }
            }
        },
        regions: {
            "content": "DIV.file-box"
        },
        onRender: function(options) {
            // Request code
            var repo = cachedGithub.getAPI().getRepo(this.model.get("repository").full_name);
            var that = this;
            repo.getBlob(this.model.get("sha"), function(err, data) {
                if (data)
                    that.content.show(new ContentView({
                        content: data
                    }));
            });
            this.$el.find("a.sp-github-blob-id").click(function(e) {
                e.stopPropagation();
                e.preventDefault();
                App.appRouter.navigate($(this).attr("href"), {
                    trigger: true
                });
            });
        }
    });

    return Marionette.CompositeView.extend({
        className: "repo-tab",
        childView: codeSearchItem,
        childViewContainer: "DIV.code-list",
        ui: {
            total_count: "span#total_count"
        },
        events: {
            "click .sp-tag-bubble": "removeTagBubble",
            "click button.btn": "searchNewScope",
            "keyup input#sp-code-search-input": "handleInputKey"

        },
        modelEvents: {
          "change": "onModelDataChange"
        },
        onModelDataChange: function(model) {
          if (!this.$el)
            return;

          var that = this;
          ["ext", "file", "path"].map(function(item) {
            if (model.changed[item]) {
              console.log("CHANGED: " + model.changed[item]);
              that.$el.find("div.bootstrap-tagsinput>span[data-model='"+item+"']").empty();
              var $spans = that.$el.find("div.bootstrap-tagsinput>span");
              $($spans[$spans.length-1])
              .after('<span class="tag label label-info" data-model="'+item+'">'+item
                 +'  :  ' + model.changed[item] + '<span class="sp-tag-bubble" data-role="remove"></span></span>');
              // limit
              that.$el.find("div.bootstrap-tagsinput>input.sp-code-search-path[name='"+item+"']")
              .val(model.changed[item]).prop("disabled", false);

            }
          });
        },
        handleInputKey: function(event) {
            if (event.which == 32 || event.which == 32) {
              var $el = this.$el.find("#sp-code-search-input")
              var req = $el.val();
              console.log(req);
              var that = this;
              [" file:", " path:", " ext:"].map(function(item) {
                var pos = req.indexOf(item);
                if (pos >= 0) {
                  pos++;
                  var ext = req.substring(pos, req.indexOf(' ', pos));
                  var mdata = ext.split(":");
                  that.model.set(mdata[0], mdata[1]);

                  // replace text on tag
                  $el.val(req.replace(ext, ''));
                }
              });
            }
        },
        initialize: function(options) {
            this.github = options.githubAPI;
            // TODO: HACK provide to the concreate child view !!
            cachedGithub = options.githubAPI;
            this.collection = new Backbone.Collection;
            var that = this;
            var user = this.github.getUser();
            var req = "",
                m_search = "",
                m_path = "", m_file="", m_ext="";
            _.each(unescape(this.model.get("query")).split("&"), function(item) {
                var kv = item.split("=");
                if (kv.length == 2 && kv[0] == "q") {
                    req = kv[1];
                } else if (kv.length == 2 && kv[0] == "path") {
                    m_search += "+path:" + kv[1];
                    m_path = kv[1];
                } else if (kv.length == 2 && kv[0] == "file") {
                    m_search += "+filename:" + kv[1];
                    m_file = kv[1];
                } else if (kv.length == 2 && kv[0] == "ext") {
                    m_search += "+extension:" + kv[1];
                    m_ext = kv[1];
                }
            });
            // repository is a paramete of the URL neither than request
            var m_repo = this.model.get("user") + "/" + this.model.get("repo");
            m_search += "+repo:" + m_repo;

            // Update model with a valid
            this.model.set("req", req);
            this.model.set("path", m_path);
            this.model.set("file", m_file);
            this.model.set("ext", m_ext);

            // TODO: HACK provide to the concreate child view !!
            searchData = req;

            this.searchNewScope();
        },
        searchNewScope: function(e) {
            // Request data
            var req = this.$el.find("#sp-code-search-input").val();
            // Repository scope
            var repo = this.model.get("user") + "/" + this.model.get("repo");

            // Search path
            var m_path = this.model.get("path") || "";
            if (m_path != "") {
              m_path = "+path:" + m_path;
            }

            // Search file
            var m_file = this.model.get("file") || "";
            if (m_file != "") {
              m_file = "+filename:" + m_file;
            }
            // Search by file extension
            var m_ext = this.model.get("ext") || "";
            if (m_ext != "") {
              m_ext = "+extension:" + m_ext;
            }
            var search = Github.getSearch(req + "+repo:" + repo + m_path + m_file+m_ext);
            var that = this;
            search.code({}, function(error, data) {
                if (data) {
                    that.collection.reset(data.items);
                    that.ui.total_count.html(data.total_count);
                    that.model.set("incomplete_results", data.total_count);
                }
            });
        },
        behaviors: {
            PreventSubmission: {}
        },
        removeTagBubble: function(e) {
            var $par = $(e.target).parent();
            var item = $par.attr("data-model");
            $par.remove();
            this.model.unset(item)
        },
        templateHelpers: function() {
            return {
                getTagBubbles: function() {
                    var result = "";
                    if (this.repo)
                        result += '<span class="tag label label-info" data-model="repo">repo  :  ' + this.user + '/' + this.repo + '<span data-role="dropdown"></span></span>';
                    if (this.path)
                        result += '<span class="tag label label-info" data-model="path">path  :  ' + this.path + '<span class="sp-tag-bubble" data-role="remove"></span></span>';
                    if (this.filename)
                        result += '<span class="tag label label-info" data-model="path">file  :  ' + this.file + '<span class="sp-tag-bubble" data-role="remove"></span></span>';
                    if (this.extension)
                        result += '<span class="tag label label-info" data-model="path">ext  :  ' + this.ext + '<span class="sp-tag-bubble" data-role="remove"></span></span>';
                    return result;
                },
                getHiddenInput: function() {
                   var result = "";
                   var that = this;
                   ["file", "ext", "path"].map(function(item) {
                      result += '<input class="sp-code-search-path" name="'+item+'" value="'+ that[item] +'" type="hidden" '+(that[item] != ""  ? "":"disabled") + '>';
                   });
                   return result;
                }
            };
        },
        template: _.template('<div class="column three-fourths codesearch-results">\
    <div class="codesearch-head">\
      <form accept-charset="UTF-8" action="/github.com/search/<%= user %>/<%= repo %>/search" class="flex-table search-form-fluid sp-submission" id="search_form" method="get">\
        <div class="flex-table-item flex-table-item-primary">\
  				<div class="bootstrap-tagsinput" style="width:100%;">\
					  <%= getTagBubbles() %>\
						<input id="sp-code-search-input" size="12" name="q" value="<%= req %>" tabindex="2"  placeholder="" type="text" style="min-width:80%;">\
            <%= getHiddenInput() %>\
				  </div>\
        </div>\
        <div class="flex-table-item">\
          <button class="btn" type="submit" tabindex="3">Search</button>\
        </div>\
  </form>\
</div>\
  <div class="sort-bar">\
    <div class="select-menu js-menu-container js-select-menu right select-menu-modal-right">\
      <button class="btn btn-sm select-menu-button js-menu-target" type="button" aria-haspopup="true">\
        <i>Sort:</i>\
        <span class="js-select-button">Best match</span>\
      </button>\
      <div class="select-menu-modal-holder js-menu-content js-navigation-container" aria-hidden="true">\
        <div class="select-menu-modal">\
          <div class="select-menu-header">\
            <svg aria-label="Close" class="octicon octicon-x js-menu-close" height="16" role="img" version="1.1" viewBox="0 0 12 16" width="12"><path d="M7.48 8l3.75 3.75-1.48 1.48-3.75-3.75-3.75 3.75-1.48-1.48 3.75-3.75L0.77 4.25l1.48-1.48 3.75 3.75 3.75-3.75 1.48 1.48-3.75 3.75z"></path></svg>\
            <span class="select-menu-title">Sort options</span>\
          </div>\
          <div class="select-menu-list">\
              <span class="select-menu-item js-navigation-open js-navigation-item selected">\
                <svg aria-hidden="true" class="octicon octicon-check select-menu-item-icon" height="16" role="img" version="1.1" viewBox="0 0 12 16" width="12"><path d="M12 5L4 13 0 9l1.5-1.5 2.5 2.5 6.5-6.5 1.5 1.5z"></path></svg>\
                <span class="select-menu-item-text js-select-button-text">Best match</span>\
</span>              <a class="select-menu-item js-navigation-open js-navigation-item" href="https://github.com/umlsynco/umlsync-framework/search?o=desc&amp;q=border&amp;s=indexed&amp;utf8=%E2%9C%93">\
                <svg aria-hidden="true" class="octicon octicon-check select-menu-item-icon" height="16" role="img" version="1.1" viewBox="0 0 12 16" width="12"><path d="M12 5L4 13 0 9l1.5-1.5 2.5 2.5 6.5-6.5 1.5 1.5z"></path></svg>\
                <span class="select-menu-item-text js-select-button-text">Recently indexed</span>\
</a>              <a class="select-menu-item js-navigation-open js-navigation-item" href="https://github.com/umlsynco/umlsync-framework/search?o=asc&amp;q=border&amp;s=indexed&amp;utf8=%E2%9C%93">\
                <svg aria-hidden="true" class="octicon octicon-check select-menu-item-icon" height="16" role="img" version="1.1" viewBox="0 0 12 16" width="12"><path d="M12 5L4 13 0 9l1.5-1.5 2.5 2.5 6.5-6.5 1.5 1.5z"></path></svg>\
                <span class="select-menu-item-text js-select-button-text">Least recently indexed</span>\
</a>          </div>\
        </div>\
      </div>\
    </div>\
    <h3>\
    We’ve found <span id="total_count">0</span> code results\
</h3>\
  </div>\
\
  <div id="code_search_results">\
    <div class="code-list"></div>\
    <div class="paginate-container">\
       <div class="pagination" data-pjax="true"><span class="previous_page disabled">Previous</span> <em class="current">1</em> <a rel="next" href="/umlsynco/umlsync-framework/search?p=2&amp;q=border&amp;utf8=%E2%9C%93">2</a> <a href="/umlsynco/umlsync-framework/search?p=3&amp;q=border&amp;utf8=%E2%9C%93">3</a> <a href="/umlsynco/umlsync-framework/search?p=4&amp;q=border&amp;utf8=%E2%9C%93">4</a> <a href="/umlsynco/umlsync-framework/search?p=5&amp;q=border&amp;utf8=%E2%9C%93">5</a> <a href="/umlsynco/umlsync-framework/search?p=6&amp;q=border&amp;utf8=%E2%9C%93">6</a> <a href="/umlsynco/umlsync-framework/search?p=7&amp;q=border&amp;utf8=%E2%9C%93">7</a> <a class="next_page" rel="next" href="/umlsynco/umlsync-framework/search?p=2&amp;q=border&amp;utf8=%E2%9C%93">Next</a></div>\
    </div>\
  </div>\
    <div class="context-loader large-format-loader">\
  <p><img alt="" src="https://assets-cdn.github.com/images/spinners/octocat-spinner-128.gif" height="64" width="64"></p>\
  <p>Loading…</p>\
</div>\
  </div>')

    });
});
