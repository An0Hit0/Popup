/*
	jquery.popup 1.2.0
	Written by: Miyuki333
	Licence: http://www.opensource.org/licenses/mit-license.php
*/

(function($) {
	
	function popup_instance(owner, id, options) {

		this.initialize = function(owner, id, options)
		{
			this.owner = owner;
			this.id = id;
			this.options = options || {};
			this.url = null;
			this.parameters = null;
			this.object = null;
			this.parent = null;
			this.background_object = null;
			this.template = null;
			this.loading = null;
			this.loaded = false;
			this.opened = false;
			this.ajax = null; //current ajax request
			this.drag = {};

			//set window parent
			this.parent = (options['parent'] && $(options['parent'])) || $('body');
	
			//center modal popups by default
			if (this.options['modal'] == true && this.options['center'] == null) this.options['center'] = true;
	
			//give modal popups a background by default
			if (this.options['modal'] == true && this.options['background'] == null) this.options['background'] = true;
			
			//initialize the template
			this.template = $(this.options['template']).first();
			if (this.template.length > 0)
			{
				this.template.css("display", "none");
			}
			else
			{
				this.template = null;
			}
			
			//initialize the loading message
			this.loading = $(this.options['loading']).first();
			if (this.loading.length > 0)
			{
				this.loading.css("display", "none");
			}
			else
			{
				this.loading = null;
			}
	
			//initialize the background
			this.background(this.options['background'], {
				parent: this.options['background_parent'],
				close: this.options['background_close'],
				opacity: this.options['background_opacity'],
			});
	
			//remove leading "#" from id string
			id = id.replace(/^\#/, '');
			
			//find the popup object, or create it if it doesn't exist
			this.object = $("#" + id).first();
			if (this.object.length > 0)
			{
				this.object.detach();
				
				//set up the template
				if (this.template != null)
				{
					this.object.removeClass("popup_window");
					var content = this.object.html();
					this.object.html(this.template.html());
					this.object.find(".popup_content").html(content);
				}
				
				this.object.addClass("popup_window");
			}
			else
			{
				this.object = $("<div class='popup_window'></div>");
				this.object.attr("id", id);
			}
			
			this.object.css("display", "none");
			this.object.css("z-index", 0);
			this.object.css("position", "absolute")
			this.object.css("pointer-events", "auto");
			this.parent.append(this.object);

			return this;
		}
		
		//open the popup
		this.open = function(options) {
			//set the popup status to open, return if it is already set
			if (this.opened == true) return;
			this.opened = true;

			//merge options into the default options
			options = $.extend({}, this.owner.options, this.options, options);
			
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
					options['content'] = null;
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
			
			//trigger event
			this.object.trigger("open", [this]);
			
			return this;
		}
		
		//close the popup
		this.close = function() {
			//set the popup status to closed, return if it is already set
			if (this.opened != true) return;
			this.opened = false;
		
			//remove event listeners from popup content
			this.unbind();
		
			//hide the popup
			this.object.css("display", "none");
			
			//hide the background
			if (this.background_object != null) this.background_object.css("display", "none");

			//trigger event
			this.object.trigger("close", [this]);
			
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
			if (this.background_object != null) {
				this.background_object.css("width", "100%");
				this.background_object.css("height", "100%");
				this.background_object.css("top", "0%");
				this.background_object.css("left", "0%");
				this.background_object.css("position", "fixed");
				this.background_object.css("display", "block");
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
				
				this.init();
				this.bind();
			}
			
			//cancel any previous ajax request
			var ajax = this.ajax;
			if(ajax != null) ajax.abort();
			
			//get content via ajax
			var popup = this;
			var owner = this.owner;
			this.ajax = $.ajax({
				url: url,
				data: parameters,
				success: function(data)
				{
					//clear the popup ready queue
					owner.ready_queue = [];

					//sent the new content
					popup.object.find(".popup_content").html(data);
					
					//set loading as completed
					popup.ajax = null;
					
					//get the popup ready to be displayed
					popup.init();
					popup.bind();

					//call the ready queue
					$.each(owner.ready_queue, function(i, callback) {
						callback(popup);
					});
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
			
			return this;
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
			{
				this.object.html(this.template.html());
			}
			else
			{
				this.object.html("<div class='popup_content'></div>");
			}
			
			//set the new content
			this.object.find(".popup_content").html(content);
			
			//get the popup ready to be displayed
			this.init();
			this.bind();
			
			return content;
		}

		this.background = function(background, options) {
			options = options || {};
			var parent = (options['parent'] && $(options['parent'])) || this.parent || $('body');
			var close = options['close'] == true;
			var opacity = options['opacity'] || 0.333;

			if(background == true)
			{
				background = $("<div class='popup_background'></div>");
				background.css("background-color", "#000");
				background.css("opacity", opacity);
			}
			else if(typeof background == 'number')
			{
				opacity = background;
				background = $("<div class='popup_background'></div>");
				background.css("background-color", "#000");
				background.css("opacity", opacity);
			}
			else if(background != null)
			{
				background = $(background).first();
				background.detach();
			}
			
			if (background != null)
			{
				background.attr("id", this.id + "_background");
				background.css("display", "none");
				background.css("z-index", 0);
				background.css("position", "absolute")
				background.css("pointer-events", "auto");
				if(options['opacity'] != null) background.css("opacity", opacity);
				if (close == true) background.addClass("popup_close");
				parent.append(background);
			}
			
			//hide the old background
			if(this.background_object != null) this.background_object.css("display", "none");

			//set the new background]
			this.background_object = background;

			//reinitialize the popup
			if (this.opened == true)
			{
				this.init();
				this.bind();
			}

			return background;
		}
		
		this.center = function() {
			var scroll_top = $(window).scrollTop();
			var scroll_left = $(window).scrollLeft();
			var window_height = $(window).height();
			var window_width = $(window).width();
			var document_height = $(document).height();
			var document_width = $(document).width();
			var height = this.object.outerHeight(true);
			var width = this.object.outerWidth(true);
			var last_top = this.object.position().top;
			var last_left = this.object.position().left;
			var top;
			var bottom;
			var left;
			var right;
			
			//calculate zoom
			var zoom = 1.0;
			if(this.owner.ios == true) zoom = document.documentElement.clientWidth / window.innerWidth;
			
			//initalize top and left
			this.object.css("left", 0);
			this.object.css("top", 0);
			
			//calculate top position
			if (height <= window_height / zoom)
			{
				top = scroll_top + (window_height / zoom - height) / 2;
			}
			//allow scrolling if the popup is larger than the window height
			else
			{
				top = last_top;
				bottom = top + height;
				
				if (top > scroll_top)
					top = scroll_top;
				else if (bottom < scroll_top + (window_height / zoom))
					top = scroll_top + (window_height / zoom) - height;
			}
			
			//calculate left position
			if (width <= window_width / zoom)
			{
				left = scroll_left + (window_width / zoom - width) / 2;
			}
			//allow scrolling if the popup is larger than the window width
			else
			{
				left = last_left;
				right = left + width;
				
				if (left > scroll_left)
					left = scroll_left;
				else if (right < scroll_left + (window_width / zoom))
					left = scroll_left + (window_width / zoom) - width;
			}
			
			//fix left for automatic width popups
			if (this.width == "auto" && left + width > window_width)
			{
				left = window_width - width;
			}
			
			//set position by css
			this.object.css("top", top < 0 ? 0 : top);
			this.object.css("left", left < 0 ? 0 : left);
			
			//fix document expansion
			if ($(document).height() > document_height)
			{
				top = top - ($(document).height() - document_height);
				this.object.css("top", top < 0 ? 0 : top);
			}
			if ($(document).width() > document_width)
			{
				left = left - ($(document).width() - document_width);
				this.object.css("left", left < 0 ? 0 : left);
			}
			
			return this;
		}
		
		//bind objects in the popup window with their appropriate event handlers
		this.bind = function() {
			this.object.bind("mousedown", {self: this}, this.focus_click);
			this.object.find(".popup_close").bind("click", {self: this}, this.close_click);
			if ($(this.background_object).hasClass("popup_close")) this.background_object.bind("click", {self: this}, this.close_click);
			this.object.find(".popup_drag").css("cursor", "move");
			this.object.find(".popup_drag").bind("mousedown", {self: this}, this.drag_mouse_down);
			this.object.bind("DOMNodeInserted DOMNodeRemoved", {self: this}, this.center_event);
			return this;
		}
		
		//remove event handler bindings from popup window
		this.unbind = function() {
			this.object.unbind("mousedown", this.focus_click);
			this.object.find(".popup_close").unbind("click", this.close_click);
			if (this.background_object != null) this.background_object.unbind("click", this.close_click);
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

		//call initialize method
		this.initialize(owner, id, options);
	}

	function popup() {

		this.initialize = function()
		{
			this.popups = {};
			this.z_index = 9001;
			this.options = {};

			//detect ios
			this.ios = ['iPad', 'iPhone', 'iPod'].indexOf(navigator.platform) >= 0;
			
			//detect mobile devices
			this.mobile = (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
			
			//set default options for popups
			this.options['reload'] = false;
			this.options['template'] = null;
			this.options['loading'] = "<div>Loading...</div>";
			this.options['background'] = true; //true will enable the default background
			this.options['background_close'] = true; //close window on background click by default
			this.options['center'] = null; //defaults to false for non-modal windows and true for modal windows
			this.options['center_open'] = false;
			this.options['center_once'] = false;
			this.options['width'] = null; //defaults to "auto"
			this.options['height'] = null; //defaults to "auto"
			this.options['left'] = "0px";
			this.options['top'] = "0px";
			this.options['transform'] = null;
		}
		
		this.create = function(id, options) {
			//merge the options into the default options
			options = $.extend({}, this.options, options || {});

			//remove leading "#" from id string
			id = id.replace(/^\#/, '');
			
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
			
			return this.popups[id];
		}
		
		this.destroy = function(id, options) {
			//remove leading "#" from id string
			id = id.replace(/^\#/, '');

			//get the popup object
			var popup = this.popups[id];
			if (popup == null) throw "Popup id \"" + id + "\" not found.";
			
			//remove popup from DOM
			popup.close();
			popup.object.remove();

			//remove background from DOM if the option is set
			if (popup.background_object != null && options['background' == true])
			{
				popup.background_object.remove();
			}
			
			//remove popup object from index
			this.popups[id] = null;
			
			return id;
		}
		
		this.get = function(id) {
			//remove leading "#" from id string
			id = id.replace(/^\#/, '');

			return this.popups[id];
		}
		
		this.open = function(id, options) {
			//remove leading "#" from id string
			id = id.replace(/^\#/, '');

			//get the popup object
			var popup = this.popups[id];
			if (popup == null) throw "Popup id \"" + id + "\" not found.";
			return popup.open(options);
		}
		
		this.close = function(id) {
			//remove leading "#" from id string
			id = id.replace(/^\#/, '');

			//get the popup object and background
			var popup = this.popups[id];
			if (popup == null) throw "Popup id \"" + id + "\" not found.";
			return popup.close();
		}
		
		this.toggle = function(id, options) {
			//remove leading "#" from id string
			id = id.replace(/^\#/, '');

			//get the popup object
			var popup = popups[id];
			if (popup == null) throw "Popup id \"" + id + "\" not found.";
			return popup.toggle(options);
		}
		
		this.focus = function(id) {
			//remove leading "#" from id string
			id = id.replace(/^\#/, '');

			//get the popup object
			var popup = this.popups[id];
			if (popup == null) return;

			//get the z-index
			var background_z_index = popup.options['background_z-index'] || popup.options['background_z_index'];
			var z_index = popup.options['z-index'] || popup.options['z_index'];
			if (background_z_index == null) background_z_index = z_index;
			if(background_z_index == null) background_z_index = ++(this.z_index);
			if(z_index == null) z_index = ++(this.z_index);
				
			//focus the popup
			if (popup.background_object != null) popup.background_object.css("z-index", background_z_index);
			popup.object.css("z-index", z_index);
			
			return popup;
		}
		
		//get the currently focused popup
		this.focused = function() {
			var result = null;
			var max = 0;
			$.each(this.popups, function(id, popup) {
				var index = parseInt(popup.object.css("z-index"));
				if(popup.opened && index > max)
				{
					max = index;
					result = popup;
				}
			});
			return result;
		}

		//register a ready callback for the popup
		//note that this will only function for popups loaded by ajax
		this.ready_queue = [];
		this.ready = function(callback) {
			this.ready_queue.push(callback);
			return;
		}
		
		//get the current popup window. usually require you to pass "this" as the parameter.
		//mainly used for scripts executed inside the context of a popup window
		//for other cases, use the "focused" method
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
		this.background = function(object, options) {
			options = options || {};
			this.options['background_parent'] = (options['parent'] && $(options['parent']));
			this.options['background_close'] = options['close'];
			this.options['background_opacity'] = options['opacity'];

			return this.options['background'] = object;
		}
		
		//set or check options for popup
		this.options = function(id, options) {
			//remove leading "#" from id string
			id = id.replace(/^\#/, '');

			var popup = this.popups[id];
			if (popup == null) return {};
			return popup.options;
		}
		
		//extend default options for newly created popups
		this.extend_options = function(options) {
			options = options || {};
			return $.extend(this.options, options);
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

		//call initialize method
		this.initialize();
	}

	//add the popup function to jQuery
	$.popup = new popup();
	
	//add popup function to elements
	$.fn.popup = function() {
		return $.popup.current(this);
	};
})(jQuery);

//handle focusing of text elements on mobile devices
$(document).on('ready change DOMNodeInserted', function() {
	$('input, textarea').on('focus', function() {
		if($.popup.mobile != true) return;
		var popup = $.popup.current(this);
		if (popup == null) return;
		if(popup.options['center'] == true)
			popup.options['center'] = "input";
	});
	
	$('input, textarea').on('blur', function() {
		if($.popup.mobile != true) return;
		var popup = $.popup.current(this);
		if (popup == null) return;
		if(popup.options['center'] == "input")
			popup.options['center'] = true;
		popup.center();
	});
});