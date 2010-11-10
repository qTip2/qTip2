/*
* qTip - The jQuery tooltip plugin
* http://craigsworks.com/projects/qtip/
*
* Version: 2.0.0pre
* Copyright 2009 Craig Michael Thompson - http://craigsworks.com
*
* Dual licensed under MIT or GPL Version 2 licenses
*   http://en.wikipedia.org/wiki/MIT_License
*   http://en.wikipedia.org/wiki/GNU_General_Public_License
*
* Date: Wed Nov 10 12:50:04 2010 +0000
*/

"use strict"; // Enable ECMAScript "strict" operation for this function. See more: http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
/*jslint browser: true, onevar: true, undef: true, nomen: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global window: false, jQuery: false */

// Munge the primitives - Paul Irish tip
var TRUE = true,
	FALSE = false,
	NULL = null;

(function($, window, undefined) {

// Option object sanitizer
function sanitizeOptions(opts, targets)
{
	var content, validTargets = $();

	if(!opts) { return FALSE; }

	try {
		if('metadata' in opts && 'object' !== typeof opts.metadata) {
			opts.metadata = {
				type: opts.metadata
			};
		}

		if('content' in opts) {
			if('object' !== typeof opts.content || opts.content.jquery) {
				opts.content = {
					text: opts.content
				};
			}

			content = opts.content.text || FALSE;
			if(!$.isFunction(content) && ((!content && !content.attr) || content.length < 1 || ('object' === typeof content && !content.jquery))) {
				content = opts.content.text = FALSE;
			}

			if('title' in opts.content && 'object' !== typeof opts.content.title) {
				opts.content.title = {
					text: opts.content.title
				};
			}
		}

		if('position' in opts) {
			if('object' !== typeof opts.position) {
				opts.position = {
					my: opts.position,
					at: opts.position
				};
			}

			if('object' !== typeof opts.position.adjust) {
				opts.position.adjust = {};
			}

			if('undefined' !== typeof opts.position.adjust.screen) {
				opts.position.adjust.screen = !!opts.position.adjust.screen;
			}
		}

		if('show' in opts) {
			if('object' !== typeof opts.show) {
				opts.show = {
					event: opts.show
				};
			}

			if('object' !== typeof opts.show) {
				if(opts.show.jquery) {
					opts.show = { target: opts.show };
				}
				else {
					opts.show = { event: opts.show };
				}
			}
		}

		if('hide' in opts) {
			if('object' !== typeof opts.hide) {
				if(opts.hide.jquery) {
					opts.hide = { target: opts.hide };
				}
				else {
					opts.hide = { event: opts.hide };
				}
			}
		}

		if('style' in opts && 'object' !== typeof opts.style) {
			opts.style = {
				classes: opts.style
			};
		}
	}
	catch (e) {}

	// Make sure content functions return something
	if($.isFunction(content)) {
		opts.content.text = [];
		targets.each(function() {
			var result = content.call(this);
			if(!result) { return; }
			
			opts.content.text.push(result);
			validTargets = validTargets.add($(this));
		});
	}
	else {
		validTargets = targets;
	}

	// Sanitize plugin options
	$.each($.fn.qtip.plugins, function() {
		if(this.sanitize) { this.sanitize(opts); }
	});

	return validTargets;
}

/*
* Core plugin implementation
*/
function QTip(target, options, id)
{
	// Declare this reference
	var self = this,

	// Shortcut vars
	uitooltip = 'ui-tooltip',
	selector = '.qtip.'+uitooltip;
	
	// Setup class attributes
	self.id = id;
	self.rendered = FALSE;
	self.elements = { target: target };
	self.cache = { event: {}, target: NULL, disabled: FALSE };
	self.timers = { img: [] };
	self.options = options;
	self.plugins = {};

	/*
	* Private core functions
	*/
	function convertNotation(notation)
	{
		var i, obj,

		// Split notation into array
		actual = notation.split('.'),

		// Locate required option
		option = options[ actual[0] ];

		// Loop through
		for(i = 1; i < actual.length; i+=1) {
			obj = option[ actual[i] ];
			if(typeof obj === 'object' && !obj.jquery && !obj.precedance) {
				option = option[ actual[i] ];
			}
			else { break; }
		}

		return actual[i] !== undefined ? [option, actual[i] ] : [options, actual[0]];
	}

	function offset(jElem) {
		var elem = jElem[0],
			pos = { left: 0, top: 0 },
			absolute = !options.position.adjust.container;

		if(elem.offsetParent) {
			do {
				pos.left += elem.offsetLeft;
				pos.top += elem.offsetTop;
			}
			while(elem = absolute ? elem.offsetParent : 0);
		}

		return pos;
	}

	function calculate(detail)
	{
		var tooltip = self.elements.tooltip,
			accessible = uitooltip + '-accessible',
			show = (!tooltip.is(':visible')) ? TRUE : FALSE,
			returned = FALSE;

		// Make sure tooltip is rendered and if not, return
		if(!self.rendered) { return FALSE; }

		// Show and hide tooltip to make sure properties are returned correctly
		if(show) { tooltip.addClass(accessible); }
		switch(detail)
		{
			case 'dimensions':
				// Find initial dimensions
				returned = {
					height: tooltip.outerHeight(),
					width: tooltip.outerWidth()
				};
			break;

			case 'position':
				returned = offset(tooltip);
			break;
		}
		if(show) { tooltip.removeClass(accessible); }

		return returned;
	}

	// IE max-width/min-width simulator function
	function updateWidth(newWidth)
	{
		var tooltip = self.elements.tooltip, max, min;

		// Make sure tooltip is rendered and the browser is IE. If not, return
		if(!self.rendered || !($.browser.msie && parseInt($.browser.version.charAt(0), 10) < 9)) { return FALSE; }

		// Determine actual width
		tooltip.css({ width: 'auto', maxWidth: 'none' });
		newWidth = calculate('dimensions').width;
		tooltip.css({ maxWidth: '' });

		// Parse and simulate max and min width
		max = parseInt(tooltip.css('max-width'), 10) || 0;
		min = parseInt(tooltip.css('min-width'), 10) || 0;
		newWidth = Math.min( Math.max(newWidth, min), max );

		// Set the new calculated width and if width has not numerical, grab new pixel width
		tooltip.width(newWidth);
	}

	function removeTitle()
	{
		var elems = self.elements;

		if(elems.title) {
			elems.titlebar.remove();
			elems.titlebar = elems.title = elems.button = NULL;
			elems.tooltip.removeAttr('aria-labelledby');
		}
	}

	function createButton()
	{
		var elems = self.elements,
			button = options.content.title.button;

		if(elems.button) { elems.button.remove(); }

		// Use custom button if one was supplied by user, else use default
		if(button.jquery) {
			elems.button = button;
		}
		else if('string' === typeof button) {
			elems.button = $('<a />', { 'html': button });
		}
		else {
			elems.button = $('<a />', {
				'class': 'ui-state-default',
				'text': 'Close tooltip',
				'title': 'Close tooltip',
				'css': { 'text-indent': '-10000em' }
			})
			.prepend(
				$('<span />', { 'class': 'ui-icon ui-icon-close' })
			);
		}

		// Create button and setup attributes
		elems.button
			.prependTo(elems.titlebar)
			.attr('role', 'button')
			.addClass(uitooltip + '-' + (button === TRUE ? 'close' : 'button'))
			.hover(function(event){ $(this).toggleClass('ui-state-hover', event.type === 'mouseenter'); })
			.click(function() {
				if(!elems.tooltip.hasClass('ui-state-disabled')) { self.hide(); }
				return FALSE;
			})
			.bind('mousedown keydown mouseup keyup mouseout', function(event) {
				$(this).toggleClass('ui-state-active ui-state-focus', (/down$/i).test(event.type));
			});
		
	}

	function createTitle()
	{
		var elems = self.elements;

		// Destroy previous title element, if present
		if(elems.titlebar) { removeTitle(); }

		// Create title bar and title elements
		elems.titlebar = $('<div />', {
			'class': uitooltip + '-titlebar ' + (options.style.widget ? 'ui-widget-header' : '')
		})
		.append(
			elems.title = $('<div />', {
				'id': uitooltip + '-'+id+'-title',
				'class': uitooltip + '-title',
				'html': options.content.title.text
			})
		)
		.prependTo(elems.wrapper);

		if(options.content.title.button) { createButton(); }
	}

	function updateButton(button)
	{
		var elem = self.elements.button,
			title = self.elements.title;

		// Make sure tooltip is rendered and if not, return
		if(!self.rendered) { return FALSE; }

		if(!button) {
			elem.remove();
		}
		else {
			if(!title) {
				createTitle();
			}
			createButton();
		}
	}

	function updateTitle(content)
	{
		// Make sure tooltip is rendered and if not, return
		if(!self.rendered) { return FALSE; }

		// If title isn't already created, create it now
		if(!self.elements.title && content) {
			createTitle();
			self.reposition();
		}
		else if(!content) {
			removeTitle();
		}
		else {
			// Set the new content
			self.elements.title.html(content);
		}
	}

	function updateContent(content)
	{
		var elements = self.elements;

		// Make sure tooltip is rendered and content is defined. If not return
		if(!self.rendered || !content) { return FALSE; }

		// Use function to parse content
		if($.isFunction(content)) {
			content = content.call(target);
		}

		// Append new content if its a DOM array and show it if hidden
		if(content.jquery && content.length > 0) {
			elements.content.empty().append(content.css({ display: 'block' }));
		}

		// Content is a regular string, insert the new content
		else {
			elements.content.html(content);
		}

		// Insert into 'fx' queue our image dimension checker which will halt the showing of the tooltip until image dimensions can be detected
		elements.tooltip.queue('fx', function(next) {
			// Find all content images without dimensions
			var images = $('img:not([height]):not([width])', self.elements.content);

			// Update tooltip width and position when all images are loaded
			function imageLoad(img) {
				// Remove the image from the array
				images = images.not(img);

				// If queue is empty, update tooltip and continue the queue
				if(images.length === 0) {
					updateWidth();
					if(self.rendered === TRUE) {
						self.reposition(self.cache.event);
					}

					next();
				}
			}

			// Apply the callback to img events and height checker method to ensure queue continues no matter what!
			images.each(function(i, elem) {
				// Apply the imageLoad to regular events to make sure the queue continues
				var events = ['abort','error','load','unload',''].join('.qtip-image ');
				$(this).bind(events, function() {
					clearTimeout(self.timers.img[i]);
					imageLoad(this);
				});

				// Apply a recursive method that polls the image for dimensions every 20ms
				(function timer(){
					// When the dimensions are found, remove the image from the queue
					if(elem.height) {
						return imageLoad(elem);
					}

					self.timers.img[i] = setTimeout(timer, 20);
				}());
				
				return true;
			});

			// If no images were found, continue with queue
			if(images.length === 0) { imageLoad(images);  }
		});

		return self;
	}

	function assignEvents(show, hide, tooltip, doc)
	{
		var namespace = '.qtip-'+id,
			targets = {
				show: options.show.target,
				hide: options.hide.target,
				tooltip: self.elements.tooltip
			},
			events = { show: String(options.show.event).split(' '), hide: String(options.hide.event).split(' ') },
			IE6 = $.browser.msie && (/^6\.[0-9]/).test($.browser.version);

		// Define show event method
		function showMethod(event)
		{
			if(targets.tooltip.hasClass('ui-state-disabled')) { return FALSE; }

			// If set, hide tooltip when inactive for delay period
			targets.show.trigger('qtip-'+id+'-inactive');

			// Clear hide timers
			clearTimeout(self.timers.show);
			clearTimeout(self.timers.hide);

			// Start show timer
			var callback = function(){ self.show(options.position.target !== 'mouse' ? event : NULL); };
			if(options.show.delay > 0) {
				self.timers.show = setTimeout(callback, options.show.delay);
			}
			else{ callback(); }
		}

		// Define hide method
		function hideMethod(event)
		{
			if(targets.tooltip.hasClass('ui-state-disabled')) { return FALSE; }

			// Check if new target was actually the tooltip element
			var ontoTooltip = $(event.relatedTarget).parents(selector)[0] == targets.tooltip[0];

			// Clear timers and stop animation queue
			clearTimeout(self.timers.show);
			clearTimeout(self.timers.hide);

			// Prevent hiding if tooltip is fixed and event target is the tooltip. Or if mouse positioning is enabled and cursor momentarily overlaps
			if(options.hide.fixed && ((options.position.target === 'mouse' && ontoTooltip) || ((/mouse(out|leave|move)/).test(event.type) && ontoTooltip)))
			{
				// Prevent default and popagation
				event.stopPropagation();
				event.preventDefault();
				return FALSE;
			}

			// If tooltip has displayed, start hide timer
			targets.tooltip.stop(TRUE);

			if(options.hide.delay > 0) {
				self.timers.hide = setTimeout(function(){ self.hide(event); }, options.hide.delay);
			}
			else{ self.hide(event); }
		}

		// Define inactive method
		function inactiveMethod(event)
		{
			if(targets.tooltip.hasClass('ui-state-disabled')) { return FALSE; }

			// Clear timer
			clearTimeout(self.timers.inactive);
			self.timers.inactive = setTimeout(function(){ self.hide(event); }, options.hide.inactive);
		}
		
		function repositionMethod(event) {
			// Only update position if tooltip is visible
			if(self.elements.tooltip.is(':visible')) { self.reposition(event); }
		}

		// Catch remove events on target element to destroy tooltip
		target.bind('remove.qtip', function(){ self.destroy(); });

		// Check if the tooltip is 'fixed'
		if(tooltip && options.hide.fixed)
		{
			// Add tooltip as a hide target
			targets.hide = targets.hide.add(targets.tooltip);

			// Clear hide timer on tooltip hover to prevent it from closing
			targets.tooltip.bind('mouseover'+namespace, function() {
				if(!targets.tooltip.hasClass('ui-state-disabled')) {
					clearTimeout(self.timers.hide);
				}
			});
		}

		// Assign hide events
		if(hide) {
			// Check if the tooltip hides when inactive
			if('number' === typeof options.hide.inactive)
			{
				// Bind inactive method to target as a custom event
				targets.show.bind('qtip-'+id+'-inactive', inactiveMethod);

				// Define events which reset the 'inactive' event handler
				$.each($.fn.qtip.inactiveEvents, function(index, type){
					targets.hide.add(self.elements.tooltip).bind(type+namespace+'-inactive', inactiveMethod);
				});
			}

			// Apply hide events
			$.each(events.hide, function(index, type) {
				var showIndex = $.inArray(type, events.show);

				// Both events and targets are identical, apply events using a toggle
				if((showIndex > -1 && $(targets.hide).add(targets.show).length === $(targets.hide).length) || type === 'unfocus')
				{
					targets.show.bind(type+namespace, function(event)
					{
						if(targets.tooltip.is(':visible')) { hideMethod(event); }
						else{ showMethod(event); }
					});

					// Don't bind the event again
					delete events.show[ showIndex ];
				}

				// Events are not identical, bind normally
				else{ targets.hide.bind(type+namespace, hideMethod); }
			});
		}

		// Apply show events
		if(show) {
			$.each(events.show, function(index, type) {
				targets.show.bind(type+namespace, showMethod);
			});

			// Focus the tooltip on mouseover
			targets.tooltip.bind('mouseover'+namespace, function(){ self.focus(); });
		}

		// Apply document events
		if(doc) {
			// Adjust positions of the tooltip on window resize if enabled
			if(options.position.adjust.resize || options.position.adjust.screen) {
				$(window).bind('resize'+namespace, repositionMethod);
			}
			
			// Adjust tooltip position on scroll if screen adjustment is enabled
			if(options.position.adjust.screen || (IE6 && targets.tooltip.css('position') === 'fixed')) {
				$(document).bind('scroll'+namespace, repositionMethod);
			}

			// Hide tooltip on document mousedown if unfocus events are enabled
			if((/unfocus/i).test(options.hide.event)) {
				$(document).bind('mousedown'+namespace, function(event) {
					var tooltip = self.elements.tooltip;

					if($(event.target).parents(selector).length === 0 && $(event.target).add(target).length > 1 &&
					tooltip.is(':visible') && !tooltip.hasClass('ui-state-disabled')) {
						self.hide();
					}
				});
			}

			// If mouse is the target, update tooltip position on document mousemove
			if(options.position.target === 'mouse') {
				$(document).bind('mousemove'+namespace, function(event) {
					// Update the tooltip position only if the tooltip is visible and adjustment is enabled
					if(options.position.adjust.mouse && !targets.tooltip.hasClass('ui-state-disabled') && targets.tooltip.is(':visible')) {
						self.reposition(event || $.fn.qtip.mouse);
					}
				});
			}
		}
	}

	function unassignEvents(show, hide, tooltip, doc)
	{
		doc = parseInt(doc, 10) !== 0;
		var namespace = '.qtip-'+id,
			targets = {
				show: show ? options.show.target : $('<div/>'),
				hide: hide ? options.hide.target : $('<div/>'),
				tooltip: tooltip ? self.elements.tooltip : $('<div/>')
			},
			events = { show: String(options.show.event).split(' '), hide: String(options.hide.event).split(' ') };

		// Check if tooltip is rendered
		if(self.rendered)
		{
			// Remove show events
			$.each(events.show, function(index, type){ targets.show.unbind(type+namespace); });
			targets.show.unbind('mousemove'+namespace)
				.unbind('mouseout'+namespace)
				.unbind('qtip-'+id+'-inactive');

			// Remove hide events
			$.each(events.hide, function(index, type) {
				targets.hide.add(targets.tooltip).unbind(type+namespace);
			});
			$.each($.fn.qtip.inactiveEvents, function(index, type){
				targets.hide.add(tooltip ? self.elements.content : NULL).unbind(type+namespace+'-inactive');
			});
			targets.hide.unbind('mouseout'+namespace);

			// Remove tooltip events
			targets.tooltip.unbind('mouseover'+namespace);

			// Remove document events
			if(doc) {
				$(window).unbind('resize'+namespace);
				$(document).unbind('mousedown'+namespace+' mousemove'+namespace);
			}
		}

		// Tooltip isn't yet rendered, remove render event
		else if(show) { targets.show.unbind(events.show+namespace+'-create'); }
	}

	/*
	* Public API methods
	*/
	$.extend(self, {
		render: function(show)
		{
			var elements = self.elements, callback = $.Event('tooltiprender');

			// If tooltip has already been rendered, exit
			if(self.rendered) { return FALSE; }

			// Call API method and set rendered status
			self.rendered = show ? -2 : -1; // -1: rendering	 -2: rendering and show when done

			// Create initial tooltip elements
			elements.tooltip = $('<div/>')
				.attr({
					'id': uitooltip + '-'+id,
					'role': 'tooltip',
					'class': uitooltip + ' qtip ui-tooltip-accessible ui-helper-reset ' + options.style.classes
				})
				.css('z-index', $.fn.qtip.zindex + $(selector).length)
				.toggleClass('ui-widget', options.style.widget)
				.toggleClass('ui-state-disabled', self.cache.disabled)
				.data('qtip', self)
				.appendTo(options.position.container);

			// Append to container element
			elements.wrapper = $('<div />', { 'class': uitooltip + '-wrapper' }).appendTo(elements.tooltip);
			elements.content = $('<div />', {
					'class': uitooltip + '-content ' + (options.style.widget ? 'ui-widget-content' : ''),
					'id': uitooltip + '-' + id + '-content'
				})
				.appendTo(elements.wrapper);

			// Setup content and title (if enabled)
			updateContent(options.content.text);
			if(options.content.title.text) {
				createTitle();
			}

			// Initialize 'render' plugins
			$.each($.fn.qtip.plugins, function() {
				if(this.initialize === 'render') { this(self); }
			});

			// Set rendered status to TRUE
			self.rendered = TRUE;

			// Assign events
			assignEvents(1, 1, 1, 1);
			$.each(options.events, function(name, callback) {
				elements.tooltip.bind('tooltip'+name, callback);
			});

			/* Queue this part of the render process in our fx queue so we can
			 * load images before the tooltip renders fully.
			 *
			 * See: updateContent method
			*/
			elements.tooltip.queue('fx', function(next) {
				// Update tooltip position and show tooltip if needed
				if(options.show.ready || show) {
					elements.tooltip.hide();
					self.show(self.cache.event);
				}

				// Remove accessible class
				elements.tooltip.removeClass('ui-tooltip-accessible');

				// Trigger tooltiprender event and pass original triggering event as original
				callback.originalEvent = $.extend({}, self.cache.event);
				elements.tooltip.trigger(callback, [self.hash()]);

				next(); // Move on
			});

			return self;
		},

		get: function(notation)
		{
			var result, o;

			switch(notation.toLowerCase())
			{
				case 'offset':
					result = calculate('position');
				break;

				case 'dimensions':
					result = calculate('dimensions');
				break;

				default:
					o = convertNotation(notation.toLowerCase());
					result = (o[0].precedance) ? o[0].string() : (o[0].jquery) ? o[0] : o[0][ o[1] ];
				break;
			}

			return result;
		},

		set: function(notation, value)
		{
			notation = notation.toLowerCase();
			var option = convertNotation(notation),
				elems = self.elements,
				tooltip = elems.tooltip,
				previous,
				category, rule,
				checks = {
					builtin: {
						// Core checks
						'id': function(obj, opt, val, prev) {
							var id = value === TRUE ? $.fn.qtip.nextid : value,
								idStr = uitooltip + '-' + id;

							if(id !== FALSE && id.length > 0 && !$('#ui-tooltip-'+id).length) {
								tooltip[0].id = idStr;
								elems.content[0].id = idStr + '-content';
								elems.title[0].id = idStr + '-title';
							}
						},

						// Content checks
						'^content.text': function(){ updateContent(value); },
						'^content.title.text': function(){ updateTitle(value); },
						'^content.title.button': function(){ updateButton(value); },

						// Position checks
						'^position.(my|at)$': function(){
							// Parse new corner value into Corner objecct
							var corner = (/my$/i).test(notation) ? 'my' : 'at';

							if('string' === typeof value) {
								options.position[corner] = new $.fn.qtip.plugins.Corner(value);
							}
						},
						'^position.(my|at|adjust|target)': function(){ if(self.rendered) { self.reposition(); } },
						'^position.container$': function(){
							if(self.rendered === TRUE) { 
								tooltip.appendTo(value); 
								self.reposition();
							}
						},
				
						// Show & hide checks
						'^(show|hide).(event|target|fixed|delay|inactive)': function(obj, opt, val, prev) {
							var args = notation.search(/fixed/i) > -1 ? [0, [0,1,1,1]] : [notation.substr(0,3), notation.charAt(0) === 's' ? [1,0,0,0] : [0,1,0,0]];

							if(args[0]) { obj[opt] = prev; }
							unassignEvents.apply(self, args[1]);

							if(args[0]) { obj[opt] = val; }
							assignEvents.apply(self, args[1]);
						},
						'^show.ready$': function() { if(self.rendered === FALSE) { self.show(); } },

						// Style checks
						'^style.classes$': function() { self.elements.tooltip.css('class', uitooltip + ' qtip ui-helper-reset ' + value); },
						'^style.widget$': function() {
							tooltip.toggleClass('ui-widget', !!value);
							elems.titlebar.toggleClass('ui-widget-header', !!value);
							elems.content.toggleClass('ui-widget-content', !!value);
						},
						
						// Events check
						'^events.(render|show|move|hide|focus|blur)': function(obj, opt, val, prev) {
							if($.isFunction(value)) {
								elems.tooltip.bind('tooltip'+opt, val);
							}
							else {
								elems.tooltip.unbind('tooltip'+opt, prev);
							}
						}
					}
				};

			// Merge active plugin checks
			$.each(self.plugins, function(name) {
				if('object' === typeof this.checks) {
					checks[name] = this.checks;
				}
			});

			// Set new option value
			previous = option[0][ option[1] ];
			option[0][ option[1] ] = value.nodeType ? $(value) : value;

			// Re-sanitize options
			sanitizeOptions(options, target);

			// Execute any valid callbacks
			for(category in checks) {
				for(rule in checks[category]) {
					if((new RegExp(rule, 'i')).test(notation)) {
						checks[category][rule].call(self, option[0], option[1], value, previous);
					}
				}
			}

			return self;
		},

		toggle: function(state, event)
		{
			if(self.rendered === FALSE) { return FALSE; }

			var type = state ? 'show' : 'hide',
				tooltip = self.elements.tooltip,
				opts = options[type],
				visible = tooltip.is(':visible'),
				callback, ieStyle;

			// Detect state if valid one isn't provided
			if((typeof state).search('boolean|number')) { state = !tooltip.is(':visible'); }

			// Define after callback
			function after()
			{
				var elem = $(this),
					attr = state ? 'attr' : 'removeAttr',
					opacity = (/^1|0$/).test(elem.css('opacity'));

				// Apply ARIA attributes when tooltip is shown
				if(self.elements.title){ target[attr]('aria-labelledby', uitooltip + '-'+id+'-title'); }
				target[attr]('aria-describedby', uitooltip + '-'+id+'-content');

				// Prevent antialias from disappearing in IE7 by removing filter and opacity attribute
				if(state) {
					if($.browser.msie && this.style && opacity) { 
						ieStyle = this.style;
						ieStyle.removeAttribute('filter');
						ieStyle.removeAttribute('opacity');
					}
				}
				else if(opacity) {
					elem.hide();
				}
			}

			// Return if element is already in correct state
			if((!visible && !state) || tooltip.is(':animated')) { return self; }

			// Try to prevent flickering when tooltip overlaps show element
			if(event) {
				if(self.cache.event && (/over|enter/).test(event.type) && (/out|leave/).test(self.cache.event.type) &&
					$(event.target).add(options.show.target).length < 2 && $(event.relatedTarget).parents(selector).length > 0){
					return self;
				}

				// Cache event
				self.cache.event = $.extend({}, event);
			}

			// Call API methods
			callback = $.Event('tooltip'+type); 
			callback.originalEvent = $.extend({}, event);
			tooltip.trigger(callback, [self.hash(), 90]);
			if(callback.isDefaultPrevented()){ return self; }

			// Execute state specific properties
			if(state) {
				self.focus(); // Focus the tooltip before show to prevent visual stacking
				self.reposition(event); // Update tooltip position
				
				// Hide other tooltips if tooltip is solo
				if(opts.solo) { $(selector).qtip('hide'); }
			}
			else {
				// Clear show timer
				clearTimeout(self.timers.show);
			}

			// Set ARIA hidden status attribute
			tooltip.attr('aria-hidden', Boolean(!state));

			// Clear animation queue
			tooltip.stop(TRUE, FALSE);

			// Use custom function if provided
			if($.isFunction(opts.effect)) {
				opts.effect.call(tooltip, self.hash());
				tooltip.queue(function(){ after.call(this); $(this).dequeue(); });
			}

			// If no effect type is supplied, use a simple toggle
			else if(opts.effect === FALSE) {
				tooltip[ type ]();
				after.call(tooltip);
			}

			// Use basic fade function
			else {
				tooltip.fadeTo(90, state ? 1 : 0, after);
			}

			// If inactive hide method is set, active it
			if(state) { opts.target.trigger('qtip-'+id+'-inactive'); }

			return self;
		},

		show: function(event){ self.toggle(TRUE, event); },

		hide: function(event){ self.toggle(FALSE, event); },

		focus: function(event)
		{
			if(self.rendered === false) { return FALSE; }

			var tooltip = self.elements.tooltip,
				qtips = $(selector),
				curIndex = parseInt(tooltip.css('z-index'), 10),
				newIndex = $.fn.qtip.zindex + qtips.length,
				focusClass = uitooltip + '-focus',
				cachedEvent = $.extend({}, event),
				callback;

			// Only update the z-index if it has changed and tooltip is not already focused
			if(!tooltip.hasClass(focusClass) && curIndex !== newIndex)
			{
				// Reduce our z-index's and keep them properly ordered
				qtips.css('z-index', function(i, curIndex) {
					return curIndex - 1;
				});

				// Fire blur event for focussed tooltip
				$(selector + '.' + focusClass).each(function() {
					var self = $(this), api = self.qtip(), blur;

					if(!api || api.rendered === FALSE) { return TRUE; }

					// Set focused status to FALSE
					self.removeClass(focusClass);

					// Trigger blur event
					blur = $.Event('tooltipblur');
					blur.originalEvent = cachedEvent;
					self.trigger(blur, [api, newIndex]);
				});

				// Call API method
				callback = $.Event('tooltipfocus'); 
				callback.originalEvent = cachedEvent;
				tooltip.trigger(callback, [self.hash(), newIndex]);

				// Set the new z-index and set focus status to TRUE if callback wasn't FALSE
				if(!callback.isDefaultPrevented()) {
					tooltip.css({ zIndex: newIndex }).addClass(focusClass);
				}
			}

			return self;
		},

		reposition: function(event)
		{
			if(self.rendered === FALSE) { return FALSE; }

			var target = options.position.target,
				tooltip = self.elements.tooltip,
				posOptions = options.position,
				my = posOptions.my, 
				at = posOptions.at,
				elemWidth = self.elements.tooltip.width(),
				elemHeight = self.elements.tooltip.height(),
				offsetParent = $(posOptions.container)[0],
				targetWidth = 0,
				targetHeight = 0,
				position = { left: 0, top: 0 },
				callback = $.Event('tooltipmove'),
				fixed = tooltip.css('position') === 'fixed',
				win = $(window),
				adjust = {
					left: function(posLeft) {
						var winScroll = win.scrollLeft(),
							winWidth = win.width(),
							myOffset = my.x === 'left' ? -elemWidth : my.x === 'right' ? elemWidth : elemWidth / 2,
							atOffset = at.x === 'left' ? targetWidth : at.x === 'right' ? -targetWidth : targetWidth / 2,
							adjustX = -2 * posOptions.adjust.x,
							adjustWidth = my.x !== at.x && at.x !== 'center' ? targetWidth : 0,
							newOffset = atOffset + myOffset + adjustX,
							overflowLeft = winScroll - posLeft,
							overflowRight = posLeft + elemWidth - winWidth - winScroll;

						if(overflowRight > 0) {
							position.left += (my.x === 'center' ? -1 : 1) * (newOffset - atOffset - adjustWidth);
						}
						else if(overflowLeft > 0) {
							position.left += newOffset - atOffset + adjustWidth;
						}

						return position.left - posLeft;
					},
					top: function(posTop) {
						var winScroll = win.scrollTop(),
							winHeight = win.height(),
							myOffset = my.y === 'top' ? -elemHeight : my.y === 'bottom' ? elemHeight : -elemHeight / 2,
							atOffset = at.y === 'top' ? targetHeight : at.y === 'bottom' ? -targetHeight : 0,
							adjustY = -2 * posOptions.adjust.y,
							adjustHeight = my.y !== at.y && at.y !== 'center' ? targetHeight : 0,
							newOffset = atOffset + myOffset + adjustY,
							overflowTop = winScroll - posTop,
							overflowBottom = posTop + elemHeight - winHeight - winScroll;

						if(overflowTop > 0) {
							position.top += (my.y === 'center' ? -1 : 1) * (newOffset - atOffset - adjustHeight);
						}
						else if(overflowBottom > 0) {
							position.top += newOffset - atOffset - adjustHeight;
						}

						return position.top - posTop;
					}
				};

			// Check if mouse was the target
			if(target === 'mouse') {
				// Force left top to allow flipping
				at = { x: 'left', y: 'top' };

				// Use cached event if one isn't available for positioning
				event = $.extend({}, $.fn.qtip.mouse);
				position = { top: event.pageY, left: event.pageX };
			}
			else {
				// Check if event targetting is being used
				if(target === 'event') {
					if(event && event.target && event.type !== 'scroll' && event.type !== 'resize') {
						target = self.cache.target = $(event.target);
					}
					else {
						target = self.cache.target;
					}
				}

				// Parse the target into a jQuery object and make sure there's an element present
				target = $(target).eq(0);
				if(target.length === 0) { return self; }

				// Check if window or document is the target
				else if(target[0] === document || target[0] === window) {
					targetWidth = target.width();
					targetHeight = target.height();

					if(target[0] === window) {
						position = {
							top: fixed ? 0 : win.scrollTop(),
							left: fixed ? 0 : win.scrollLeft()
						};
					}
				}
				
				// Use Imagemap plugin if target is an AREA element
				else if(target.is('area') && $.fn.qtip.plugins.imagemap) {
					position = $.fn.qtip.plugins.imagemap(target, at);
					targetWidth = position.width;
					targetHeight = position.height;
					position = position.offset;
				}

				else {
					targetWidth = target.outerWidth();
					targetHeight = target.outerHeight();
					
					position = offset(target);
				}

				// Adjust position relative to target
				position.left += at.x === 'right' ? targetWidth : at.x === 'center' ? targetWidth / 2 : 0;
				position.top += at.y === 'bottom' ? targetHeight : at.y === 'center' ? targetHeight / 2 : 0;
			}

			// Adjust position relative to tooltip
			position.left += posOptions.adjust.x + (my.x === 'right' ? -elemWidth : my.x === 'center' ? -elemWidth / 2 : 0);
			position.top += posOptions.adjust.y + (my.y === 'bottom' ? -elemHeight : my.y === 'center' ? -elemHeight / 2 : 0);

			// Calculate collision offset values
			if(posOptions.adjust.screen && target[0] !== window && target[0] !== document.body) {
				position.adjusted = { left: adjust.left(position.left), top: adjust.top(position.top) };
			}
			else {
				position.adjusted = { left: 0, top: 0 };
			}

			// Make sure the tooltip doesn't extend the top/left window boundaries
			if(posOptions.container[0] == document.body) {
				if(position.top + win.scrollTop() < 1) { position.top = 0; }
				if(position.left + win.scrollLeft() < 1) { position.left = 0; }
			}

			// Set tooltip position class
			tooltip.attr('class', function(i, val) {
				return $(this).attr('class').replace(/ui-tooltip-pos-\w+/i, '');
			})
			.addClass(uitooltip + '-pos-' + my.abbreviation());

			// Call API method
			callback.originalEvent = $.extend({}, event);
			tooltip.trigger(callback, [self.hash(), position]);
			if(callback.isDefaultPrevented()){ return self; }
			delete position.adjusted;

			// Use custom function if provided
			if(tooltip.is(':visible') && $.isFunction(posOptions.effect)) {
				posOptions.effect.call(tooltip, self.hash(), position);
				tooltip.queue(function() {
					var elem = $(this);
					// Reset attributes to avoid cross-browser rendering bugs
					elem.css({ opacity: '', height: '' });
					if($.browser.msie && this.style) { this.style.removeAttribute('filter'); }
					elem.dequeue();
				});
			}
			else if(!isNaN(position.left, position.top)) {
				tooltip.css(position);
			}

			return self;
		},

		disable: function(state)
		{
			var tooltip = self.elements.tooltip;

			if(self.rendered) {
				tooltip.toggleClass('ui-state-disabled', state);
			}
			else {
				self.cache.disabled = !!state;
			}

			return self;
		},

		destroy: function()
		{
			var elements = self.elements,
				oldtitle = elements.target.data('oldtitle');

			// Destroy any associated plugins when rendered
			if(self.rendered) {
				$.each(self.plugins, function() {
					if(this.initialize === 'render') { this.destroy(); }
				});
			}

			// Remove bound events
			unassignEvents(1, 1, 1, 1);

			// Remove api object and tooltip
			target.removeData('qtip');
			if(self.rendered) { elements.tooltip.remove(); }

			// Reset old title attribute if removed and reset describedby attribute
			if(oldtitle) {
				target.attr('title', oldtitle);
			}
			target.removeAttr('aria-describedby');

			return target;
		},

		hash: function()
		{
			var apiHash = $.extend({}, self);
			delete apiHash.cache;
			delete apiHash.timers;
			delete apiHash.options;
			delete apiHash.plugins;
			delete apiHash.render;
			delete apiHash.hash;

			return apiHash;
		}
	});
}

// Initialization method
function init(id, opts)
{
	var obj, 
	
	// Setup element references
	elem = $(this),
	docBody = $(document.body),

	// Grab metadata from element if plugin is present
	metadata = (elem.metadata) ? elem.metadata(opts.metadata) : {},

	// Create unique configuration object using metadata
	config = $.extend(TRUE, {}, opts, metadata),
	posOptions = config.position,

	// Use document body instead of document element if needed
	newTarget = this === document ? docBody : elem;

	// Setup missing content if none is detected
	if('boolean' === typeof config.content.text) {

		// Grab from supplied attribute if available
		if(config.content.attr !== FALSE && elem.attr(config.content.attr)) {
			config.content.text = elem.attr(config.content.attr);
		}

		// No valid content was found, abort render
		else {
			return FALSE;
		}
	}

	// Setup target options
	if(posOptions.container === FALSE) { posOptions.container = docBody; }
	if(posOptions.target === FALSE) { posOptions.target = newTarget; }
	if(config.show.target === FALSE) { config.show.target = newTarget; }
	if(config.hide.target === FALSE) { config.hide.target = newTarget; }

	// Convert position corner values into x and y strings
	posOptions.at = new $.fn.qtip.plugins.Corner(posOptions.at);
	posOptions.my = new $.fn.qtip.plugins.Corner(posOptions.my);

	// Destroy previous tooltip if overwrite is enabled, or skip element if not
	if(elem.data('qtip')) {
		if(config.overwrite) {
			elem.qtip('destroy');
		}
		else if(config.overwrite === FALSE) {
			return FALSE;
		}
	}

	// Initialize the tooltip and add API reference
	obj = new QTip(elem, config, id);
	elem.data('qtip', obj);

	return obj;
}

// jQuery $.fn extension method
$.fn.qtip = function(options, notation, newValue)
{
	var command = String(options).toLowerCase(), // Parse command
		returned = NULL,
		args = command === 'disable' ? [TRUE] : $.makeArray(arguments).slice(1, 10),
		event = args[args.length - 1],
		opts = $.extend(TRUE, {}, options),
		targets;

	// Check for API request
	if((!arguments.length && this.data('qtip')) || command === 'api') {
		opts = this.data('qtip');
		return opts ? opts.hash() : undefined;
	}

	// Execute API command if present
	else if('string' === typeof options)
	{
		this.each(function()
		{
			var api = $(this).data('qtip');
			if(!api) { return TRUE; }

			// Call APIcommand
			if((/option|set/).test(command) && notation) {
				if(newValue !== undefined) {
					api.set(notation, newValue);
				}
				else {
					returned = api.get(notation);
				}
			}
			else {
				// Render tooltip if not already rendered when tooltip is to be shown
				if(!api.rendered && (command === 'show' || command === 'toggle')) {
					if(event && event.timeStamp) { api.cache.event = event; }
					api.render();
				}

				// Check for disable/enable commands
				else if(command === 'enable') {
					command = 'disable'; args = [FALSE];
				}

				// Execute API command
				if(api[command]) {
					api[command].apply(api[command], args);
				}
			}
		});

		return returned !== NULL ? returned : this;
	}

	// No API commands. validate provided options and setup qTips
	else if('object' === typeof options)
	{
		// Sanitize options
		targets = sanitizeOptions(opts, this);

		// Build new sanitized options object
		opts = $.extend(TRUE, {}, $.fn.qtip.defaults, opts);

		// Bind the qTips
		return $.fn.qtip.bind.call(targets, opts, event);
	}
};

// $.fn.qtip Bind method
$.fn.qtip.bind = function(opts, event)
{
	return this.each(function(i) {
		var elem = $(this),
			id = opts.id,
			content = opts.content.text,
			self, options, targets, events, namespace;

		// Find next available ID, or use custom ID if provided
		opts.id = id = (id === FALSE || id.length < 1 || $('#ui-tooltip-'+id).length) ? $.fn.qtip.nextid++ : id;

		// Setup events namespace
		namespace = '.qtip-'+id+'-create';

		// Initialize the qTip
		self = init.call(this, id, opts);
		if(self === FALSE) { return TRUE; }

		// Setup options and get correct content from array if present
		options = self.options;
		if($.isArray(content)) {
			options.content.text = content[i];
		}

		// Remove title attribute and store it if present
		if(elem.attr('title')) {
			elem.data('oldtitle', elem.attr('title')).removeAttr('title');
		}

		// Initialize plugins
		$.each($.fn.qtip.plugins, function() {
			if(this.initialize === 'initialize') { this(self); }
		});

		// Determine hide and show targets
		targets = { show: options.show.target, hide: options.hide.target };
		events = {
			show: String(options.show.event).replace(' ', namespace+' ') + namespace,
			hide: String(options.hide.event).replace(' ', namespace+' ') + namespace
		};

		// Define hoverIntent function
		function hoverIntent(event) {
			function render() {
				// Cache mouse coords,render and render the tooltip
				self.render(typeof event === 'object' || options.show.ready);

				// Unbind show and hide event
				targets.show.unbind(events.show);
				targets.hide.unbind(events.hide);
			}

			// Only continue if tooltip isn't disabled
			if(self.cache.disabled) { return FALSE; }

			// Cache the event data
			self.cache.event = $.extend({}, event);

			// Start the event sequence
			if(options.show.delay > 0) {
				clearTimeout(self.timers.show);
				self.timers.show = setTimeout(render, options.show.delay);
				if(events.show !== events.hide) {
					targets.hide.bind(events.hide, function() { clearTimeout(self.timers.show); });
				}
			}
			else { render(); }
		}

		// Bind show events to target
		targets.show.bind(events.show, hoverIntent);

		// Prerendering is enabled, create tooltip now
		if(opts.show.ready || opts.prerender || opts.show.event === FALSE) { hoverIntent(event); }
	});
};

// Override some of the core jQuery methods for library-specific purposes
$.each({
	/* Allow other plugins to successfully retrieve the title of an element with a qTip applied */
	attr: function(attr) {
		var api = $(this).data('qtip');
		return (arguments.length === 1 && attr === 'title' && api && api.rendered === TRUE) ? $(this).data('oldtitle') : NULL;
	},

	/* 
	* Taken directly from jQuery 1.8.2 widget source code
	* Trigger 'remove' event on all elements on removal if jQuery UI isn't present 
	*/
	remove: $.ui ? NULL : function( selector, keepData ) {
		this.each(function() {
			if (!keepData) {
				if (!selector || $.filter( selector, [ this ] ).length) {
					$('*', this).add(this).each(function() {
						$(this).triggerHandler('remove');
					});
				}
			}
		});
	}
},
function(name, func) {
	if(!func) { return TRUE; }
	$.fn['Old'+name] = $.fn[name];
	$.fn[name] = function() {
		return func.apply(this, arguments) || $.fn['Old'+name].apply(this, arguments);
	};
});

/* 
* Add ARIA role attribute to document body if not already present
* http://wiki.jqueryui.com/Tooltip - 4.3 Accessibility recommendation
*/
$(document.body).attr('role', function(i, val) { return !val ? 'application' : val; });

// Cache mousemove events for positioning purposes
$(document).bind('mousemove.qtip', function(event) {
	$.fn.qtip.mouse = { pageX: event.pageX, pageY: event.pageY };
});

// Set global qTip properties
$.fn.qtip.nextid = 0;
$.fn.qtip.inactiveEvents = 'click dblclick mousedown mouseup mousemove mouseleave mouseenter'.split(' ');
$.fn.qtip.zindex = 15000;

// Setup base plugins
$.fn.qtip.plugins = {
	// Corner object parser
	Corner: function(corner) {
		this.x = (String(corner).replace(/middle/i, 'center').match(/left|right|center/i) || ['false'])[0].toLowerCase();
		this.y = (String(corner).replace(/middle/i, 'center').match(/top|bottom|center/i) || ['false'])[0].toLowerCase();
		this.precedance = (corner.charAt(0).search(/^(t|b)/) > -1) ? 'y' : 'x';
		this.string = function() { return this.precedance === 'y' ? this.y+this.x : this.x+this.y; };
		this.abbreviation = function() { 
			var x = this.x.substr(0,1), y = this.y.substr(0,1);
			return x === y ? x : (x === 'c' || (x !== 'c' && y !== 'c')) ? y + x : x + y;
		};
	}
};

// Define configuration defaults
$.fn.qtip.defaults = {
	prerender: FALSE,
	id: FALSE,
	overwrite: TRUE,
	metadata: {
		type: 'class'
	},
	content: {
		text: TRUE,
		attr: 'title',
		title: {
			text: FALSE,
			button: FALSE
		}
	},
	position: {
		my: 'top left',
		at: 'bottom right',
		target: FALSE,
		container: FALSE,
		adjust: {
			x: 0, y: 0,
			mouse: TRUE,
			screen: FALSE,
			resize: TRUE,
			container: FALSE
		},
		effect: TRUE
	},
	show: {
		target: FALSE,
		event: 'mouseenter',
		effect: TRUE,
		delay: 90,
		solo: FALSE,
		ready: FALSE
	},
	hide: {
		target: FALSE,
		event: 'mouseleave',
		effect: TRUE,
		delay: 0,
		fixed: FALSE,
		inactive: FALSE
	},
	style: {
		classes: '',
		widget: FALSE
	},
	events: {
		render: $.noop,
		move: $.noop,
		show: $.noop,
		hide: $.noop,
		focus: $.noop,
		blur: $.noop
	}
};function Ajax(qTip)
{
	var self = this;

	self.checks = {
		'^content.ajax': function() { this.plugins.ajax.load(this.options.content.ajax); }
	};
	
	$.extend(self, {

		init: function()
		{
			// Grab ajax options
			var ajax = qTip.options.content.ajax;

			// Bind render event to load initial content
			qTip.elements.tooltip.bind('tooltiprender.ajax', function() { 
				self.load(ajax);

				// Bind show event
				qTip.elements.tooltip.bind('tooltipshow.ajax', function() {
					// Update content if content.ajax.once is FALSE and the tooltip is rendered
					if(ajax.once === FALSE && qTip.rendered === TRUE) { self.load(ajax); }
				});
			});
		},

		load: function(ajax)
		{
			// Define success and error handlers
			function successHandler(content, status)
			{
				// Call user-defined success handler if present
				if($.isFunction(ajax.success)) {
					var result = ajax.success.call(qTip.hash(), content, status);
					if(result === FALSE){ return; }
				}

				// Update content
				qTip.set('content.text', content);
				
			}
			function errorHandler(xhr, status, error)
			{
				var content = status || error, result;

				// Call user-defined success handler if present
				if($.isFunction(ajax.error)) {
					result = ajax.error.call(qTip.hash(), xhr, status, error);
					if(result === FALSE){ return; }
				}

				// Update tooltip content to indicate error
				qTip.set('content.text', content);
			}

			// Setup $.ajax option object and process the request
			$.ajax( $.extend(TRUE, {}, ajax, { success: successHandler, error: errorHandler }) );

			return self;
		},

		destroy: function()
		{
			// Remove bound events
			qTip.elements.tooltip.unbind('tooltipshow.ajax');
		}
	});

	self.init();
}


$.fn.qtip.plugins.ajax = function(qTip)
{
	var api = qTip.plugins.ajax,
		opts = qTip.options.content.ajax;

	// Make sure the qTip uses the $.ajax functionality
	if(opts && opts.url) {
		// An API is already present, return it
		if(api) {
			return api;
		}
		// No API was found, create new instance
		else {
			qTip.plugins.ajax = new Ajax(qTip);
			return qTip.plugins.ajax;
		}
	}
};

$.fn.qtip.plugins.ajax.initialize = 'render';

// Setup plugin sanitization
$.fn.qtip.plugins.ajax.sanitize = function(options)
{
	try {
		var opts = options.content.ajax;
		if(typeof opts !== 'object') { options.content.ajax = { url: opts }; }
		if('boolean' !== typeof opts.once && opts.once) { opts.once = !!opts.once; }
	}
	catch (e) {}
};

// Extend original qTip defaults
$.extend(TRUE, $.fn.qtip.defaults, {
	content: {
		ajax: {
			once: TRUE
		}
	}
});// Tip coordinates calculator
function calculateTip(corner, width, height)
{
	var width2 = Math.floor(width / 2), height2 = Math.floor(height / 2),

	// Define tip coordinates in terms of height and width values
	tips = {
		bottomright:	[[0,0],				[width,height],		[width,0]],
		bottomleft:		[[0,0],				[width,0],				[0,height]],
		topright:		[[0,height],		[width,0],				[width,height]],
		topleft:			[[0,0],				[0,height],				[width,height]],
		topcenter:		[[0,height],		[width2,0],				[width,height]],
		bottomcenter:	[[0,0],				[width,0],				[width2,height]],
		rightcenter:	[[0,0],				[width,height2],		[0,height]],
		leftcenter:		[[width,0],			[width,height],		[0,height2]]
	};

	// Set common side shapes
	tips.lefttop = tips.bottomright; tips.righttop = tips.bottomleft;
	tips.leftbottom = tips.topright; tips.rightbottom = tips.topleft;

	return tips[corner];
}

function Tip(qTip, command)
{
	var self = this,
		opts = qTip.options.style.tip,
		elems = qTip.elements,
		tooltip = elems.tooltip,
		wrapper = elems.wrapper,
		cache = { 
			top: 0, 
			left: 0, 
			corner: { string: function(){} }
		},
		size = {
			width: opts.width,
			height: opts.height
		},
		color = { },
		border = opts.border || 0,
		adjust = opts.adjust || 0,
		method = opts.method || FALSE;

	self.corner = NULL;
	self.mimic = NULL;
	self.checks = {
		'^position.my|style.tip.(corner|mimic|method|border)': function() {
			// Re-determine tip type and update
			border = opts.border;

			// Make sure a tip can be drawn
			if(!self.init()) {
				self.destroy();
			}

			// Only update the position if mouse isn't the target
			else if(this.get('position.target') !== 'mouse') {
				this.reposition();
			}
		},
		'^style.tip.(height|width)': function() {
			// Re-set dimensions and redraw the tip
			size = {
				width: opts.width,
				height: opts.height
			};
			self.create();
			self.update();

			// Reposition the tooltip
			qTip.reposition();
		}
	};

	// Tip position method
	function position(corner)
	{
		var tip = elems.tip,
			corners  = ['left', 'right'],
			offset = opts.offset,
			precedance;

		// Return if tips are disabled or tip is not yet rendered
		if(opts.corner === FALSE || !tip) { return FALSE; }

		// Inherit corner if not provided
		corner = corner || self.corner;
		precedance = corner.precedance;

		// Reet initial position
		tip.css({ top: '', bottom: '', left: '', right: '', margin: '' });

		// Setup corners to be adjusted
		corners[ precedance === 'y' ? 'push' : 'unshift' ]('top', 'bottom');

		// Calculate offset adjustments
		offset = Math.max(corner[ precedance === 'y' ? 'x' : 'y' ] === 'center' ? offset : 0, offset);

		// Adjust primary corners
		switch(corner[ precedance === 'y' ? 'x' : 'y' ])
		{
			case 'center':
				tip.css(corners[0], '50%').css('margin-'+corners[0], -(size[ (precedance === 'y') ? 'width' : 'height' ] / 2) + offset);
			break;

			case corners[0]:
				tip.css(corners[0], offset);
			break;

			case corners[1]:
				tip.css(corners[1], offset);
			break;
		}

		// Determine adjustments
		offset = size[ (precedance === 'x') ? 'width' : 'height' ];
		if(border) {
			tooltip.toggleClass('ui-tooltip-accessible', !tooltip.is(':visible'));
			offset -= parseInt(wrapper.css('border-' + corner[ precedance ] + '-width'), 10) || 0;
			tooltip.removeClass('ui-tooltip-accessible');
		}

		// Adjust secondary corners
		tip.css(corner[precedance], -offset);
	}

	function reposition(event, api, position) {
		if(!elems.tip) { return; }

		var newCorner = $.extend({}, self.corner),
			newType = self.mimic.adjust ? $.extend({}, self.mimic) : NULL,
			precedance = newCorner.precedance === 'y' ? ['y', 'top', 'left', 'height', 'x'] : ['x', 'left', 'top', 'width', 'y'],
			adjusted = position.adjusted,
			offset = [ parseInt(wrapper.css('border-' + newCorner[ precedance[0] ] + '-width'), 10) || 0, 0 ],
			walk = [newCorner, newType];

		// Adjust tip corners
		$.each(walk, function() {
			if(adjusted.left) {
				this.x = this.x === 'center' ? (adjusted.left > 0 ? 'left' : 'right') : (this.x === 'left' ? 'right' : 'left');
			}
			if(adjusted.top) {
				this.y = this.y === 'center' ? (adjusted.top > 0 ? 'top' : 'bottom') : (this.y === 'top' ? 'bottom' : 'top');
			}
		});

		// Adjust tooltip position if needed in relation to tip element
		offset[1] = Math.max(newCorner[ precedance[4] ] === 'center' ? opts.offset : 0, opts.offset);
		position[ precedance[1] ] += (newCorner[ precedance[0] ] === precedance[1] ? 1 : -1) * (size[ precedance[3] ] - offset[0]);
		position[ precedance[2] ] -= (newCorner[ precedance[4] ] === precedance[2] || newCorner[ precedance[4] ] === 'center' ? 1 : -1) * offset[1];

		// Update and redraw the tip if needed
		if(newCorner.string() !== cache.corner.string() && (cache.top !== adjusted.top || cache.left !== adjusted.left)) { 
			self.update(newCorner, newType);
		}

		// Cache overflow details
		cache.left = adjusted.left;
		cache.top = adjusted.top;
		cache.corner = newCorner;
	}

	$.extend(self, {
		init: function()
		{
			var ie = $.browser.msie,
				center = self.mimic && (/center/i).test(self.mimic.string()),
				enabled = self.detectCorner();

			// Determine tip corner and type
			if(enabled) {
				// Check if rendering method is possible and if not fall back
				if(method === TRUE) {
					method = $('<canvas />')[0].getContext ? 'canvas' :
					ie && (center || size.height !== size.width) ? 'vml' : 'polygon';
				}
				else {
					if(method === 'canvas') {
						method = ie ? 'vml' : !$('<canvas />')[0].getContext ? 'polygon' : 'canvas';
					}
					else if(method === 'polygon') {
						method = ie && center ? 'vml' : method;
					}
				}

				// Create a new tip
				self.create();
				self.detectColours();
				self.update();

				// Bind update events
				tooltip.bind('tooltipmove.tip', reposition);
			}

			return enabled;
		},

		detectCorner: function()
		{
			var corner = opts.corner,
				mimic = opts.mimic || corner,
				at = qTip.options.position.at,
				my = qTip.options.position.my;
				if(my.string) { my = my.string(); }

			// Detect corner and mimic properties
			if(corner === FALSE || (my === FALSE && at === FALSE)) {
				return FALSE;
			}
			else {
				if(corner === TRUE) {
					self.corner = new $.fn.qtip.plugins.Corner(my);
				}
				else if(!corner.string) {
					self.corner = new $.fn.qtip.plugins.Corner(corner);
				}

				if(mimic === TRUE) {
					self.mimic = new $.fn.qtip.plugins.Corner(my);
				}
				else if(!mimic.string) {
					self.mimic = new $.fn.qtip.plugins.Corner(mimic);
					self.mimic.precedance = self.corner.precedance;
				}
			}

			return self.corner.string() !== 'centercenter';
		},

		detectColours: function() {
			var tip = elems.tip,
				precedance = self.mimic[ self.mimic.precedance ],
				borderSide = 'border-' + precedance + '-color';

			// Detect tip colours
			color.fill = tip.css('background-color', '').css('border', '').css('background-color') || 'transparent';
			color.border = tip.get(0).style ? tip.get(0).style['border' + precedance.charAt(0) + precedance.substr(1) + 'Color'] : tip.css(borderSide) || 'transparent';

			// Make sure colours are valid and reset background and border properties
			if((/rgba?\(0, 0, 0(, 0)?\)|transparent/i).test(color.fill)) { color.fill = wrapper.css(border ? 'background-color' : borderSide); }
			if(!color.border || (/rgba?\(0, 0, 0(, 0)?\)|transparent/i).test(color.border)) { color.border = wrapper.css(borderSide) || color.fill; }

			$('*', tip).add(tip).css('background-color', 'transparent').css('border', 0);
		},

		create: function()
		{
			var width = size.width,
				height = size.height;

			// Create tip element and prepend to the tooltip if needed
			if(elems.tip){ elems.tip.remove(); }
			elems.tip = $('<div class="ui-tooltip-tip" />')
				.toggleClass('ui-widget-content', qTip.options.style.widget)
				.css(size).prependTo(tooltip);
			
			// Create tip element
			switch(method)
			{
				case 'canvas':
					elems.tip.append('<canvas height="'+height+'" width="'+width+'" />');
				break;
					
				case 'vml':
					elems.tip.html('<vml:shape coordorigin="0 0" coordsize="'+width+' '+height+'" stroked="' + !!border + '" ' +
						' style="behavior:url(#default#VML); display:inline-block; antialias:TRUE; position: absolute; ' +
						' top:0; left:0; width:'+width+'px; height:'+height+'px; vertical-align:'+self.corner.y+';">' +
						
						'<vml:stroke weight="' + (border-2) + 'px" joinstyle="miter" miterlimit="10" ' + 
							' style="behavior:url(#default#VML); display:inline-block;" />' +
						
						'</vml:shape>');
				break;

				case 'polygon':
					elems.tip.append('<div class="ui-tooltip-tip-inner" />').append(border ? '<div class="ui-tooltip-tip-border" />' : '');
				break;
			}

			return self;
		},

		update: function(corner, mimic)
		{
			var tip = elems.tip,
				width = size.width,
				height = size.height,
				regular = 'px solid ',
				transparent = 'px dashed transparent', // Dashed IE6 border-transparency hack. Awesome!
				i = border > 0 ? 0 : 1,
				translate = Math.ceil(border / 2 + 0.5),
				factor, context, path, coords, inner;

			// Re-determine tip if not already set
			if(!mimic) { mimic = corner ? corner : self.mimic; }
			if(!corner) { corner = self.corner; }
			
			// Inherit tip corners from corner object if not present
			if(mimic.x === 'false') { mimic.x = corner.x; }
			if(mimic.y === 'false') { mimic.y = corner.y; }

			// Find inner child of tip element
			inner = tip.children();

			// Create tip element
			switch(method)
			{
				case 'canvas':
					// Grab canvas context and clear it
					context = inner.get(0).getContext('2d');
					context.restore();
					context.clearRect(0,0,3000,3000);

					// Grab tip coordinates
					coords = calculateTip(mimic.string(), width, height);

					// Draw the canvas tip (Delayed til after DOM creation)
					for(i; i < 2; i++) {
						// Save and translate canvas origin
						if(i) {
							context.save();
							context.translate(
								Math.floor((mimic.x === 'left' ? 1 : mimic.x === 'right' ? -1 : 0) * (border + 1) * (mimic.precedance === 'y' ? 0.5 : 1)),
								Math.floor((mimic.y === 'top' ? 1 : mimic.y === 'bottom' ? -1 : 0) * (border + 1) * (mimic.precedance === 'x' ? 0.5 : 1))
							);
						}

						context.beginPath();
						context.moveTo(coords[0][0], coords[0][1]);
						context.lineTo(coords[1][0], coords[1][1]);
						context.lineTo(coords[2][0], coords[2][1]);
						context.closePath();
						context.fillStyle = color[ i ? 'fill' : 'border' ];
						context.fill();
					}
					break;
					
				case 'vml':
					// Determine tip coordinates based on dimensions
					coords = calculateTip(mimic.string(), width, height);
					
					// Create coordize and tip path using tip coordinates
					path = 'm' + coords[0][0] + ',' + coords[0][1] + ' l' + coords[1][0] +
						',' + coords[1][1] + ' ' + coords[2][0] + ',' + coords[2][1] + ' xe';

					inner.attr({ 'path': path, 'fillcolor': color.fill });
					
					if(border) {
						inner.children().attr('color', color.border);
						
						if(mimic.precedance === 'y') {
							inner.css('top', (mimic.y === 'top' ? 1 : -1) * (border - 2));
							inner.css('left', (mimic.x === 'left' ? 1 : -2));
						}
						else {
							inner.css('left', (mimic.x === 'left' ? 1 : -1) * (border - 2));
							inner.css('top', (mimic.y === 'top' ? 1 : -2));
						}
						
					}
					break;
					
				case 'polygon':
					// Determine border translations
					if(mimic.precedance === 'y') {
						factor = width > height ? 1.5 : width < height ? 5 : 2.2;
						translate = [
							mimic.x === 'left' ? translate : mimic.x === 'right' ? -translate : 0,
							Math.floor(factor * translate * (mimic.y === 'bottom' ? -1 : 1) * (mimic.x === 'center' ? 0.8 : 1))
						];
					}
					else {
						factor = width < height ? 1.5 : width > height ? 5 : 2.2;
						translate = [
							Math.floor(factor * translate * (mimic.x === 'right' ? -1 : 1) * (mimic.y === 'center' ? 0.9 : 1)),
							mimic.y === 'top' ? translate : mimic.y === 'bottom' ? -translate : 0
						];
					}
					
					inner.removeAttr('style').each(function(i) {
						// Determine what border corners/colors to set
						var toSet = {
								x: mimic.precedance === 'x' ? (mimic.x === 'left' ? 'right' : 'left') : mimic.x,
								y: mimic.precedance === 'y' ? (mimic.y === 'top' ? 'bottom' : 'top') : mimic.y
							},
							path = mimic.x === 'center' ? ['left', 'right', toSet.y, height, width] : ['top', 'bottom', toSet.x, width, height],
							col = color[!i && border ? 'border' : 'fill'];
							
						if(i) { 
							$(this).css({ 'position': 'absolute', 'z-index': 1, 'left': translate[0], 'top': translate[1] });
						}

						// Setup borders based on corner values
						if(mimic.x === 'center' || mimic.y === 'center') {
							$(this).css('border-' + path[2], path[3] + regular + col)
								.css('border-' + path[0], Math.floor(path[4] / 2) + transparent)
								.css('border-' + path[1], Math.floor(path[4] / 2) + transparent);
						}
						else {
							$(this).css('border-width', Math.floor(height / 2) + 'px ' + Math.floor(width / 2) + 'px')
								.css('border-' + toSet.x, Math.floor(width / 2) + regular + col)
								.css('border-' + toSet.y, Math.floor(height / 2) + regular + col);
						}
					});
					break;
			}
			
			// Update position
			position(corner);

			return self;
		},

		destroy: function(unbind)
		{
			// Remove previous tip if present
			if(elems.tip) {
				elems.tip.remove();
			}

			// Remove bound events
			tooltip.unbind('tooltipmove.tip');
		}
	});
}

$.fn.qtip.plugins.tip = function(qTip)
{
	var api = qTip.plugins.tip,
		opts = qTip.options.style.tip;

	// Make sure tip options are present
	if(opts && opts.corner) {
		// An API is already present,
		if(api) {
			return api;
		}
		// No API was found, create new instance
		else {
			qTip.plugins.tip = new Tip(qTip);
			qTip.plugins.tip.init();

			return qTip.plugins.tip;
		}
	}
};

// Initialize tip on render
$.fn.qtip.plugins.tip.initialize = 'render';

// Setup plugin sanitization options
$.fn.qtip.plugins.tip.sanitize = function(options)
{
	try {
		var opts = options.style.tip;
		if(typeof opts !== 'object'){ options.style.tip = { corner: !!opts }; }
		if(typeof opts.method !== 'string'){ opts.method = TRUE; }
		if(!(/canvas|polygon/i).test(opts.method)){ opts.method = TRUE; }
		if(typeof opts.width !== 'number'){ opts.width = 12; }
		if(typeof opts.height !== 'number'){ opts.height = 12; }
		if(typeof opts.border !== 'number'){ opts.border = 0; }
	}
	catch(e) {}
};

// Extend original qTip defaults
$.extend(TRUE, $.fn.qtip.defaults, {
	style: {
		tip: {
			corner: TRUE,
			method: TRUE,
			width: 12,
			height: 12,
			border: 0,
			offset: 0
		}
	}
});$.fn.qtip.plugins.imagemap = function(area, corner)
{
	var shape = area.attr('shape').toLowerCase(),
		baseCoords = area.attr('coords').split(','),
		coords = [],
		imageOffset = $('img[usemap="#'+area.parent('map').attr('name')+'"]').offset(),
		result = {
			width: 0, height: 0,
			offset: { top: 1e10, right: 0, bottom: 0, left: 1e10 }
		},
		i = 0, next = 0;

	// POLY area coordinate calculator
	//	Special thanks to Ed Cradock for helping out with this.
	//	Uses a binary search algorithm to find suitable coordinates.
	function polyCoordinates(result, coords)
	{
		var i = 0,
			compareX = 1, compareY = 1,
			realX = 0, realY = 0,
			newWidth = result.width,
			newHeight = result.height;

		// Use a binary search algorithm to locate most suitable coordinate (hopefully)
		while(newWidth > 0 && newHeight > 0 && compareX > 0 && compareY > 0)
		{
			newWidth = Math.floor(newWidth / 2);
			newHeight = Math.floor(newHeight / 2);

			if(corner.x === 'left'){ compareX = newWidth; }
			else if(corner.x === 'right'){ compareX = result.width - newWidth; }
			else{ compareX += Math.floor(newWidth / 2); }

			if(corner.y === 'top'){ compareY = newHeight; }
			else if(corner.y === 'bottom'){ compareY = result.height - newHeight; }
			else{ compareY += Math.floor(newHeight / 2); }

			i = coords.length; while(i--)
			{
				if(coords.length < 2){ break; }

				realX = coords[i][0] - result.offset.left;
				realY = coords[i][1] - result.offset.top;

				if((corner.x === 'left' && realX >= compareX) ||
				(corner.x === 'right' && realX <= compareX) ||
				(corner.x === 'center' && (realX < compareX || realX > (result.width - compareX))) ||
				(corner.y === 'top' && realY >= compareY) ||
				(corner.y === 'bottom' && realY <= compareY) ||
				(corner.y === 'center' && (realY < compareY || realY > (result.height - compareY)))) {
					coords.splice(i, 1);
				}
			}
		}

		return { left: coords[0][0], top: coords[0][1] };
	}

	// Parse coordinates into proper array
	if(shape === 'poly') {
		i = baseCoords.length; while(i--)
		{
			next = [ parseInt(baseCoords[--i], 10), parseInt(baseCoords[i+1], 10) ];

			if(next[0] > result.offset.right){ result.offset.right = next[0]; }
			if(next[0] < result.offset.left){ result.offset.left = next[0]; }
			if(next[1] > result.offset.bottom){ result.offset.bottom = next[1]; }
			if(next[1] < result.offset.top){ result.offset.top = next[1]; }

			coords.push(next);
		}
	}
	else {
		coords = $.map(baseCoords, function(coord){ return parseInt(coord, 10); });
	}

	// Calculate details
	switch(shape)
	{
		case 'rect':
			result = {
				width: Math.abs(coords[2] - coords[0]),
				height: Math.abs(coords[3] - coords[1]),
				offset: { left: coords[0], top: coords[1] }
			};
		break;

		case 'circle':
			result = {
				width: coords[2] + 2,
				height: coords[2] + 2,
				offset: { left: coords[0], top: coords[1] }
			};
		break;

		case 'poly':
			$.extend(result, {
				width: Math.abs(result.offset.right - result.offset.left),
				height: Math.abs(result.offset.bottom - result.offset.top)
			});

			if(corner.string() === 'centercenter') {
				result.offset = {
					left: result.offset.left + (result.width / 2),
					top: result.offset.top + (result.height / 2)
				};
			}
			else {
				result.offset = polyCoordinates(result, coords.slice());
			}

			result.width = result.height = 0;
		break;
	}

	// Add image position to offset coordinates
	result.offset.left += imageOffset.left;
	result.offset.top += imageOffset.top;

	return result;
};

function Modal(qTip, options)
{
	var self = this,
		elems = qTip.elements,
		tooltip = elems.tooltip,
		namespace = '.qtipmodal',
		events = 'tooltipshow'+namespace+' tooltiphide'+namespace;

	// See if overlay is already present
	elems.overlay = $('#qtip-overlay');

	$.extend(self, {
		init: function()
		{
			// Check if the tooltip is modal
			tooltip.bind(events, function(event, api, duration) {
				var type = event.type.replace('tooltip', '');

				if($.isFunction(options[type])) {
					options[type].call(elems.overlay, duration, api);
				}
				else {
					self[type](duration);
				}
			});

			// Create the overlay if needed
			if(!elems.overlay.length) {
				self.create();
			}

			// Hide tooltip on overlay click if enabled
			if(options.blur === TRUE) {
				elems.overlay.bind('click'+namespace+qTip.id, function(){ qTip.hide.call(qTip); });
			}
		},

		create: function()
		{
			// Create document overlay
			elems.overlay = $('<div />', {
				id: 'qtip-overlay',
				css: {
					position: 'absolute',
					top: 0,
					left: 0,
					display: 'none'
				}
			})
			.appendTo(document.body);

			// Update position on window resize or scroll
			$(window).bind('resize'+namespace, function() {
				elems.overlay.css({
					height: Math.max( $(window).height(), $(document).height() ),
					width: Math.max( $(window).width(), $(document).width() )
				});
			})
			.trigger('resize');
		},

		toggle: function(state)
		{
			var overlay = elems.overlay,
				effect = qTip.options.show.modal.effect,
				type = state ? 'show': 'hide';

			// Setop all animations
			overlay.stop(TRUE, FALSE);

			// Use custom function if provided
			if($.isFunction(effect)) {
				effect.call(overlay, state);
			}
			
			// If no effect type is supplied, use a simple toggle
			else if(effect === FALSE) {
				overlay[ type ]();
			}
			
			// Use basic fade function
			else {
				overlay.fadeTo(90, state ? 0.7 : 0, function() {
					if(!state) { $(this).hide(); }
				});
			}
		},

		show: function() { self.toggle(TRUE); },
		hide: function() { self.toggle(FALSE); },

		destroy: function()
		{
			var delBlanket = TRUE;

			// Check if any other modal tooltips are present
			$('*').each(function() {
				var api = $(this).data('qtip');
				if(api && api.id !== qTip.id && api.options.show.modal) {
					// Another modal tooltip was present, leave overlay
					delBlanket = FALSE;
					return FALSE;
				}
			});

			// Remove overlay if needed
			if(delBlanket) {
				elems.overlay.remove();
				$(window).unbind('scroll'+namespace+' resize'+namespace);
			}
			else {
				elems.overlay.unbind('click'+namespace+qTip.id);
			}

			// Remove bound events
			tooltip.unbind(events);
		}
	});

	self.init();
}

$.fn.qtip.plugins.modal = function(qTip)
{
	var api = qTip.plugins.modal,
		opts = qTip.options.show.modal;

	// An API is already present,
	if(api) {
		return api;
	}
	// No API was found, create new instance
	else if(opts && opts.on === TRUE) {
		qTip.plugins.modal = new Modal(qTip, opts);
		return qTip.plugins.modal;
	}
};

// Plugin needs to be initialized on render
$.fn.qtip.plugins.modal.initialize = 'render';

// Setup sanitiztion rules
$.fn.qtip.plugins.modal.sanitize = function(opts) {
	if(opts.show) { 
		if(typeof opts.show.modal !== 'object') { opts.show.modal = { on: !!opts.show.modal }; }
		else if(typeof opts.show.modal.on === 'undefined') { opts.show.modal.on = TRUE; }
	}
};

// Extend original qTip defaults
$.extend(TRUE, $.fn.qtip.defaults, {
	show: {
		modal: {
			on: FALSE,
			effect: TRUE,
			blur: TRUE
		}
	}
});/* BGIFrame adaption (http://plugins.jquery.com/project/bgiframe) - Special thanks to Brandon Aaron */
function BGIFrame(qTip)
{
	var self = this,
		elems = qTip.elements,
		tooltip = elems.tooltip,
		namespace = '.bgiframe-' + qTip.id,
		events = 'tooltipmove'+namespace+' tooltipshow'+namespace;

	$.extend(self, {
		init: function()
		{
			// Create the BGIFrame element
			elems.bgiframe = $('<iframe class="ui-tooltip-bgiframe" frameborder="0" tabindex="-1" src="javascript:\'\';" ' +
				' style="display:block; position:absolute; z-index:-1; filter:alpha(opacity=0);"></iframe>');

			// Append the new element to the tooltip
			elems.bgiframe.appendTo(tooltip);

			// Update BGIFrame on tooltip move
			tooltip.bind(events, self.adjust);
		},

		adjust: function()
		{
			var dimensions = qTip.get('dimensions'), // Determine current tooltip dimensions
				plugin = qTip.plugins.tip,
				tip = qTip.elements.tip,
				tipAdjust, offset;

			// Adjust border offset
			offset = parseInt(tooltip.css('border-left-width'), 10);
			offset = { left: -offset, top: -offset };

			// Adjust for tips plugin
			if(plugin && tip) {
				tipAdjust = (plugin.corner.precedance === 'x') ? ['width', 'left'] : ['height', 'top'];
				offset[ tipAdjust[1] ] -= tip[ tipAdjust[0] ]();
			}

			// Update bgiframe
			elems.bgiframe.css(offset).css(dimensions);
		},

		destroy: function()
		{
			// Remove iframe
			self.iframe.remove();

			// Remove bound events
			tooltip.unbind(events);
		}
	});

	self.init();
}

$.fn.qtip.plugins.bgiframe = function(qTip)
{
	// Proceed only if the browser is IE6 and offending elements are present
	if(!($.browser.msie && (/^6\.[0-9]/).test($.browser.version) && $('select, object').length)) {
		return FALSE;
	}

	// Retrieve previous API object
	var api = qTip.plugins.bgiframe;

	// An API is already present,
	if(api) {
		return api;
	}
	// No API was found, create new instance
	else {
		qTip.plugins.bgiframe = new BGIFrame(qTip);
		return qTip.plugins.bgiframe;
	}
};

// Plugin needs to be initialized on render
$.fn.qtip.plugins.bgiframe.initialize = 'render';

}(jQuery, window));