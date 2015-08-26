/*
	Popup 1.0.0
	Written by: An0Hit0
	Liscence: http://www.opensource.org/licenses/mit-license.php
*/

(function($) {
	
	function popup_instance(owner, id, options) {
		this.owner = owner;
		this.id = id;
		this.options = options || {};
		this.object = null;
		this.parent = null;
		this.object = null;
		this.background = null;
		this.template = null;
		this.loading = null;
		this.loaded = false;
		this.opened = false;
		this.drag = {};

		//detect whether zoomfix is needed
		this.zoomfix = false;
		if(navigator.userAgent.match(/(OPR\/)/) != null) this.zoomfix = true;
		
		//center modal popups by default
		if (this.options['modal'] == true && this.options['center'] == null)
		{
			this.options['center'] = true;
		}
		
		//find the popup object, or create it if it doesn't exist
		this.object = $("#" + id).first();
		if (this.object.length > 0)
		{
			if (this.options['parent'] != null) this.parent = this.options['parent'];
			else this.parent = this.object.parent();
			this.object.detach();
		}
		else
		{
			this.object = $("<div class='popup_window'></div>");
			this.object.attr("id", id);
			this.parent = this.options['parent'] || $("body");
		}
		
		this.object.css("display", "none");
		this.object.css("z-index", 0);
		this.object.css("position", "absolute")
		this.object.css("pointer-events", "auto");
		this.parent.append(this.object);
		
		//load the template
		this.template = $(this.options['template']).first();
		if (this.template.length > 0)
		{
			this.template.css("display", "none");
		}
		else
		{
			this.template = null;
		}
		
		//load the loading message
		this.loading = $(this.options['loading']).first();
		if (this.loading.length > 0)
		{
			this.loading.css("display", "none");
		}
		else
		{
			this.loading = null;
		}
		
		//load the background (only for modal popups)
		if(this.options['background'] == true)
		{
			this.background = $("<div class='popup_background'></div>");
		}
		else if(this.options['background'] != null)
		{
			this.background = $(this.options['background']).first();
			this.background.detach();
		}
		else
		{
			this.background = null;
		}
		
		if (this.background != null)
		{
			this.background.attr("id", id + "_background");
			this.background.css("display", "none");
			this.background.css("z-index", 0);
			this.background.css("position", "absolute")
			this.background.css("pointer-events", "auto");
			this.parent.append(this.background);
		}
		
		//open the popup
		this.open = function(options) {
			//set the popup status to open, return if it is already set
			if (this.opened == true) return;
			this.opened = true;

			//merge options into the default options
			options = $.extend({}, this.options, options);
			
			//load popup content
			if (this.loaded != true || options['reload'] == true) {
				//load content from url
				if (options['url'] != null)
				{
					this.load(options['url'], options['parameters']);
				}
				//get the content from the content option
				else if (options['content'] != null)
				{
					this.content(options['content']);
				}
				//if all else fails, just display the popup div as is...
				else
				{
					this.init();
					this.bind();
				}
				//set the popup loaded value to true in all cases
				this.loaded = true;
			}
			//if the content is already loaded, get the window ready and display it
			else
			{
				this.init();
				this.bind();
			}
			
			return this;
		}
		
		//close the popup
		this.close = function() {
			//set the popup status to closed, return if it is already set
			if (this.opened != true) return;
			this.opened = false;
		
			//remove event listeners from popup content
			this.unbind;
		
			//hide the popup
			this.object.css("display", "none");
			
			//hide the background
			if (this.background != null) this.background.css("display", "none");
			
			return this;
		}
		
		this.toggle = function(options) {
			if (this.opened != true) this.open(options);
			else this.close();
		}
		
		this.focus = function() {
			return this.owner.focus(this.id);
		}
		
		//called when a popup is opened to get it ready for display
		this.init = function() {
			//set popup dimensions
			this.object.css("width", this.options['width'] || "auto");
			this.object.css("height", this.options['height'] || "auto");
		
			//set popup position
			if(this.options['center'] == true || this.options['center_open'] == true || this.options['center_once'] == true)
			{
				//center the popup to the window
				this.center();
				//set center_once option to false once the window has been centered
				this.options['center_once'] = false;
			}
			else
			{
				//manually set popup position
				this.object.css("left", this.options['left']);
				this.object.css("top", this.options['top']);
				this.object.css("transform", this.options['transform'] || this.object.css("transform"));
			}
			
			//display the background if the popup is modal
			if (options['modal'] == true && this.background != null) {
				this.background.css("width", "100%");
				this.background.css("height", "100%");
				this.background.css("top", "0%");
				this.background.css("left", "0%");
				this.background.css("position", "fixed");
				this.background.css("display", "block");
			}
			
			//display the popup
			this.object.css("display", "block");
			this.focus();
			
			return this;
		}
		
		//load a new url in the popup window
		this.load = function(url, parameters) {
			parameters = parameters || {};
			
			//set up the template
			if (this.template != null)
				this.object.html(this.template.html());
			else
				this.object.html("<div class='popup_content'></div>");
		
			//display loading message until popup is loaded
			if (this.loading != null)
			{
				this.object.find(".popup_content").html("<div class='popup_loading'></div>");
				this.object.find(".popup_loading").html(this.loading.html());
			}
			
			//get content via ajax
			var popup = this;
			$.ajax({
				url: url,
				data: parameters,
				success: function(data)
				{
					//sent the new content
					popup.object.find(".popup_content").html(data);
					
					//get the popup ready to be displayed
					popup.init();
					popup.bind();
				},
				error: function(xhr, ajaxOptions, thrownError)
				{
					//show the error message
					popup.object.find(".popup_content").html("<div class='popup_error'></div><div align='center'><button class='popup_close'>Close</button></div>");
					popup.object.find(".popup_error").html("Error: " + xhr.status + " " + xhr.statusText);
					
					//get the popup ready to be displayed
					popup.init();
					popup.bind();
				}
			});
		}
		
		//get or set current content of popup window
		this.content = function(content) {
			//just return the current content if no new content is specified
			if (content == null) return this.object.html();
			
			//set up the template
			if (this.template != null)
				this.object.html(template.html());
			else
				this.object.html("<div class='popup_content'></div>");
			
			//set the new content
			this.object.find(".popup_content").html(content);
			
			//get the popup ready to be displayed
			this.init();
			this.bind();
			
			return new_content;
		}
		
		this.center = function() {
			var scroll_top = $(window).scrollTop();
			var scroll_left = $(window).scrollLeft();
			var window_height = $(window).height();
			var window_width = $(window).width();
			var height = this.object.outerHeight(true);
			var width = this.object.outerWidth(true);
			var top;
			var bottom;
			var left;
			var right;
			var translate_y = "0%";
			var translate_x = "0%";
			var zoom = 1.0;
			//fix a bug in certain browsers when zooming is enabled
			if(this.zoomfix == true) zoom = document.body.style.zoom;
			
			//calculate window position
			if (height * zoom < window_height)
			{
				//simple centering when the popup fits in the window height
				top = (scroll_top - parseInt(this.object.css("margin-top"))) / window_height;
				top = 50 + top * 100 + "%";
				translate_y = "-50%";
			}
			else
			{
				//center popup while allowing for scrolling if the popup is bigger than the window height
				top = this.object.position().top;
				bottom = top + height;
				translate_y = "0%";
				
				//if popup is past the top edge of the window, align it with the window's edge
				if (top > scroll_top || top < -0.5)
				{
					top = scroll_top / window_height;
					if (top < 0) top = 0;
					top = top * 100 + "%";
				}
				//if popup is past the bottom edge of the window, align it with the window's edge
				else if (bottom < scroll_top + window_height / zoom)
				{
					top = (scroll_top + (window_height - height * zoom)) / window_height;
					if (top < 0) top = 0;
					top = top * 100 + "%";
				}
				//leave the popup where it is
				else
				{
					top = null;
				}
			}
			
			if (width * zoom < window_width)
			{
				//simple centering when the popup fits in the window width
				left = (scroll_left - parseInt(this.object.css("margin-left"))) / window_width;
				left = 50 + left * 100 + "%";
				translate_x = "-50%";
			}
			else
			{
				//center popup while allowing for scrolling if the popup is bigger than the window width
				left = this.object.position().left;
				right = left + width;
				translate_x = "0%";
				
				//if popup is past the left edge of the window, align it with the window's edge
				if (left > scroll_left || left < -0.5)
				{
					left = scroll_left / window_width;
					if (left < 0) left = 0;
					left = left * 100 + "%";
				}
				//if popup is past the right edge of the window, align it with the window's edge
				else if (right < scroll_left + window_width / zoom)
				{
					left = (scroll_left + (window_width - width * zoom)) / window_width;
					if (left < 0) left = 0;
					left = left * 100 + "%";
				}
				//leave the popup where it is
				else
				{
					left = null;
				}
			}
			
			//center popup to window with css
			if (top != null) this.object.css("top", top);
			if (left != null) this.object.css("left", left);
			this.object.css("transform", "translate(" + translate_x + ", " + translate_y + ")");
			
			return this;
		}
		
		//bind objects in the popup window with their appropriate event handlers
		this.bind = function() {
			this.object.bind("mousedown", {self: this}, this.focus_click);
			this.object.find(".popup_close").bind("click", {self: this}, this.close_click);
			if (this.background != null) this.background.bind("click", {self: this}, this.close_click);
			this.object.find(".popup_drag").css("cursor", "move");
			this.object.find(".popup_drag").bind("mousedown", {self: this}, this.drag_mouse_down);
			this.object.bind("DOMNodeInserted DOMNodeRemoved", {self: this}, this.center_event);
			return this;
		}
		
		//remove event handler bindings from popup window
		this.unbind = function() {
			this.object.unbind("mousedown", this.focus_click);
			this.object.find(".popup_close").unbind("click", this.close_click);
			if (this.background != null) this.background.unbind("click", this.close_click);
			this.object.find(".popup_drag").unbind("mousedown", this.drag_mouse_down);
			this.object.unbind("DOMNodeInserted DOMNodeRemoved", this.center_event);
			return this;
		}
		
		this.focus_click = function(event) {
			var self = event.data.self;
			return self.focus();
		}
		
		this.close_click = function(event) {
			var self = event.data.self;
			return self.close();
		}
		
		this.drag_mouse_down = function(event) {
			var self = event.data.self;
			
			//don't allow dragging when centering is enabled
			if (self.options['center'] == true) return;
			
			//keep track of the window's starting position
			position = self.object.position();
			self.drag.x = position.left;
			self.drag.y = position.top;
			
			//set the position offset for dragging based on where the mouse click occured
			self.drag.x_offset = event.pageX;
			self.drag.y_offset = event.pageY;
			
			//fix a bug in certain browsers when zooming is enabled
			if(this.zoomfix == true)
			{
				self.drag.x_offset = self.drag.x_offset / document.body.style.zoom;
				self.drag.y_offset = self.drag.y_offset / document.body.style.zoom;
			}
			
			//bind event listeners
			self.parent.mousemove({self: self}, self.drag_mouse_move);
			self.parent.mouseup({self: self}, self.drag_mouse_up);
			
			return;
		}
		
		this.drag_mouse_move = function(event) {
			var self = event.data.self;
			
			//find the event position
			x = event.pageX;
			y = event.pageY;
			
			//fix a bug in certain browsers when zooming is enabled
			if(this.zoomfix == true)
			{
				x = x / document.body.style.zoom;
				y = y / document.body.style.zoom;
			}
			
			//find the new position
			x = self.drag.x - (self.drag.x_offset - x);
			y = self.drag.y - (self.drag.y_offset - y);
			
			//move the popup object
			self.object.css("left", x + "px");
			self.object.css("top", y + "px");
			
			//save the new position
			self.options['left'] = x + "px";
			self.options['top'] = y + "px";
			
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
			if(self.options['center'] == true) self.center();
			return;
		}
	}

	function popup() {
		
		var self = this;
		var popups = {};
		this.popups = popups;
		var z_index = 1000;
		this.z_index = z_index;
		
		var default_options = {};
		default_options['parent'] = null; //defaults to the document's body
		default_options['reload'] = false;
		default_options['template'] = null;
		default_options['loading'] = "<div>Loading...</div>";
		default_options['background'] = true; //true will enable the default background
		default_options['center'] = null; //defaults to false for non-modal windows and true for modal windows
		default_options['center_open'] = false;
		default_options['center_once'] = false;
		default_options['width'] = null; //defaults to "auto"
		default_options['height'] = null; //defaults to "auto"
		default_options['left'] = "0px";
		default_options['top'] = "0px";
		default_options['transform'] = null;
		
		
		this.create = function(id, options) {
			//wait to create popups until the document is ready
			$(document).ready(function() {
				//merge the options into the default options
				if (options != null) options = $.extend({}, default_options, options);
				
				//create a new popup instance
				if (popups[id] == null)
				{
					var popup = new popup_instance(self, id, options);
					popups[id] = popup;
				}
				else
				{
					throw "Popup id \"" + id + "\" already exists.";
				}
			});
			
			return popups[id];
		}
		
		this.destroy = function(id, options) {
			//get the popup object
			var popup = popups[id];
			if (popup == null) throw "Popup id \"" + id + "\" not found.";
			
			//remove popup from DOM
			popup.object.remove();
			if (popup.background != null) popup.background.remove();
			
			//remove popup object from index
			popups[id] = null;
			
			return id;
		}
		
		this.open = function(id, options) {
			//get the popup object
			var popup = popups[id];
			if (popup == null) throw "Popup id \"" + id + "\" not found.";
			return popup.open(options);
		}
		
		this.close = function(id) {
			//get the popup object and background
			var popup = popups[id];
			if (popup == null) throw "Popup id \"" + id + "\" not found.";
			return popup.close();
		}
		
		this.toggle = function(id, options) {
			//get the popup object
			var popup = popups[id];
			if (popup == null) throw "Popup id \"" + id + "\" not found.";
			return popup.toggle(options);
		}
		
		this.focus = function(id) {
			//get the popup object
			var popup = popups[id];
			if (popup == null) return;
			
			//skip focusing if the popup is already focused
			if (parseInt(popup.object.css("z-index")) >= z_index) return;
			
			//focus the popup
			if (popup.background != null) popup.background.css("z-index", ++z_index);
			popup.object.css("z-index", ++z_index);
			
			return popup;
		}
		
		this.current = function(element) {
			//use value of "this" as element if no element is passed
			if (element == null) element = this;
		
			//find the first parent element in the DOM tree with the popup window class
			element = $(element).closest(".popup_window");
			
			//return the popup window instance for the element
			return popups[element.attr('id')];
		}
		
		//set or check default template for popups
		this.template = function(object) {
			if (object == null) return default_options['template'];
			return default_options['template'] = object;
		}
		
		//set or check default content for loading popups
		this.loading = function(object) {
			if (object == null) return default_options['loading'];
			return default_options['loading'] = object;
		}
		
		//set or check default background for modal popups
		this.background = function(object) {
			if (object == null) return default_options['background'];
			return default_options['background'] = object;
		}
		
		//set or check options for popup
		this.options = function(id, options) {
			var popup = popups[id];
			if (popup == null) return {};
			return $.extend(popup.options, options);
		}
		
		//set or check default options for newly created popups
		this.default_options = function(options) {
			return $.extend(default_options, options);
		}
		
		//keep popups centered if window is scrolled or resized
		var center_event = function() {
			var popups = $.popup.popups;
			$.each(popups, function(key, popup) {
				if (popup.opened == true && popup.options['center'] == true)
					popup.center();
			});
			return;
		};
		$(window).bind("scroll resize", center_event);
	}

	//add the popup function to jQuery
  $.popup = new popup();
	
	//add popup function to elements
	$.fn.popup = function() {
		return $.popup.current(this);
	};
})(jQuery);