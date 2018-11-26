jquery.popup
===============

jquery.popup is jQuery plugin that allows you to create model popup windows inside of a web browser. It currently supports the following features: 


Features
------

-Dynmic AJAX loading of popup content

-Templates for popup window borders

-Customizable backgrounds

-Multiple popups with automatic window focus

-Centering that actually works!

-Move/resize windows by dragging (optional/customizable)

-Custom event for popup open/close


Usage
------

Create and open a simple popup:
```
var popup = $.popup.create("id_of_div_with_popup_content");
popup.open();
```

Create a centered popup:
```
var popup = $.popup.create("id_of_div_with_popup_content", {"center": true});
```

Create an AJAX popup:
```
var popup = $.popup.create("id_of_a_new_div_that_will_be_created", {"url": "./ajax_popup_content.html"});
```

Dynamically change popup content:
```
var content = "Nothing here yet...";
var popup = $.popup.create("id_of_a_new_div_that_will_be_created", {"content": content});
popup.open();
popup.content("Hello world!");
```

Demo/Examples
------

Check out http://files.isans.net/Popup/demo/index.html to see jquery.popup in action!

License
------

This library is licensed under the [MIT license](http://www.opensource.org/licenses/mit-license.php).
