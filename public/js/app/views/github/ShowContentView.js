define(['marionette', 'base-64', 'App', 'behaviours/submission'], function(Marionette, base64, App, PreventSubmission) {

    var BubbleView = Marionette.ItemView.extend({
        template: _.template('\
     <div style="top: 350.1px; left: 35px; width:250px; display: block; position:absolute;" id="step-0" class="popover tour-tour tour-tour-0 fade bottom in" role="tooltip">\
       <div style="content: \'\';position: absolute;border-style: solid;border-width: 15px 15px 15px 0;border-color: transparent grey;display: block;width: 0;z-index: 1;left: -15px;top: 12px;"></div>\
       <h3 class="popover-title">Snippet name</h3>\
       <div class="popover-content" style="min-height:90px;"><%= comment %></div>\
       <div class="popover-navigation">\
         <div class="btn-group">\
           <button class="btn btn-sm btn-default" id="bubble-prev">« Prev</button>\
           <button class="btn btn-sm btn-default" id="bubble-next">Next »</button>\
         </div>\
         <div class="btn-group right">\
          <button class="btn btn-sm btn-default" id="bubble-save">Save</button>\
          <button class="btn btn-sm btn-default" id="bubble-close">Close</button>\
         </div>\
       </div></div>'),
        ui: {
            prev: "button#bubble-prev",
            next: "button#bubble-next",
            save: "button#bubble-save",
            close: "button#bubble-close",
            popover: "DIV.popover-content",
        },
        events: {
            "click @ui.save": "onSave",
            "click @ui.close": "onClose",
            "click @ui.prev": "onPrev",
            "click @ui.next": "onNext",
            "dblclick @ui.popover": "onToggleEdit"
        },
        onRender: function() {
            if (!this.options.controller) {
                this.ui.next.addClass("disabled");
                this.ui.prev.addClass("disabled");
            } else {
                var pn = this.options.controller.hasPrevNext(
                    this.options.historyItem,
                    this.options.commentItem);
                if (!pn.hasNext) {
                    this.ui.next.addClass("disabled");
                }
                if (!pn.hasPrev) {
                    this.ui.prev.addClass("disabled");
                }
            }
        },
        onToggleEdit: function() {
            // Get current text
            var text = this.ui.popover.text();
            // Clear node
            this.ui.popover.empty();
            // add text area
            this.ui.popover.append('<textarea style="width:100%; height: 75px;" placeholder="Please add you comment ...">' + text + '</textarea>');
            this.ui.popover.children("textarea").blur(function() {
                var edited = $(this).val();
                var parent = $(this).parent();
                $(this).remove();
                parent.append(edited);
            });
        },
        onSave: function() {
            var text = this.ui.popover.text();

            // Update an existing comment
            if (this.options.commentItem) {
                this.options.commentItem.set("comment", text);
            } else {
                App.vent.trigger("history:bubble", {
                    path: this.model.get("path"),
                    sha: "",
                    branch: this.model.get("branch"),
                    repo: this.model.get("repo"),
                    comment: text,
                    linenum: this.model.get("linenum")
                });
            }
            this.$el.remove();
        },
        onClose: function() {
            this.$el.remove();
        },
        onPrev: function() {
            this.options.controller.stepPrev(
                this.options.historyItem,
                this.options.commentItem);
        },
        onNext: function() {
            if (this.options.controller)
                this.options.controller.stepNext(
                    this.options.historyItem,
                    this.options.commentItem);
        }
    });


    // GitHub Repository item description:
    var ContentView = Marionette.ItemView.extend({
        tagName: "pre",
        className: "prettyprint linenums:1",
        template: _.template('<%= getContent() %>'),
        templateHelpers: function() {
            var content = this.options.content;
            return {
                getContent: function() {
                    var res = content.replace(/\</g, "&lt;");
                    res = res.replace(/\>/g, "&gt;");
                    return res;
                }
            };
        },
        onRender: function() {
            //             hljs.highlightBlock($(this.ui.code));
        }
    });

    var FileHeader = Marionette.ItemView.extend({
        templateHelpers: function() {
            return {
                getFileSize: function() {
                    if (!this.size)
                        return "";

                    var kb = this.size / 1024;
                    if (kb < 1)
                        return "" + this.size + " Bytes";
                    var mb = kb / 1024;
                    if (mb < 1)
                        return "" + kb + " KB";
                    return "" + mb + " MB";
                }
            };
        },
        className: "file-header",
        template: _.template('\
            <div class="file-actions">\
              <div class="btn-group">\
                <a href="<%= html_url %>" class="btn btn-sm tooltipped tooltipped-nw " aria-label="Open file on GitHub" id="raw-url">GitHub</a>\
                <a href="#" disabled class="btn btn-sm js-update-url-with-hash tooltipped tooltipped-nw" aria-label="Open the latest version of file">Check on latest</a>\
                <a href="#" disabled class="btn btn-sm tooltipped tooltipped-nw" rel="nofollow" aria-label="Load snippet comments for this file">Load snippets</a>\
              </div>\
              <button type="button" class="btn-octicon disabled tooltipped tooltipped-nw" aria-label="Switch to markdown view">\
                <svg aria-hidden="true" class="octicon octicon-pencil" height="16" role="img" version="1.1" viewBox="0 0 14 16" width="14"><path d="M0 12v3h3l8-8-3-3L0 12z m3 2H1V12h1v1h1v1z m10.3-9.3l-1.3 1.3-3-3 1.3-1.3c0.39-0.39 1.02-0.39 1.41 0l1.59 1.59c0.39 0.39 0.39 1.02 0 1.41z"></path></svg>\
              </button>\
            </div>\
            <div class="file-info">\
              <%= total_lines %> lines\
              <span class="file-info-divider"></span>\
              <%= getFileSize() %> \
            </div>'),

    });

    return Marionette.LayoutView.extend({
        className: "file-wrap",
        regions: {
            "content": ".blob-wrapper",
            "bubble": "div.bubble",
            "file-header": "div.file"
        },
        initialize: function(options) {
            this.github = options.githubAPI;
            this.snippetor = options.snippetorAPI;

            this.collection = new Backbone.Collection;
            var that = this;
            var repo = this.github.getAPI().getRepo(this.model.get("repo"));
            var model = this.model;

            var repoName = model.get("repo");
            var branch = model.get("branch") || "master";
            var path = model.get("path") || "";

            if (path != "") {
                repo.contents(branch, path, function(err, data) {
                    var content = "";
                    if (data) {
                        // Report history item if it was not report before
                        if (!model.get("ref")) {
                            App.vent.trigger("history:report", {
                                path: model.get("path"),
                                sha: "",
                                branch: model.get("branch"),
                                repo_ref: model.get("repo_ref"),
                                repo: model.get("repo")
                            });
                        }

                        ////////////////////////////////////
                        // Decode content
                        ////////////////////////////////////
                        if (data.encoding == "base64") {
                          content = base64.decode(data.content);
                        } else {
                          content = data.content;
                        }
                        // FIXME: find another way to count lines
                        data.total_lines = content.split("\n").length - 1;


                        ////////////////////////////////////
                        // Add content view
                        ////////////////////////////////////

                        that.showChildView("file-header", new FileHeader({
                            model: new Backbone.Model(data)
                        }));
                        that.showChildView("content", new ContentView({
                            content: content
                        }));


                        ////////////////////////////////////
                        // Highlight code
                        ////////////////////////////////////
                        prettyPrint();

                        ////////////////////////////////////
                        // Show snippet bubble
                        ////////////////////////////////////
                        that.$el.find("pre.prettyprint").parent().css({
                            height: "600px",
                            overflow: "scroll"
                        });

                        that.$el.find("pre.prettyprint>ol>li").each(function(idx, list) {
                            $('<i class="fa fa-fw"></i>').insertBefore($(list).children()[0]);
                        });

                        that.historyItem = that.snippetor.getHistoryItem(model);
                        // Get Active snippets for current content
                        that.snippets = that.snippetor.getWorkingComments(model);
                        if (that.snippets) {
                            that.snippets.each(function(item) {
                                var line = item.get("linenum");
                                var list = that.$el.find("pre.prettyprint>ol>li:eq(" + line + ")");
                                if (list.length == 1) {
                                    var pos = list.position();
                                    pos.left = 45;
                                    pos.top -= 35;
                                    // TODO: calculate linenum more accuratly
                                    pos.top -= (line - 20) * 14;

                                    list.children("i.fa").addClass("fa-comment");
                                    list.children("i.fa").click(function() {
                                        item.set("active", true);
                                    });

                                    if (item.get("active")) {
                                        that.showChildView("bubble", new BubbleView({
                                            model: new Backbone.Model({
                                                repo: repoName,
                                                branch: branch,
                                                path: path,
                                                linenum: line,
                                                comment: item.get("comment")
                                            }),
                                            commentItem: item,
                                            historyItem: that.historyItem,
                                            controller: that.snippetor.getNextPrevController()
                                        }));
                                        var $t = $("div#step-0");

                                        $t.css(pos);

                                        // SCROLL TO THE ELEMENT
                                        that.$el.find("pre.prettyprint").parent().animate({
                                            scrollTop: pos.top + 35
                                        }, 1000);
                                    } // active
                                } // if has line

                                // TODO: Show each snippet position
                            }); // each

                            that.snippets.on("add", function(item) {
                                var line = item.get("linenum");
                                var list = that.$el.find("pre.prettyprint>ol>li:eq(" + line + ")");
                                if (list.length == 1) {
                                    list.children("i.fa").addClass("fa-comment");
                                    list.children("i.fa").click(function() {
                                        item.set("active", true);
                                    });
                                }
                            });
                            that.snippets.on("change:active", function(item, data) {
                                var line = item.get("linenum");
                                var list = that.$el.find("pre.prettyprint>ol>li:eq(" + line + ")");
                                if (list.length == 1) {
                                    var pos = list.position();
                                    pos.left = 75;
                                    pos.top -= 35;

                                    if (item.get("active")) {
                                        that.showChildView("bubble", new BubbleView({
                                            model: new Backbone.Model({
                                                repo: repoName,
                                                branch: branch,
                                                path: path,
                                                linenum: line,
                                                comment: item.get("comment")
                                            }),
                                            commentItem: item,
                                            historyItem: that.historyItem,
                                            controller: that.snippetor.getNextPrevController()
                                        }));

                                        var $t = $("div#step-0");
                                        $t.css(pos);
                                    } // active
                                } // correct line number
                            });
                            that.snippets.on("remove", function(item) {
                                // Hide bubble on snippet remove
                                if (item.get("active")) {
                                    that.getRegion("bubble").reset();
                                }
                                var line = item.get("linenum");
                                var list = that.$el.find("pre.prettyprint>ol>li:eq(" + line + ")");
                                if (list.length == 1) {
                                    list.children("i.fa").removeClass("fa-comment");
                                }
                            });
                        } // has snippets

                        ////////////////////////////////////
                        // Enable search directly from code
                        ////////////////////////////////////
                        $("span.typ").click(function() {
                            App.appRouter.navigate("/github.com/" + repoName + "/search?q=" + $(this).text(), {
                                trigger: true
                            });
                        });

                        ////////////////////////////////////
                        // Enable snippets bubble
                        ////////////////////////////////////
                        $("pre.prettyprint>ol>li").dblclick(function() {
                            var linenum = $(this).index() + 1;
                            that.showChildView("bubble", new BubbleView({
                                model: new Backbone.Model({
                                    repo: repoName,
                                    branch: branch,
                                    path: path,
                                    linenum: linenum,
                                    comment: "Your comment..."
                                })
                            }));
                            var pos = $(this).position();
                            pos.left = 45;
                            pos.top -= 35;
                            var $t = $("div#step-0");
                            $t.css(pos);
                        }).click(function() {
                            // TODO: hide snippet bubble
                        });
                    }
                });
            }
        },
        templateHelpers: function() {
            return {
                getBreadcrumbs: function() {
                    if (!this.path) return "";

                    var result = "";
                    var subpath = "";
                    var paths = (this.path || "").split("/");
                    for (var i = 0; i < paths.length; ++i) {
                        subpath = subpath + "/" + paths[i];
                        if (i != paths.length - 1) {
                            result += '<span itemscope="" itemtype="http://data-vocabulary.org/Breadcrumb"><a href="/github.com/' + this.repo + '/tree/master' + subpath + '" class="sp-routing" data-branch="7ce846ec3297d3a0d7272dbfa38427d21f650a35" data-pjax="true" itemscope="url" rel="nofollow"><span itemprop="title">' + paths[i] + '</span></a></span></span><span class="separator">/</span>';
                        }
                        // Final path is not selectable
                        else {
                            result += '<strong class="final-path">' + paths[i] + '</strong>'
                        }
                    }
                    return result;
                },
                getDirectory: function() {
                    if (this.path) {
                        var x = this.path.split("/");
                        x.pop();
                        return x.join("/");
                    }
                }
            };
        },
        onRender: function() {
            this.$el.find("a.sp-routing").click(function(e) {
                e.stopPropagation();
                e.preventDefault();
                App.appRouter.navigate($(this).attr("href"), {
                    trigger: true
                });
            });
        },
        events: {
            "click span.sp-search-checker": "toggleSearchCheck"
        },
        behaviors: {
            PreventSubmission: {}
        },
        searchInScope: true,
        toggleSearchCheck: function() {
            this.searchInScope = !this.searchInScope;
            var $scope = this.$el.find("span.sp-search-checker>span");

            // trigger sexy checkbox
            if (!this.searchInScope) {
                $scope.removeClass("fa-check-circle-o")
                $scope.addClass("fa-circle-o");

            } else {
                $scope.addClass("fa-check-circle-o")
                $scope.removeClass("fa-circle-o");
            }
            // disable/enable form "path" scope
            this.$el
                .find("input.sp-search-path")
                .prop("disabled", !this.searchInScope);
        },
        template: _.template('\
  <div class="breadcrumb js-zeroclipboard-target">\
    <span class="repo-root js-repo-root"><span itemscope="" itemtype="http://data-vocabulary.org/Breadcrumb"><a href="/github.com/<%= repo %>" class="sp-routing" data-branch="7ce846ec3297d3a0d7272dbfa38427d21f650a35" data-pjax="true" itemscope="url" rel="nofollow"><span itemprop="title"><%= repo %></span></a></span></span><span class="separator">/</span><%= getBreadcrumbs() %>\
    <div class="input-group custom-search-form right" style="padding-right:0px; margin-top: -5px;">\
    <form accept-charset="UTF-8" action="/github.com/<%= repo %>/search" class="repo-search sp-submission" method="get" role="search">\
      <div class="input-group">\
         <input name="utf8" value="✓" type="hidden">\
         <input name="user" value="umlsynco" type="hidden">\
         <span class="input-group-addon beautiful sp-search-checker"><span class="fa fa-check-circle-o"></span></span>\
         <input type="text" class="form-control" name="q" placeholder="Search...">\
         <input class="sp-search-path" name="path" value="<%= getDirectory() %>" type="hidden">\
         <span class="input-group-btn">\
           <button class="btn btn-default" type="button">\
             <i class="fa fa-search"></i>\
           </button>\
           <button class="btn btn-default" type="button">\
             <i class="fa">  File</i>\
           </button>\
         </span></div>\
    </form></div>\
  </div>\
  <div class="file">\
  </div>\
  <div class="blob-wrapper data type-javascript"></div></div>\
  <div class="bubble" style="position:absolute; left:250; top:0;"></div>\
    ')

    });
});
