//
// Transform date to string
//

define( [ 'App', 'marionette',],
    function( App, Marionette) {
        //ItemView provides some default rendering logic
        return function(date) {
          var date_now = new Date();
          var date_before = new Date(date);
          
          var diff = date_now.getFullYear() - date_before.getFullYear();

          if (diff < 0) return date_before;

          if (diff > 0)
              return " "  + diff + " " + (diff == 1 ? "year ago": "years ago");
          diff = date_now.getMonth() - date_before.getMonth();
          if (diff > 0)
              return " "  + diff + " " + (diff == 1 ? "month ago": "months ago");

          diff = date_now.getDay() - date_before.getDay();
          if (diff > 0)
              return " "  + (diff == 1 ? "yesterday": diff + " days ago");

          diff = date_now.getHours() - date_before.getHours();
          if (diff > 0)
              return " "  + diff + " " + (diff == 1 ? "hour ago": "hours ago");

          diff = date_now.getMinutes() - date_before.getMinutes();
          if (diff > 0)
              return " "  + diff + " " + (diff == 1 ? "minute ago": "minutes ago");

          return "a few minutes ago";
      };
});
