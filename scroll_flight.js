(function($) {
  var selectors = [];

  var check_binded = false;
  var check_lock = false;
  var defaults = {
    interval: 16
  }
  var $window = $(window);

  var $prior_appeared;

  function process() {
    if(check_lock) { 
      check_lock = false;
      var scrollTop = $window.scrollTop();
      for (var index = 0, selectorsLength = selectors.length; index < selectorsLength; index++) {
        $(selectors[index]).each(function() {
          updateElement(this,scrollTop);

        });
      }
    }
    requestAnimationFrame(process);
  }

  function triggerState($element,state) {
    $element.triggerHandler(state);
    $element.data("sf-state",state);
  }

  function offsetFor($element,state) {
    var offset = $element.attr("data-" + state);
    if((offset||"").match(/^[0-9]+%$/)) {
      return (parseInt(offset) * 0.01 * $window.height());
    } else {
      return parseInt(offset) || 0;
    }
  }


  function updateElement(element,scrollTop) {
    var $element = $(element);
    var lastScroll = $element.data("sf-last") || -1;
    var lastState = $element.data("sf-state") || "off";

    var offset = $element.offset();
    var left = offset.left;
    var top = offset.top;
    var height = $element.height();
    var windowHeight = $window.height();



    if(scrollTop > lastScroll) { 
      switch(lastState) {
        case "off":
        if(top + offsetFor($element,"arriving") < scrollTop + windowHeight) { 
          triggerState($element,"arriving");
        } else { break; }
        case "arriving":
        case "redeparting":
        if(top + height + offsetFor($element,"arrived") < scrollTop + windowHeight) { 
          triggerState($element,"arrived");
        } else { break; }
        case "arrived":
        case "rearrived":
        if(top + offsetFor($element,"departing") < scrollTop) {
          triggerState($element,"departing");
        } else { break; }
        case "departing":
        case "rearriving":
        if(top  + height + offsetFor($element,"departed") < scrollTop) {
          triggerState($element,"departed");
        } 
        case "departed":
        if(top + height  + offsetFor($element,"departed") < scrollTop) {
          $element.data("sf-state","finished");
        }
      }
    }  else if(scrollTop <= lastScroll) {
      switch(lastState) {
        case "finished":
        if(top + height  + offsetFor($element,"rearriving")  >= scrollTop) {
          triggerState($element,"rearriving");
        } else { break; }
        case "departing":
        case "rearriving":
        if(top  + offsetFor($element,"rearrived") >= scrollTop) {
          triggerState($element,"rearrived");
        } else { break; }
        case "rearrived":
        case "arrived":
        if(top + height  + offsetFor($element,"redeparting") >= scrollTop + windowHeight) {
          triggerState($element,"redeparting");
        } else { break; }
        case "redeparting":
        case "arriving":
        if(top  + offsetFor($element,"redeparted") >= scrollTop + windowHeight) {
          triggerState($element,"redeparted");
        }
        case "redeparted":
        if(top  + offsetFor($element,"redeparted") >= scrollTop + windowHeight) {
          $element.data("sf-state","off");
        };
      }
    }

    if(lastState != 'off' &&
       lastState != 'finished') {
         var val = 1 - ((top + offsetFor($element,"arriving")) - scrollTop) / windowHeight;
         var reveal =  (offsetFor($element,"reveal") + scrollTop + windowHeight - top) / height;
         if(val < 0) { val = 0; }
         if(val > 1) { val = 1; }

         if(reveal < 0) { reveal = 0; }
         if(reveal > 1) { reveal = 1; }

         $element.triggerHandler('update', val);
         $element.triggerHandler('reveal', reveal);

          
    }

    $element.data("sf-last",scrollTop);
  }

  /*
  $.fn.affix = function(options) { 
    return this.each(function() {
      var $elem  = $(this),
          w = $elem.outerWidth(),
          h = $elem.outerHeight(),
          $wrap = $("<div class='sf-affixer'>");

      $elem.unaffix();

      if($elem.css('position') == 'absolute') {
        var $pos = $elem.position();
        $wrap.css({ position: "absolute", left: $pos.left, top: $pos.top });
      }

      $wrap.css({ width: w, height: h });

      $elem.wrap($wrap);

      $elem.css({ position: "fixed", top: $elem.data("affix-top") || 0, left: $elem.data("affix-left") || undefined });
    });
  }*/

  $.fn.affix = function(options) {
    return this.each(function() {
      var $elem  = $(this),
          w = $elem.outerWidth(),
          h = $elem.outerHeight();


      $elem.unaffix();

      var location = $elem.offset();

      var scrollLeft = $window.scrollLeft();
      var scrollTop = $window.scrollTop();

      location.left -= scrollLeft;
      location.top -= scrollTop;

      $elem.data("sf-affix-location",$elem.position());
      $elem.data("sf-affix-affixed",location);
      $elem.data("sf-affix-position",this.style.position);

      $elem.css({ position: "fixed", top: location.top, left: location.left });

    });
  };


  $.fn.flightState = function() {
    return $(this).first().data("sf-state");
  }

  $.fn.unaffix = function(options) {
    return this.each(function() {
      var $elem  = $(this);

      var origLocation = $elem.data("sf-affix-location");
      var origPosition = $elem.data("sf-affix-position");

      if(origLocation) {
        $elem.css({ position: origPosition, top: origLocation.top, left: origLocation.left });
        $elem.data("sf-affix-location",null);
        $elem.data("sf-affix-position",null);
      }
    });
  }

  $.fn.release = function(options) {
    return this.each(function() {
      var $elem  = $(this);


      var scrollLeft = $window.scrollLeft();
      var scrollTop = $window.scrollTop();

      var affixedLocation = $elem.data("sf-affix-affixed");

      if(affixedLocation) { 
        $elem.css({ position: "absolute", });
        var $parent = $elem.offsetParent();
        var parentLocation = $parent.offset();
        var locTop = scrollTop - parentLocation.top + affixedLocation.top;
        var locLeft = scrollLeft - parentLocation.left + affixedLocation.left;

        $elem.css({ position: "absolute",
                    left: locLeft,
                    top: locTop });
        $elem.data("sf-affix-affixed",null);
      }
    });
  }
  

  $.fn.extend({
    // watching for element's appearance in browser viewport
    scrollFlight: function(options) {
      var opts = $.extend({}, defaults, options || {});
      var selector = this.selector || this;
      if (!check_binded) {
        var on_check = function() {
          check_lock = true;
        };

        $(window).scroll(on_check).resize(on_check);
        check_binded = true;
        process();
      }

      check_lock = true;

      selectors.push(selector);
      return $(selector);
    }
  });

})(jQuery);
