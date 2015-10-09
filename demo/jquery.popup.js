/*
	Popup 1.0.0
	Written by: An0Hit0
	Liscence: http://www.opensource.org/licenses/mit-license.php
*/

(function($) {
	
	//zoom correction is neccessary for getting/setting correct pixel coordinates on some browsers
	$.zoomCorrectionEnable = false;
	if(navigator.userAgent.match(/(OPR\/)/) != null) $.zoomCorrectionEnable = true;
	
	$.zoomCorrection = function() {
		return $.zoomCorrectionEnable == true ? parseFloat($("body").css("zoom")) : 1.0;
	};
	
	function popup_instance(owner, id, options) {
		this.owner = owner;
		this.id = id;
		this.object = null;
		this.content_object = null;
		this.template_object = null;
		this.loading_object = null;
		this.background_object = null;
		this.url = null;
		this.parameters = null;
		this.xhr = null;
		this.reload = false;
		this.opened = false;
		this.callbacks = {};
		this.drag = {};
		
		//open the popup
		this.open = function() {
			//return if the popup is already open
			if (this.opened == true) return;
			
			//run callback and cancel if the callback return true
			if (this.callbacks['open'] != null && this.callbacks['open'](this) == true) return;
			
			//set the popup open state
			this.opened = true;
	
			//bind event handlers
			this.bind();
			
			//load the content from a url
			if (this.reload == true && this.url != null)
			{
				this.load(this.url, this.parameters);
			}
			
			//display the background if it exists
			if (this.background_object != null) this.background_object.css("display", "block");
			
			//display the popup
			this.object.css("display", "block");
			
			//trigger custom event
			this.object.trigger("open", [this]);
			
			//focus the popup
			this.focus();
			
			return this;
		}
		
		//close the popup
		this.close = function() {
			//return if the popup is already closed
			if (this.opened != true) return;
			
			//run callback and cancel if the callback return true
			if (this.callbacks['close'] != null && this.callbacks['close'](this) == true) return;
			
			//set the popup open state
			this.opened = false;
		
			//hide the popup
			this.object.css("display", "none");
			
			//hide the background
			if (this.background_object != null) this.background_object.css("display", "none");
			
			//trigger custom event
			this.object.trigger("close", [this]);
			
			//unbind event handlers
			this.unbind();
			
			return this;
		}
		
		//toggle the popup open or closed
		this.toggle = function() {
			if (this.opened != true) return this.open();
			else return this.close();
		}
		
		//put this popup in front of the popup with the highest the z-index
		this.focus = function() {
			//run callback and cancel if the callback return true
			if (this.callbacks['focus'] != null && this.callbacks['focus'](this) == true) return;
		
			//trigger custom event
			this.object.trigger("focus", [this]);
			
			//focusing is done in the main popup object because it tracks the z-index
			this.owner.focus(this.id);
			
			return this;
		}
		
		//get or set current content of popup window
		this.content = function(content) {
			//just return the current content if no new content is specified
			if (typeof content == "undefined") return this.object.find(".popup_content").html();
			
			//run callback and cancel if the callback return true
			if (this.callbacks['change'] != null && this.callbacks['change'](this, content) == true) return;
			
			//clear bindings
			this.unbind();
			
			//set the new content depending of the type of the content argument
			if (typeof content == "string")
				this.content_object.html(content);
			else if ($(content).popup() != null)
				this.content_object.html($(content).content_object.html());
			else
				this.content_object.empty().append($(content).first().clone());
			
			//bind events to new content
			if (this.opened == true) this.bind();
			
			//trigger custom event
			this.object.trigger("change", [this]);
			
			return this;
		}
		
		//load a new url in the popup window
		this.load = function(url, parameters) {
			parameters = parameters || {};
			
			//run callback and cancel if the callback return true
			if (this.callbacks['load'] != null && this.callbacks['load'](this, url, parameters) == true) return;
			
			//set the current url and parameters to their new values
			this.url = url;
			this.parameters = parameters;
			
			//cancel the current request (if any)
			if (this.xhr != null)
			{
				this.xhr.abort();
				this.xhr = null;
			}
			
			//display loading message until popup is loaded
			if(this.loading_object != null)
			{
				this.content_object.hide();
				this.loading_object.show();
				this.object.trigger("change", [this]);
			}
			
			//get content via ajax
			var popup = this;
			this.xhr = $.ajax({
				url: url,
				data: parameters,
				success: function(data)
				{
					//remove the loading message
					if(popup.loading_object != null) 
					{
						popup.loading_object.hide();
						popup.content_object.show();
					}
				
					//sent the new content
					popup.content(data);
					
					//trigger custom event
					popup.object.trigger("load", [popup]);
					
					//set the active xhr request to null
					popup.xhr = null;
				},
				error: function(xhr, ajaxOptions, thrownError)
				{
					//remove the loading message
					if(popup.loading_object != null) 
					{
						popup.loading_object.hide();
						popup.content_object.show();
					}
					
					//don't show the error message for an intentional abort
					if (thrownError == "abort") return;
				
					//show the error message
					var message = "<div class='popup_error'>Error: " + xhr.status + " " + xhr.statusText + "</div>" +
						"<div align='center'><button class='popup_close'>Close</button></div>";
					popup.content(message);
					
					//trigger custom event
					popup.object.trigger("error", [popup]);
					
					//set the active xhr request to null
					popup.xhr = null;
				}
			});
			
			return this;
		}
		
		//set or check the popups's template
		this.template = function(template) {
			if (typeof template == "undefined") return this.template_object;
			
			//unbind events
			this.unbind();
			
			//remove the content object from the dom
			this.content_object.remove();
			
			//remove the current template from the dom
			if (this.template_object != null) this.template_object.remove();
			
			//get a selector for the new template
			if (template == true)
				template = $("<div class='popup_template'><div class='popup_content'></div></div>");
			else if (typeof template == "string")
				template = $(template);
			else
				template = $(template).first().clone();
				
			if (template.length > 0)
			{
				//set the default css properties
				template.addClass("popup_template");
				template.css("display", "block");
			
				//append the new template to the dom
				this.object.empty();
				this.object.append(template);
				template.find(".popup_content").first().replaceWith(this.content_object);
				if (this.loading_object != null) this.content_object.after(this.loading_object);
			}
			else
			{
				//restore the content with no template
				this.object.empty();
				this.object.append(this.content_object);
				if (this.loading_object != null) this.content_object.after(this.loading_object);
				template = null;
			}
			
			//restore bindings
			if (this.opened == true) this.bind();
			
			//set new template
			this.template_object = template;
			
			return this;
		}
		
		//set or check the popup's loading message
		this.loading = function(loading) {
			if (typeof loading == "undefined") return this.loading_object;
			
			//remove the current loading object from the dom
			if (this.loading_object != null) this.loading_object.remove();

			//get a selector for the background
			if (loading == true)
				loading = $("<div class='popup_loading'></div>");
			else if (typeof loading == "string")
				loading = $(loading);
			else
				loading = $(loading).first().clone();
			
			if (loading.length > 0)
			{
				//set the default css properties
				loading.addClass("popup_loading");
				loading.css("display", "nons");
				
				//append the loading object to the dom
				this.content_object.after(loading);
			}
			else
			{
				loading = null;
			}
			
			//set new loading message
			this.loading_object = loading;

			return this;
		}
		
		//set or check the popup's background
		this.background = function(background) {
			if (typeof background == "undefined") return this.background_object;
			
			//unbind events
			this.unbind();
			
			//remove the current background from the dom
			if (this.background_object != null) this.background_object.remove();
			
			//get a selector for the background
			if (background == true)
				background = $("<div class='popup_background popup_close'></div>");
			else if (typeof background == "string")
				background = $(background);
			else
				background = $(background).first().clone();
			
			if (background.length > 0)
			{
				//set the default css properties
				background.addClass("popup_background");
				background.attr("id", id + "_background");
				background.css("display", this.opened == true ? "block" : "none");
				background.css("position", "fixed");
				background.css("width", "100%");
				background.css("height", "100%");
				background.css("top", "0%");
				background.css("left", "0%");
				background.css("z-index", this.object.css("z-index") - 1);
			
				//append the new background to the dom
				this.object.parent().append(background);
			}
			else
			{
				background = null;
			}
			
			//set the new background
			this.background_object = background;
			
			//restore bindings
			if (this.opened == true) this.bind();

			return this;
		}
		
		//define or check callbacks that are called when certain methods are run
		this.callback = function(type, callback) {
			if (typeof callback == "undefined") return this.callbacks[type];
			
			//set new callback
			this.callbacks[type] = callback;
			
			return this;
		}
		
		//centers the popup to the parent element
		this.center = function() {
			var parent = this.object.parent().is('body') ? $(window) : this.object.parent();
			var zoom = $.zoomCorrection();
			var scroll_top = parent.scrollTop() / zoom;
			var scroll_left = parent.scrollLeft() / zoom;
			var parent_height = parent.height() / zoom;
			var parent_width = parent.width() / zoom;
			var height = this.object.outerHeight(true);
			var width = this.object.outerWidth(true);
			
			var top = scroll_top + (parent_height - height) / 2;
			var left = scroll_left + (parent_width - width) / 2;
			
			this.object.css("top", top + "px");
			this.object.css("left", left + "px");
		
			return this;
		}
		
		//centers the popup the the parent element and allows for scrolling
		this.center_lock = function() {
			var parent = this.object.parent().is('body') ? $(window) : this.object.parent();
			var zoom = $.zoomCorrection();
			var scroll_top = parent.scrollTop() / zoom;
			var scroll_left = parent.scrollLeft() / zoom;
			var parent_height = parent.height() / zoom;
			var parent_width = parent.width() / zoom;
			var height = this.object.outerHeight(true);
			var width = this.object.outerWidth(true);
			var top;
			var bottom;
			var left;
			var right;
			
			//calculate popup's top position
			if (height < parent_height)
			{
				//simple centering when the popup fits in the parent's height
				top = scroll_top + (parent_height - height) / 2;
			}
			else
			{
				//center popup while allowing for scrolling if the popup is bigger than the parent's height
				top = this.object.position().top;
				bottom = top + height;
				
				//if popup is past the top edge of the parent, align it with the parent's edge
				if (top > scroll_top * zoom)
					top = scroll_top;
				//if popup is past the bottom edge of the parent, align it with the parent's edge
				else if (bottom < scroll_top * zoom + parent_height)
					top = scroll_top + parent_height - height;
				//leave the popup where it is
				else
					top = null;
			}
			
			//calculate popup's left position
			if (width < parent_width)
			{
				//simple centering when the popup fits in the parent's width
				left = scroll_left + (parent_width - width) / 2;
			}
			else
			{
				//center popup while allowing for scrolling if the popup is bigger than the parent's width
				left = this.object.position().left;
				right = left + width;
				
				//if popup is past the left edge of the parent, align it with the parent's edge
				if (left > scroll_left * zoom)
					left = scroll_left;
				//if popup is past the right edge of the parent, align it with the parent's edge
				else if (right < scroll_left * zoom + parent_width)
					left = scroll_left + parent_width - width;
				//leave the popup where it is
				else
					left = null;
			}
			
			//keep popup within parent's boundries
			if (top != null && top < -0.5) top = 0;
			if (left != null && left < -0.5) left = 0;
			
			//set popup position
			if (top != null) this.object.css("top", top + "px");
			if (left != null) this.object.css("left", left + "px");
			
			return this;
		}
		
		//set or retrieve centering options
		var center_options = {};
		this.center_options = function(options) {
			//set centering options with the options argument if it is given
			if (typeof options == "undefined") return center_options;
			
			//if the type of options is already an object just set it as the new options object
			if (typeof options == "object") return center_options = options;
			
			//lock popup to center
			if (options == true || options == "lock")
			{
				options = {"lock": true};
			}
			//center once the next time the popup is opened
			else if (options == "once")
			{
				options = {"once": true, "open": true};
			}
			//for all other string values of options...
			else if (typeof options == "string")
			{
				var keys = options.split(' ');
				options = {};
				
				$.each(keys, function(index, key) {
					if (key == "") return true;
					options[key] = true;
				});
			}
			
			//set new center options
			center_options = options;
			
			return this;
		}
		
		//bind objects in the popup window with their appropriate event handlers
		this.bind = function() {
			this.object.bind("mousedown", {self: this}, this.focus_click);
			
			this.object.filter(".popup_close").bind("click", {self: this}, this.close_click);
			this.object.find(".popup_close").bind("click", {self: this}, this.close_click);
			if (this.background_object != null)
			{
				this.background_object.filter(".popup_close").bind("click", {self: this}, this.close_click);
				this.background_object.find(".popup_close").bind("click", {self: this}, this.close_click);
			}
			
			this.object.find(".popup_drag").css("cursor", "move");
			this.object.find(".popup_drag").bind("mousedown", {self: this}, this.drag_mouse_down);
			
			this.object.bind("open load change window", {self: this}, this.center_event);
			this.object.find("*").bind("load", {self: this}, this.center_event);
			if(this.object.parent().is('body') != true) this.object.parent().bind("scroll resize", {self: this}, this.center_event);
			
			this.object.bind("DOMNodeInserted DOMNodeRemoved", {self: this}, this.dom_event);
			
			$(window).bind("scroll resize zoom", {self: this}, this.window_event);
			
			return this;
		}
		
		//remove event handler bindings from popup window
		this.unbind = function() {		
			this.object.unbind("mousedown", this.focus_click);
			
			this.object.filter(".popup_close").unbind("click", this.close_click);
			this.object.find(".popup_close").unbind("click", this.close_click);
			if (this.background_object != null)
			{
				this.background_object.filter(".popup_close").unbind("click", this.close_click);
				this.background_object.find(".popup_close").unbind("click", this.close_click);
			}
			
			this.object.find(".popup_drag").unbind("mousedown", this.drag_mouse_down);
			
			this.object.unbind("open load change window", this.center_event);
			this.object.find("*").unbind("load", this.center_event);
			if(this.object.parent().is('body') != true) this.object.parent().unbind("scroll resize", this.center_event);
			
			this.object.unbind("DOMNodeInserted DOMNodeRemoved", this.dom_event);
			
			$(window).unbind("scroll resize zoom", this.window_event);
			
			return this;
		}
		
		this.focus_click = function(event) {
			var self = event.data.self;
			self.focus();
			return;
		}
		
		this.close_click = function(event) {
			var self = event.data.self;
			self.close();
			return;
		}
		
		this.drag_mouse_down = function(event) {
			var self = event.data.self;
			var state = self.drag;
			
			//keep track of the window's starting position
			position = self.object.position();
			state.x_start = position.left;
			state.y_start = position.top;
			
			//set the position offset for dragging based on where the mouse click occured
			var zoom = $.zoomCorrection();
			state.x_offset = event.pageX / zoom;
			state.y_offset = event.pageY / zoom;
			
			//bind event listeners
			self.parent.mousemove({self: self}, self.drag_mouse_move);
			self.parent.mouseup({self: self}, self.drag_mouse_up);
			
			return;
		}
		
		this.drag_mouse_move = function(event) {
			var self = event.data.self;
			var state = self.drag;
			
			//find the event position
			var zoom = $.zoomCorrection();
			x = event.pageX / zoom;
			y = event.pageY / zoom;
			
			//run callback and cancel if the callback return true
			if (this.callbacks['drag'] != null && this.callbacks['drag'](this, x, y) == true) return;
			
			//find the new position
			state.x = state.x_start - (state.x_offset - x);
			state.y = state.y_start - (state.y_offset - y);
			
			//move the popup object
			self.object.css("left", state.x + "px");
			self.object.css("top", state.y + "px");
			
			//trigger custom event
			this.object.trigger("drag", [this]);
			
			return;
		}
		
		this.drag_mouse_up = function(event) {
			var self = event.data.self;
			
			//unbind event listeners
			self.parent.unbind("mousemove", self.drag_mouse_move);
			self.parent.unbind("mouseup", self.drag_mouse_up);
			
			return;
		}
		
		this.center_event = function(event) {
			var self = event.data.self;
			var options = self.center_options();
			
			//clear saved centering options if the once option is enabled
			if(options['once'] == true) self.center_options(null);
			
			//always center if lock is enabled, ignoring other options
			if (options['lock'] == true) self.center_lock();
			//center if centering is enabled for the current event
			else if (options[event.type] == true) self.center();
			
			return;
		}
		
		this.dom_event = function(event) {
			var self = event.data.self;
			
			//trigger custom event
			self.object.trigger("change", [this, event]);
			
			return;
		}
		
		this.window_event = function(event) {
			var self = event.data.self;
			
			//trigger custom event
			self.object.trigger("window", [this, event]);
			
			return;
		}
		
		//find the popup's object, or create it if it doesn't exist
		this.object = $("#" + id);
		if (this.object.length <= 0)
		{
			this.object = $("<div class='popup_window'></div>");
			this.object.attr("id", id);
		}
		
		this.object.addClass("popup_window");
		this.object.css("display", "none");
		this.object.css("position", "absolute")
		this.object.css("z-index", 0);
		
		//create a content object for the popup
		this.content_object = $("<div class='popup_content'></div>");
		this.content_object.html(this.object.html());
		this.object.empty().append(this.content_object);
		
		//set the object's parent from options
		var parent = $(options['parent'] || 'body');
		if (parent.is(this.object.parent()) != true) parent.append(this.object.detach());
		
		//set the object's style from options
		if (typeof options['style'] == "object")
		{
			var object = this.object;
			$.each(options['style'], function(key, value) {
				object.css(key, value);
			});
		}
		
		//set content from options
		if (options['content'] != null) this.content(options['content']);
		
		//load content from url in options
		if (options['url'] != null) this.load(options['url'], options['parameters']);
		
		//set centering options
		this.center_options(options['center']);
		
		//set template from options
		this.template(options['template']);
		
		//set loading message from options
		this.loading(options['loading']);
		
		//set background from options
		this.background(options['background']);
	}

	function popup() {
		this.popups = {};
		this.z_index = 1000;
		
		//default options for all popups
		this.options = {};
		this.options['parent'] = null; //defaults to the document's body
		this.options['url'] = null;
		this.options['parameters'] = null;
		this.options['reload'] = false;
		this.options['template'] = null;
		this.options['loading'] = null; //true enables a default loading message
		this.options['background'] = null; //true will enable the default background
		this.options['center'] = true;
		this.options['drag'] = true;
		this.options['style'] = {};
		
		
		this.create = function(id, options) {
			//don't create popups until the document is ready
			if (document.readyState != "complete" && document.readyState != "interactive")
				throw("Cannot create popup until the document is ready.");
		
			//merge the instance options with the default options
			options = $.extend({}, this.options, options);
			
			//create a new popup instance
			if (this.popups[id] == null)
			{
				var popup = new popup_instance(this, id, options);
				this.popups[id] = popup;
			}
			else
			{
				throw "Popup id \"" + id + "\" already exists.";
			}
			
			//trigger custom event
			popup.object.trigger("create", [popup]);
			
			return popup;
		}
		
		this.destroy = function(id) {
			//get the popup object
			var popup = this.popups[id];
			if (popup == null) throw "Popup id \"" + id + "\" not found.";
			
			//trigger custom event
			popup.object.trigger("destroy", [popup]);
			
			//remove popup from DOM
			popup.object.remove();
			if (popup.background != null) popup.background.remove();
			
			//remove popup object from index
			this.popups[id] = null;
			
			return id;
		}
		
		this.open = function(id) {
			//get the popup object
			var popup = this.popups[id];
			if (popup == null) throw "Popup id \"" + id + "\" not found.";
			return popup.open();
		}
		
		this.close = function(id) {
			//get the popup object and background
			var popup = this.popups[id];
			if (popup == null) throw "Popup id \"" + id + "\" not found.";
			return popup.close();
		}
		
		this.toggle = function(id) {
			//get the popup object
			var popup = this.popups[id];
			if (popup == null) throw "Popup id \"" + id + "\" not found.";
			return popup.toggle();
		}
		
		this.focus = function(id) {
			//get the popup object
			var popup = this.popups[id];
			if (popup == null) return;
			
			//skip focusing if the popup is already focused
			if (parseInt(popup.object.css("z-index")) >= this.z_index) return;
			
			//focus the popup
			this.z_index += 2;
			if (popup.background_object != null) popup.background_object.css("z-index", this.z_index - 1);
			popup.object.css("z-index", this.z_index);
			
			return popup;
		}
		
		this.current = function(element) {
			//use value of "this" as element if no element is passed
			if (element == null) element = this;
		
			//find the first parent element in the DOM tree with the popup window class
			element = $(element).closest(".popup_window");
			
			//return the popup window instance for the element
			return this.popups[element.attr('id')];
		}
		
		//set or check default template for popups
		this.template = function(object) {
			if (object == null) return this.options['template'];
			return this.options['template'] = object;
		}
		
		//set or check default content for loading popups
		this.loading = function(object) {
			if (object == null) return this.options['loading'];
			return this.options['loading'] = object;
		}
		
		//set or check default background for popups
		this.background = function(object) {
			if (object == null) return this.options['background'];
			return this.options['background'] = object;
		}
	}

	//add the popup function to jQuery
  $.popup = new popup();
	
	//add popup function to elements
	$.fn.popup = function() {
		return $.popup.popups[this.attr('id')];
	};
	
	//backwards compatability mode warning
	if (document.compatMode == "BackCompat")
	{
		console.log("Warning: Backwards compatibility mode is enabled. Backwards compatibility mode is not compatible with certain features of the Popup library. Please disable it by including a \"doctype\" declaration at the beginning of your html file.")
	}
})(jQuery);

$().ready(function() {
	//trigger a custom event when the window's zoom level is changed
	(function () {
		var zoom_level = $("body").css("zoom");
    var zoom_event_trigger = function() {
			if(zoom_level != $("body").css("zoom"))
			{
				zoom_level = $("body").css("zoom");
				$(window).trigger("zoom", [zoom_level]);
			}
		}
    setInterval(zoom_event_trigger, 16);
	})();
});