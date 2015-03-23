
(function($) {
  var selectors = [];

  var check_binded = false;
  var check_lock = false;
  var defaults = {
    interval: 250,
    force_process: false
  }
  var $window = $(window);

  var $prior_appeared;

  function process() {
    check_lock = false;
    var scrollTop = $window.scrollTop();
    for (var index = 0, selectorsLength = selectors.length; index < selectorsLength; index++) {
      $(selectors[index]).each(function() {
        updateElement(this,scrollTop);

      });
    }
  }

  function triggerState($element,state) {
    $element.trigger(state);
    console.log(state);
    $element.data("sf-state",state);
  }


  function updateElement(element,scrollTop) {
    var $element = $(element);
    var lastScroll = $element.data("sf-last") || 0;
    var lastState = $element.data("sf-state") || "off";

    var offset = $element.offset();
    var left = offset.left;
    var top = offset.top;
    var height = $element.height();
    var windowHeight = $window.height();


    if(scrollTop > lastScroll) { 
      switch(lastState) {
        case "off":
        if(top  < scrollTop + windowHeight) { 
          triggerState($element,"arriving");
        } else { break; }
        case "arriving":
        if(top + height < scrollTop + windowHeight) { 
          triggerState($element,"arrived");
        } else { break; }
        case "arrived":
        if(top < scrollTop) {
          triggerState($element,"departing");
        } else { break; }
        case "departing":
        if(top  + height < scrollTop) {
          triggerState($element,"departed");
        } 
        case "departed":
        if(top + height < scrollTop) {
          $element.data("sf-state","finished");
        }
      }
    } else if(scrollTop < lastScroll) {
      switch(lastState) {
        case "finished":
        if(top + height >= scrollTop) {
          triggerState($element,"rearriving");
        } else { break; }
        case "rearriving":
        if(top >= scrollTop) {
          triggerState($element,"rearrived");
        } else { break; }
        case "rearrived":
        if(top + height >= scrollTop + windowHeight) {
          triggerState($element,"redeparting");
        } else { break; }
        case "redeparting":
        if(top >= scrollTop + windowHeight) {
          triggerState($element,"redeparted");
        }
        case "redeparted":
        if(top >= scrollTop + windowHeight) {
          $element.data("sf-state","off");
        };
      }
    }

    $element.data("sf-last",scrollTop);
  }

  // "appeared" custom filter
  $.expr[':']['appeared'] = function(element) {
    var $element = $(element);
    if (!$element.is(':visible')) {
      return false;
    }

    var window_left = $window.scrollLeft();
    var window_top = $window.scrollTop();
    var offset = $element.offset();
    var left = offset.left;
    var top = offset.top;

    if (top + $element.height() >= window_top &&
        top - ($element.data('appear-top-offset') || 0) <= window_top + $window.height() &&
        left + $element.width() >= window_left &&
        left - ($element.data('appear-left-offset') || 0) <= window_left + $window.width()) {
      return true;
    } else {
      return false;
    }
  }

  $.fn.extend({
    // watching for element's appearance in browser viewport
    scrollFlight: function(options) {
      var opts = $.extend({}, defaults, options || {});
      var selector = this.selector || this;
      if (!check_binded) {
        var on_check = function() {
          if (check_lock) {
            return;
          }
          check_lock = true;

          setTimeout(process, opts.interval);
        };

        $(window).scroll(on_check).resize(on_check);
        check_binded = true;
      }

      if (opts.force_process) {
        setTimeout(process, opts.interval);
      }
      selectors.push(selector);
      return $(selector);
    }
  });

})(jQuery);
