/*
	Popup 1.1.0
	Written by: An0Hit0
	Liscence: http://www.opensource.org/licenses/mit-license.php
*/

(function($) {
	
	function popup_instance(owner, id, options) {
		this.owner = owner;
		this.id = id;
		this.options = options || {};
		this.url = null;
		this.parameters = null;
		this.object = null;
		this.parent = null;
		this.object = null;
		this.background = null;
		this.template = null;
		this.loading = null;
		this.loaded = false;
		this.opened = false;
		this.ajax = null;
		this.drag = {};
		
		//detect ios
		this.ios = false;
		if(['iPad', 'iPhone', 'iPod'].indexOf(navigator.platform) >= 0) this.ios = true;
		
		//center modal popups by default
		if (this.options['modal'] == true && this.options['center'] == null) this.options['center'] = true;
		
		//give modal popups a background by default
		if (this.options['modal'] == true && this.options['background'] == null) this.options['background'] = true;
		
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
		
		//load the background
		if(this.options['background'] == true)
		{
			this.background = $("<div class='popup_background'></div>");
			this.background.css("background-color", "#000");
			this.background.css("opacity", 0.5);
		}
		else if(typeof this.options['background'] == 'number')
		{
			var opacity = this.options['background'];
			this.background = $("<div class='popup_background'></div>");
			this.background.css("background-color", "#000");
			this.background.css("opacity", opacity);
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
			if (this.loaded != true || this.ajax != null || options['reload'] == true)
			{
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
			
			//display the background if it is enabled
			if (this.background != null) {
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
			//initalize variables
			parameters = parameters || {};
			this.url = url;
			this.parameters = parameters;
			
			//set up the template
			if (this.template != null)
				this.object.html(this.template.html());
			else
				this.object.html("<div class='popup_content'></div>");
		
			//set up the loading window
			if (this.loading != null)
			{
				this.object.find(".popup_content").html("<div class='popup_loading'></div>");
				this.object.find(".popup_loading").html(this.loading.html());
				this.object.data("loading", true);
			}
			
			//cancel any previous ajax request
			var ajax = this.ajax;
			if(ajax != null) ajax.abort();
			
			//get content via ajax
			var popup = this;
			this.ajax = $.ajax({
				url: url,
				data: parameters,
				success: function(data)
				{
					//sent the new content
					popup.object.find(".popup_content").html(data);
					
					//set loading as completed
					popup.ajax = null;
					
					//get the popup ready to be displayed
					popup.init();
					popup.bind();
				},
				error: function(xhr, ajaxOptions, thrownError)
				{
					//ignore abort errors
					if(xhr.statusText == "abort") return;
				
					//show the error message
					popup.object.find(".popup_content").html("<div class='popup_error'></div><div align='center'><button class='popup_close'>Close</button></div>");
					popup.object.find(".popup_error").html("Error: " + xhr.status + " " + xhr.statusText);
					
					//get the popup ready to be displayed
					popup.init();
					popup.bind();
				}
			});
			
			//show the loading window
			if (this.loading != null)
			{
				this.init();
				this.bind();
			}
		}
		
		//reload the current url in the popup window
		this.reload = function() {
			return this.load(this.url, this.parameters);
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
			var document_height = $(document).height();
			var document_width = $(document).width();
			var height = this.object.outerHeight(true);
			var width;
			var top;
			var bottom;
			var left;
			var right;
			
			//calculate zoom
			var zoom = 1.0;
			if(this.ios == true) zoom = document.documentElement.clientWidth / window.innerWidth;
			
			//fix width
			if(this.ajax != null) //popup still loading
				this.object.css("width", "auto");
			else //popup loaded
				this.object.css("width", "100%");
			width = this.object.outerWidth(true);
			
			if(width > window_width / zoom)
			{
				this.object.css("width", window_width / zoom);
				width = this.object.outerWidth(true);
			}
			
			//calculate top position
			if(height < window_height / zoom)
			{
				top = scroll_top + (window_height / zoom - height) / 2;
			}
			//allow scrolling if the popup is larger than the window height
			else
			{
				top = this.object.position().top;
				bottom = top + height;
				
				if (top > scroll_top)
					top = scroll_top;
				else if (bottom < scroll_top + (window_height / zoom))
					top = scroll_top + (window_height / zoom) - height;
			}
			
			//calculate left position
			if(width < window_width / zoom)
			{
				left = scroll_left + (window_width / zoom - width) / 2;
			}
			//allow scrolling if the popup is larger than the window width
			else
			{
				left = this.object.position().left;
				right = left + width;
				
				if (left > scroll_left)
					left = scroll_left;
				else if (right < scroll_left + (window_width / zoom))
					left = scroll_left + (window_width / zoom) - width;
			}
			
			//set position by css
			this.object.css("top", top < 0 ? 0 : top);
			this.object.css("left", left < 0 ? 0 : left);
			
			//fix document expansion
			if ($(document).width() > document_width)
				this.object.css("left", left - ($(document).width() - document_width));
			if ($(document).height() > document_height)
				this.object.css("top", top - ($(document).height() - document_height));
			
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
		
		this.get = function(id) {
			return popups[id];
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
		
		//set or check default background for popups
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