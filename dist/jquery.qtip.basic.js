/*
* qTip2 - Pretty powerful tooltips
* http://craigsworks.com/projects/qtip2/
*
* Version: 2.0.0pre
* Copyright 2009-2010 Craig Michael Thompson - http://craigsworks.com
*
* Dual licensed under MIT or GPLv2 licenses
*   http://en.wikipedia.org/wiki/MIT_License
*   http://en.wikipedia.org/wiki/GNU_General_Public_License
*
* Date: Wed Apr 13 11:48:47 2011 +0100
*/

"use strict"; // Enable ECMAScript "strict" operation for this function. See more: http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
/*jslint browser: true, onevar: true, undef: true, nomen: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global window: false, jQuery: false */


(function($, window, undefined) {

	// Munge the primitives - Paul Irish tip
	var TRUE = true,
		FALSE = false,
		NULL = null,
		
		// Shortcut vars
		QTIP, PLUGINS, MOUSE,
		uitooltip = 'ui-tooltip',
		widget = 'ui-widget',
		disabled = 'ui-state-disabled',
		selector = 'div.qtip.'+uitooltip,
		focusClass = uitooltip + '-focus',
		hideOffset = '-31000px',
		replaceSuffix = '_replacedByqTip',
		oldtitle = 'oldtitle';

	// Simple console.error wrapper
	function debug() {
		var c = window.console;
		return c && (c.error || c.log || $.noop).apply(c, arguments);
	}
// Option object sanitizer
function sanitizeOptions(opts)
{
	var content;

	if(!opts || 'object' !== typeof opts) { return FALSE; }

	if('object' !== typeof opts.metadata) {
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
			opts.content.text = FALSE;
		}

		if('title' in opts.content) {
			if('object' !== typeof opts.content.title) {
				opts.content.title = {
					text: opts.content.title
				};
			}

			content = opts.content.title.text || FALSE;
			if(!$.isFunction(content) && ((!content && !content.attr) || content.length < 1 || ('object' === typeof content && !content.jquery))) {
				opts.content.title.text = FALSE;
			}
		}
	}

	if('position' in opts) {
		if('object' !== typeof opts.position) {
			opts.position = {
				my: opts.position,
				at: opts.position
			};
		}

		if('adjust' in opts.position) {
			if(!(/flip|shift( horizontal| vertical)*/i).test(opts.position.adjust.method)) {
				delete opts.position.adjust.method;
			}
		}
	}

	if('show' in opts) {
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

	if('style' in opts) {
		if('object' !== typeof opts.style) {
			opts.style = {
				classes: opts.style
			};
		}
	}

	// Sanitize plugin options
	$.each(PLUGINS, function() {
		if(this.sanitize) { this.sanitize(opts); }
	});
	
	return opts;
}

/*
* Core plugin implementation
*/
function QTip(target, options, id, attr)
{
	// Declare this reference
	var self = this,
		docBody = document.body,
		tooltipID = uitooltip + '-' + id,
		isPositioning = 0,
		isDrawing = 0,
		tooltip = $(),
		elements, cache;

	// Setup class attributes
	self.id = id;
	self.rendered = FALSE;
	self.elements = elements = { target: target };
	self.timers = { img: [] };
	self.options = options;
	self.checks = {};
	self.plugins = {};
	self.cache = cache = {
		event: {},
		target: NULL,
		disabled: FALSE,
		attr: attr
	};

	/*
	* Private core functions
	*/
	function convertNotation(notation)
	{
		var i = 0, obj, option = options, 

		// Split notation into array
		levels = notation.split('.');

		// Loop through
		while( option = option[ levels[i++] ] ) {
			if(i < levels.length) { obj = option; }
		}

		return [obj || options, levels.pop()];
	}

	function setWidget() {
		var on = options.style.widget;

		tooltip.toggleClass(widget, on);
		elements.content.toggleClass(widget+'-content', on);
		
		if(elements.titlebar){
			elements.titlebar.toggleClass(widget+'-header', on);
		}
		if(elements.button){
			elements.button.toggleClass(uitooltip+'-icon', !on);
		}
	}

	function removeTitle()
	{
		if(elements.title) {
			elements.titlebar.remove();
			elements.titlebar = elements.title = elements.button = NULL;
			self.reposition();
		}
	}

	function createButton()
	{
		var button = options.content.title.button,
			isString = typeof button === 'string',
			close = isString ? button : 'Close tooltip';

		if(elements.button) { elements.button.remove(); }

		// Use custom button if one was supplied by user, else use default
		if(button.jquery) {
			elements.button = button;
		}
		else {
			elements.button = $('<a />', {
				'class': 'ui-state-default ' + (options.style.widget ? '' : uitooltip+'-icon'),
				'title': close,
				'aria-label': close
			})
			.prepend(
				$('<span />', {
					'class': 'ui-icon ui-icon-close',
					'html': '&times;'
				})
			);
		}

		// Create button and setup attributes
		elements.button.appendTo(elements.titlebar)
			.attr('role', 'button')
			.hover(function(event){ $(this).toggleClass('ui-state-hover', event.type === 'mouseenter'); })
			.click(function(event) {
				if(!tooltip.hasClass(disabled)) { self.hide(event); }
				return FALSE;
			})
			.bind('mousedown keydown mouseup keyup mouseout', function(event) {
				$(this).toggleClass('ui-state-active ui-state-focus', event.type.substr(-4) === 'down');
			});

		// Redraw the tooltip when we're done
		self.redraw();
	}

	function createTitle()
	{
		var id = tooltipID+'-title';

		// Destroy previous title element, if present
		if(elements.titlebar) { removeTitle(); }

		// Create title bar and title elements
		elements.titlebar = $('<div />', {
			'class': uitooltip + '-titlebar ' + (options.style.widget ? 'ui-widget-header' : '')
		})
		.append(
			elements.title = $('<div />', {
				'id': id,
				'class': uitooltip + '-title',
				'aria-atomic': TRUE
			})
		)
		.insertBefore(elements.content);

		// Create button if enabled
		if(options.content.title.button) { createButton(); }

		// Redraw the tooltip dimensions if it's rendered
		else if(self.rendered){ self.redraw(); } 
	}

	function updateButton(button)
	{
		var elem = elements.button,
			title = elements.title;

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
		var elem = elements.title;

		// Make sure tooltip is rendered and if not, return
		if(!self.rendered || !content) { return FALSE; }

		// Use function to parse content
		if($.isFunction(content)) {
			content = content.call(target, self) || '';
		}

		// Append new content if its a DOM array and show it if hidden
		if(content.jquery && content.length > 0) {
			elem.empty().append(content.css({ display: 'block' }));
		}

		// Content is a regular string, insert the new content
		else { elem.html(content); }

		// Redraw and reposition
		self.redraw();
		if(self.rendered && tooltip.is(':visible')) {
			self.reposition(cache.event);
		}
	}

	function updateContent(content, reposition)
	{
		var elem = elements.content;

		// Make sure tooltip is rendered and content is defined. If not return
		if(!self.rendered || !content) { return FALSE; }

		// Use function to parse content
		if($.isFunction(content)) {
			content = content.call(target, self) || '';
		}

		// Append new content if its a DOM array and show it if hidden
		if(content.jquery && content.length > 0) {
			elem.empty().append(content.css({ display: 'block' }));
		}

		// Content is a regular string, insert the new content
		else { elem.html(content); }

		// Image detection
		function detectImages(next) {
			var images;

			function imageLoad(event) {
				// If queue is empty after image removal, update tooltip and continue the queue
				if((images = images.not(this)).length === 0) {
					self.redraw();
					self.reposition(cache.event);
					
					next();
				}
			}

			// Find all content images without dimensions, and if no images were found, continue
			if((images = elem.find('img:not([height]):not([width])')).length === 0) { return imageLoad.call(images); }

			// Apply timer to each iamge to poll for dimensions
			images.each(function(i, elem) {
				(function timer(){
					var timers = self.timers.img;

					// When the dimensions are found, remove the image from the queue and stop timer
					if(elem.height && elem.width) {
						clearTimeout(timers[i]);
						return imageLoad.call(elem);
					}
					timers[i] = setTimeout(timer, 20);
				}());
			});
		}

		/*
		 * If we're still rendering... insert into 'fx' queue our image dimension
		 * checker which will halt the showing of the tooltip until image dimensions
		 * can be detected properly.
		 */
		if(self.rendered < 0) { tooltip.queue('fx', detectImages); }

		// We're fully rendered, so reset isDrawing flag and proceed without queue delay
		else { isDrawing = 0; detectImages($.noop); }

		return self;
	}

	function assignEvents(show, hide, tip, doc)
	{
		var namespace = '.qtip-'+id,
			posOptions = options.position,
			targets = {
				show: options.show.target,
				hide: options.hide.target,
				container: posOptions.container[0] === docBody ? $(document) : posOptions.container,
				doc: $(document)
			},
			events = {
				show: $.trim('' + options.show.event).split(' '),
				hide: $.trim('' + options.hide.event).split(' ')
			},
			IE6 = $.browser.msie && parseInt($.browser.version, 10) === 6,
			additional;

		// Define show event method
		function showMethod(event)
		{
			if(tooltip.hasClass(disabled)) { return FALSE; }

			// If set, hide tooltip when inactive for delay period
			targets.show.trigger('qtip-'+id+'-inactive');

			// Clear hide timers
			clearTimeout(self.timers.show);
			clearTimeout(self.timers.hide);

			// Start show timer
			var callback = function(){ self.show(event); };
			if(options.show.delay > 0) {
				self.timers.show = setTimeout(callback, options.show.delay);
			}
			else{ callback(); }
		}

		// Define hide method
		function hideMethod(event)
		{
			if(tooltip.hasClass(disabled)) { return FALSE; }

			// Check if new target was actually the tooltip element
			var relatedTarget = $(event.relatedTarget || event.target),
				ontoTooltip = relatedTarget.closest(selector)[0] === tooltip[0],
				ontoTarget = relatedTarget[0] === targets.show[0];

			// Clear timers and stop animation queue
			clearTimeout(self.timers.show);
			clearTimeout(self.timers.hide);

			// Prevent hiding if tooltip is fixed and event target is the tooltip. Or if mouse positioning is enabled and cursor momentarily overlaps
			if((posOptions.target === 'mouse' && ontoTooltip) || (options.hide.fixed && ((/mouse(out|leave|move)/).test(event.type) && (ontoTooltip || ontoTarget))))
			{
				// Prevent default and popagation
				event.stopPropagation();
				event.preventDefault();
				return FALSE;
			}

			// If tooltip has displayed, start hide timer
			if(options.hide.delay > 0) {
				self.timers.hide = setTimeout(function(){ self.hide(event); }, options.hide.delay);
			}
			else{ self.hide(event); }
		}

		// Define inactive method
		function inactiveMethod(event)
		{
			if(tooltip.hasClass(disabled)) { return FALSE; }

			// Clear timer
			clearTimeout(self.timers.inactive);
			self.timers.inactive = setTimeout(function(){ self.hide(event); }, options.hide.inactive);
		}

		function repositionMethod(event) {
			if(tooltip.is(':visible')) { self.reposition(event); }
		}

		// Assign tooltip events
		if(tip) {
			// Enable hide.fixed
			if(options.hide.fixed) {
				// Add tooltip as a hide target
				targets.hide = targets.hide.add(tooltip);

				// Clear hide timer on tooltip hover to prevent it from closing
				tooltip.bind('mouseover'+namespace, function() {
					if(!tooltip.hasClass(disabled)) {
						clearTimeout(self.timers.hide);
					}
				});
			}

			// If mouse positioning is on, apply a mouseleave event so we don't get problems with overlapping
			if(posOptions.target === 'mouse' && posOptions.adjust.mouse && options.hide.event) {
				tooltip.bind('mouseleave'+namespace, function(event) {
					if((event.relatedTarget || event.target) !== targets.show[0]) { self.hide(event); }
				});
			}

			// Focus/blur the tooltip
			tooltip.bind('mouseenter'+namespace+' mouseleave'+namespace, function(event) {
				self[ event.type === 'mouseenter' ? 'focus' : 'blur' ](event);
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
				$.each(QTIP.inactiveEvents, function(index, type){
					targets.hide.add(elements.tooltip).bind(type+namespace+'-inactive', inactiveMethod);
				});
			}

			// Apply hide events
			$.each(events.hide, function(index, type) {
				var showIndex = $.inArray(type, events.show),
					 targetHide = $(targets.hide);

				// Both events and targets are identical, apply events using a toggle
				if((showIndex > -1 && targetHide.add(targets.show).length === targetHide.length) || type === 'unfocus')
				{
					targets.show.bind(type+namespace, function(event)
					{
						if(tooltip.is(':visible')) { hideMethod(event); }
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
		}

		// Apply document events
		if(doc) {
			// Adjust positions of the tooltip on window resize if enabled
			if(posOptions.adjust.resize || posOptions.viewport) {
				$($.event.special.resize ? posOptions.viewport : window).bind('resize'+namespace, repositionMethod);
			}

			// Adjust tooltip position on scroll if screen adjustment is enabled
			if(posOptions.viewport || (IE6 && tooltip.css('position') === 'fixed')) {
				$(posOptions.viewport).bind('scroll'+namespace, repositionMethod);
			}

			// Hide tooltip on document mousedown if unfocus events are enabled
			if((/unfocus/i).test(options.hide.event)) {
				targets.doc.bind('mousedown'+namespace, function(event) {
					var $target = $(event.target);
					
					if($target.parents(selector).length === 0 && $target.add(target).length > 1 && tooltip.is(':visible') && !tooltip.hasClass(disabled)) {
						self.hide(event);
					}
				});
			}

			// Hide mouseleave/mouseout tooltips on window/frame blur/mouseleave
			if(options.hide.leave && (/mouseleave|mouseout/i).test(options.hide.event)) {
				$(window).bind(
					'blur'+namespace+' mouse' + (options.hide.leave.indexOf('frame') > -1 ? 'out' : 'leave') + namespace,
					function(event) { if(!event.relatedTarget) { self.hide(event); } }
				);
			}

			// If mouse is the target, update tooltip position on document mousemove
			if(posOptions.target === 'mouse') {
				targets.doc.bind('mousemove'+namespace, function(event) {
					// Update the tooltip position only if the tooltip is visible and adjustment is enabled
					if(posOptions.adjust.mouse && !tooltip.hasClass(disabled) && tooltip.is(':visible')) {
						self.reposition(event || MOUSE);
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
				show: show && options.show.target[0],
				hide: hide && options.hide.target[0],
				tooltip: tooltip && self.rendered && elements.tooltip[0],
				content: tooltip && self.rendered && elements.content[0],
				container: doc && options.position.container[0] === docBody ? document : options.position.container[0],
				window: doc && window
			};

		// Check if tooltip is rendered
		if(self.rendered)
		{
			$([]).pushStack(
				$.grep(
					[ targets.show, targets.hide, targets.tooltip, targets.container, targets.content, targets.window ],
					function(i){ return typeof i === 'object'; }
				)
			)
			.unbind(namespace);
		}

		// Tooltip isn't yet rendered, remove render event
		else if(show) { options.show.target.unbind(namespace+'-create'); }
	}

	// Setup builtin .set() option checks
	self.checks.builtin = {
		// Core checks
		'^id$': function(obj, o, v) {
			var id = v === TRUE ? QTIP.nextid : v,
				tooltipID = uitooltip + '-' + id;

			if(id !== FALSE && id.length > 0 && !$('#'+tooltipID).length) {
				tooltip[0].id = tooltipID;
				elements.content[0].id = tooltipID + '-content';
				elements.title[0].id = tooltipID + '-title';
			}
		},

		// Content checks
		'^content.text$': function(obj, o, v){ updateContent(v); },
		'^content.title.text$': function(obj, o, v) {
			// Remove title if content is null
			if(!v) { return removeTitle(); }

			// If title isn't already created, create it now and update
			if(!elements.title && v) { createTitle(); }
			updateTitle(v);
		},
		'^content.title.button$': function(obj, o, v){ updateButton(v); },

		// Position checks
		'^position.(my|at)$': function(obj, o, v){
			// Parse new corner value into Corner objecct
			if('string' === typeof v) {
				obj[o] = new PLUGINS.Corner(v);
			}
		},

		'^position.container$': function(obj, o, v){
			if(self.rendered) { tooltip.appendTo(v); }
		},

		// Show & hide checks
		'^(show|hide).(event|target|fixed|delay|inactive)$': function(obj, o, v, p, match) {
			// Setup arguments
			var args = [1,0,0];
			args[match[1] === 'show' ? 'push' : 'unshift'](0);

			unassignEvents.apply(self, args);
			assignEvents.apply(self, [1,1,0,0]);
		},
		'^show.ready$': function() {
			if(!self.rendered) { self.render(1); }
			else { self.show(); }
		},

		// Style checks
		'^style.classes$': function(obj, o, v) { 
			$.attr(tooltip[0], 'class', uitooltip + ' qtip ui-helper-reset ' + v);
		},
		'^style.widget|content.title': setWidget,

		// Events check
		'^events.(render|show|move|hide|focus|blur)$': function(obj, o, v) {
			tooltip[($.isFunction(v) ? '' : 'un') + 'bind']('tooltip'+o, v);
		}
	};

	/*
	* Public API methods
	*/
	$.extend(self, {
		render: function(show)
		{
			if(self.rendered) { return self; } // If tooltip has already been rendered, exit

			var content = options.content.text,
				title = options.content.title.text,
				callback = $.Event('tooltiprender');

			// Add ARIA attributes to target
			$.attr(target[0], 'aria-describedby', tooltipID);

			// Create tooltip element
			tooltip = elements.tooltip = $('<div/>', {
					'id': tooltipID,
					'class': uitooltip + ' qtip ui-helper-reset ' + options.style.classes,
					'width': options.style.width || '',

					/* ARIA specific attributes */
					'role': 'alert',
					'aria-live': 'polite',
					'aria-atomic': FALSE,
					'aria-describedby': tooltipID + '-content',
					'aria-hidden': TRUE
				})
				.toggleClass(disabled, cache.disabled)
				.data('qtip', self)
				.appendTo(options.position.container)
				.append(
					// Create content element
					elements.content = $('<div />', {
						'class': uitooltip + '-content',
						'id': tooltipID + '-content',
						'aria-atomic': TRUE
					})
				);

			// Set rendered flag and prevent redundant redraw calls for npw
			self.rendered = -1;
			isDrawing = 1;

			// Update title
			if(title) { 
				createTitle();
				updateTitle(title);
			}

			// Set proper rendered flag and update content
			updateContent(content);
			self.rendered = TRUE;

			// Setup widget classes
			setWidget();

			// Assign passed event callbacks (before plugins!)
			$.each(options.events, function(name, callback) {
				if($.isFunction(callback)) {
					tooltip.bind(name === 'toggle' ? 'tooltipshow tooltiphide' : 'tooltip'+name, callback);
				}
			});

			// Initialize 'render' plugins
			$.each(PLUGINS, function() {
				if(this.initialize === 'render') { this(self); }
			});

			// Assign events
			assignEvents(1, 1, 1, 1);

			/* Queue this part of the render process in our fx queue so we can
			 * load images before the tooltip renders fully.
			 *
			 * See: updateContent method
			*/
			tooltip.queue('fx', function(next) {
				// Trigger tooltiprender event and pass original triggering event as original
				callback.originalEvent = cache.event;
				tooltip.trigger(callback, [self]);

				// Redraw the tooltip manually now we're fully rendered
				isDrawing = 0; self.redraw();

				// Update tooltip position and show tooltip if needed
				if(options.show.ready || show) {
					self.show(cache.event);
				}

				next(); // Move on to next method in queue
			});

			return self;
		},

		get: function(notation)
		{
			var result, o;

			switch(notation.toLowerCase())
			{
				case 'dimensions':
					result = {
						height: tooltip.outerHeight(), width: tooltip.outerWidth()
					};
				break;

				case 'offset':
					result = PLUGINS.offset(tooltip, options.position.container);
				break;

				default:
					o = convertNotation(notation.toLowerCase());
					result = o[0][ o[1] ];
					result = result.precedance ? result.string() : result;
				break;
			}

			return result;
		},

		set: function(option, value)
		{
			var rmove = /^position\.(my|at|adjust|target|container)|style|content|show\.ready/i,
				rdraw = /^content\.(title|attr)|style/i,
				reposition = FALSE,
				redraw = FALSE,
				checks = self.checks,
				name;

			function callback(notation, args) {
				var category, rule, match;

				for(category in checks) {
					for(rule in checks[category]) {
						if(match = (new RegExp(rule, 'i')).exec(notation)) {
							args.push(match);
							checks[category][rule].apply(self, args);
						}
					}
				}
			}

			// Convert singular option/value pair into object form
			if('string' === typeof option) {
				name = option; option = {}; option[name] = value;
			}
			else { option = $.extend(TRUE, {}, option); }

			// Set all of the defined options to their new values
			$.each(option, function(notation, value) {
				var obj = convertNotation( notation.toLowerCase() ), previous;

				// Set new obj value
				previous = obj[0][ obj[1] ];
				obj[0][ obj[1] ] = 'object' === typeof value && value.nodeType ? $(value) : value;

				// Set the new params for the callback
				option[notation] = [obj[0], obj[1], value, previous];

				// Also check if we need to reposition / redraw
				reposition = rmove.test(notation) || reposition;
				redraw = rdraw.test(notation) || redraw;
			});

			// Re-sanitize options
			sanitizeOptions(options);

			/*
			 * Execute any valid callbacks for the set options
			 * Also set isPositioning/isDrawing so we don't get loads of redundant repositioning
			 * and redraw calls.
			 */
			isPositioning = isDrawing = 1; $.each(option, callback); isPositioning = isDrawing = 0;

			// Update position / redraw if needed
			if(tooltip.is(':visible') && self.rendered) {
				if(reposition) { self.reposition(cache.event); }
				if(redraw) { self.redraw(); }
			}

			return self;
		},

		toggle: function(state, event)
		{
			// Make sure tooltip is rendered
			if(!self.rendered) {
				if(state) { self.render(1); } // Render the tooltip if showing and it isn't already
				else { return self; }
			}

			var type = state ? 'show' : 'hide',
				opts = options[type],
				visible = tooltip.is(':visible'),
				callback;

			// Detect state if valid one isn't provided
			if((typeof state).search('boolean|number')) { state = !visible; }

			// Return if element is already in correct state
			if(visible === state) { return self; }

			// Try to prevent flickering when tooltip overlaps show element
			if(event) {
				if((/over|enter/).test(event.type) && (/out|leave/).test(cache.event.type) &&
					event.target === options.show.target[0] && tooltip.has(event.relatedTarget).length) {
					return self;
				}

				// Cache event
				cache.event = $.extend({}, event);
			}

			// Call API methods
			callback = $.Event('tooltip'+type); 
			callback.originalEvent = event ? cache.event : NULL;
			tooltip.trigger(callback, [self, 90]);
			if(callback.isDefaultPrevented()){ return self; }

			// Set ARIA hidden status attribute
			$.attr(tooltip[0], 'aria-hidden', !!!state);

			// Execute state specific properties
			if(state) {
				// Focus the tooltip
				self.focus(event);

				// Update tooltip position
				self.reposition(event);

				// Hide other tooltips if tooltip is solo, using it as the context
				if(opts.solo) { $(selector, opts.solo).not(tooltip).qtip('hide', callback); }
			}
			else {
				// Clear show timer if we're hiding 
				clearTimeout(self.timers.show);

				// Blur the tooltip
				self.blur(event);
			}

			// Define post-animation state specific properties
			function after() {
				if(!state) {
					// Reset CSS states
					tooltip.css({
						display: '',
						visibility: '',
						width: '',
						opacity: '',
						left: '',
						top: ''
					});
				}
				else {
					// Prevent antialias from disappearing in IE by removing filter
					if($.browser.msie) { tooltip[0].style.removeAttribute('filter'); }

					// Remove overflow setting to prevent tip bugs
					tooltip.css('overflow', '');
				}
			}

			// Clear animation queue
			tooltip.stop(0, 1);

			// Use custom function if provided
			if($.isFunction(opts.effect)) {
				opts.effect.call(tooltip, self);
				tooltip.queue('fx', function(n){ after(); n(); });
			}

			// If no effect type is supplied, use a simple toggle
			else if(opts.effect === FALSE) {
				tooltip[ type ]();
				after.call(tooltip);
			}

			// Use basic fade function by default
			else { tooltip.fadeTo(90, state ? 1 : 0, after); }

			// If inactive hide method is set, active it
			if(state) { opts.target.trigger('qtip-'+id+'-inactive'); }

			return self;
		},

		show: function(event){ return self.toggle(TRUE, event); },

		hide: function(event){ return self.toggle(FALSE, event); },

		focus: function(event)
		{
			if(!self.rendered) { return self; }

			var qtips = $(selector),
				curIndex = parseInt(tooltip[0].style.zIndex, 10),
				newIndex = QTIP.zindex + qtips.length,
				cachedEvent = $.extend({}, event),
				focusedElem, callback;

			// Only update the z-index if it has changed and tooltip is not already focused
			if(!tooltip.hasClass(focusClass))
			{
				// Only update z-index's if they've changed'
				if(curIndex !== newIndex) {
					// Reduce our z-index's and keep them properly ordered
					qtips.each(function() {
						if(this.style.zIndex > curIndex) {
							this.style.zIndex = this.style.zIndex - 1;
						}
					});

					// Fire blur event for focused tooltip
					qtips.filter('.' + focusClass).qtip('blur', cachedEvent);
				}

				// Call API method
				callback = $.Event('tooltipfocus');
				callback.originalEvent = cachedEvent;
				tooltip.trigger(callback, [self, newIndex]);

				// If callback wasn't FALSE
				if(!callback.isDefaultPrevented()) {
					// Set the new z-index
					tooltip.addClass(focusClass)[0].style.zIndex = newIndex;
				}
			}

			return self;
		},

		blur: function(event) {
			var cachedEvent = $.extend({}, event),
				callback;

			// Set focused status to FALSE
			tooltip.removeClass(focusClass);

			// Trigger blur event
			callback = $.Event('tooltipblur');
			callback.originalEvent = cachedEvent;
			tooltip.trigger(callback, [self]);

			return self;
		},

		reposition: function(event, effect)
		{
			if(!self.rendered || isPositioning) { return self; }

			// Set positioning flag
			isPositioning = 1;
	
			var target = options.position.target,
				posOptions = options.position,
				my = posOptions.my, 
				at = posOptions.at,
				adjust = posOptions.adjust,
				method = adjust.method,
				elemWidth = tooltip.outerWidth(),
				elemHeight = tooltip.outerHeight(),
				targetWidth = 0,
				targetHeight = 0,
				callback = $.Event('tooltipmove'),
				fixed = tooltip.css('position') === 'fixed',
				viewport = posOptions.viewport.jquery ? posOptions.viewport : $(window),
				position = { left: 0, top: 0 },
				tip = (self.plugins.tip || {}).corner,
				readjust = {
					// Repositioning method and axis detection
					method: method.substr(0, 5),
					horizontal: method.length < 6 || method.indexOf('horizontal') > -1,
					vertical: method.length < 6 || method.indexOf('vertical') > -1,

					// Reposition methods
					left: function(posLeft) {
						// Make sure this axis is enabled for reposition
						if (!readjust.horizontal) { return 0; }

						var viewportScroll = viewport.scrollLeft,
							myWidth = my.x === 'left' ? elemWidth : my.x === 'right' ? -elemWidth : -elemWidth / 2,
							atWidth = at.x === 'left' ? targetWidth : at.x === 'right' ? -targetWidth : -targetWidth / 2,
							tipAdjust = tip && tip.precedance === 'x' ? options.style.tip.width : 0,
							overflowLeft = viewportScroll - posLeft - tipAdjust,
							overflowRight = posLeft + elemWidth - viewport.width - viewportScroll + tipAdjust,
							offset = myWidth - (my.precedance === 'x' || my.x === my.y ? atWidth : 0),
							isCenter = my.x === 'center';

						// Optional 'shift' style repositioning
						if(readjust.method === 'shift') {
							position.left += overflowLeft > 0 ? overflowLeft - tipAdjust :
								overflowRight > 0 ? -overflowRight + tipAdjust : 0;
						}

						// Default 'flip' repositioning
						else {
							if(overflowLeft > 0 && (my.x !== 'left' || overflowRight > 0)) {
								position.left -= offset + (isCenter ? 0 : 2 * adjust.x);
							}
							else if(overflowRight > 0 && (my.x !== 'right' || overflowLeft > 0)  ) {
								position.left -= isCenter ? -offset : offset + (2 * adjust.x);
							}
							if(position.left !== posLeft && isCenter) { position.left -= adjust.x; }
						}

						// Make sure we haven't made things worse with the adjustment and return the adjusted difference
						if(position.left < 0 && -position.left > overflowRight) { position.left = posLeft; }
						return position.left - posLeft;
					},
					top: function(posTop) {
						// Make sure this axis is enabled for reposition
						if (!readjust.vertical) { return 0; } 

						var viewportScroll = viewport.scrollTop,
							myHeight = my.y === 'top' ? elemHeight : my.y === 'bottom' ? -elemHeight : -elemHeight / 2,
							atHeight = at.y === 'top' ? targetHeight : at.y === 'bottom' ? -targetHeight : -targetHeight / 2,
							tipAdjust = tip && tip.precedance === 'y' ? options.style.tip.height : 0,
							overflowTop = viewportScroll - posTop - tipAdjust,
							overflowBottom = posTop + elemHeight - viewport.height - viewportScroll + tipAdjust,
							offset = myHeight - (my.precedance === 'y' || my.x === my.y ? atHeight : 0),
							isCenter = my.y === 'center';

						// Optional 'shift' style repositioning
						if(readjust.method === 'shift') {
							position.top += overflowTop - tipAdjust > 0 ? overflowTop :
								overflowBottom > 0 ? -overflowBottom + tipAdjust : 0;
						}

						// Default 'flip' repositioning
						else {
							if(overflowTop > 0 && (my.y !== 'top' || overflowBottom > 0)) {
								position.top -= offset + (isCenter ? 0 : 2 * adjust.y);
							}
							else if(overflowBottom > 0 && (my.y !== 'bottom' || overflowTop > 0)  ) {
								position.top -= isCenter ? -offset : offset + (2 * adjust.y);
							}
							if(position.top !== posTop && isCenter) { position.top -= adjust.y; }
						}

						// Make sure we haven't made things worse with the adjustment and return the adjusted difference
						if(position.top < 0 && -position.top > overflowBottom) { position.top = posTop; }
						return position.top - posTop;
					}
				};

			// Cache our viewport details
			viewport = !viewport ? FALSE : {
				elem: viewport,
				height: viewport[ (viewport[0] === window ? 'h' : 'outerH') + 'eight' ](),
				width: viewport[ (viewport[0] === window ? 'w' : 'outerW') + 'idth' ](),
				scrollLeft: viewport.scrollLeft(),
				scrollTop: viewport.scrollTop()
			};

			// Check if mouse was the target
			if(target === 'mouse') {
				// Force left top to allow flipping
				at = { x: 'left', y: 'top' };

				// Use cached event if one isn't available for positioning
				event = event && (event.type === 'resize' || event.type === 'scroll') ? cache.event :
					adjust.mouse || !event || !event.pageX ? $.extend({}, MOUSE) : event;

				// Use event coordinates for position
				position = { top: event.pageY, left: event.pageX };
			}
			else {
				// Check if event targetting is being used
				if(target === 'event') {
					if(event && event.target && event.type !== 'scroll' && event.type !== 'resize') {
						target = cache.target = $(event.target);
					}
					else {
						target = cache.target;
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
							top: !fixed || PLUGINS.iOS ? viewport.scrollTop : 0,
							left: !fixed || PLUGINS.iOS ? viewport.scrollLeft : 0
						};
					}
				}

				// Use Imagemap/SVG plugins if needed
				else if(target.is('area') && PLUGINS.imagemap) {
					position = PLUGINS.imagemap(target, at);
				}
				else if(target[0].namespaceURI == 'http://www.w3.org/2000/svg' && PLUGINS.svg) {
					position = PLUGINS.svg(target, at);
				}

				else {
					targetWidth = target.outerWidth();
					targetHeight = target.outerHeight();

					position = PLUGINS.offset(target, posOptions.container);
				}

				// Parse returned plugin values into proper variables
				if(position.offset) {
					targetWidth = position.width;
					targetHeight = position.height;
					position = position.offset;
				}

				// Adjust position relative to target
				position.left += at.x === 'right' ? targetWidth : at.x === 'center' ? targetWidth / 2 : 0;
				position.top += at.y === 'bottom' ? targetHeight : at.y === 'center' ? targetHeight / 2 : 0;
			}

			// Adjust position relative to tooltip
			position.left += adjust.x + (my.x === 'right' ? -elemWidth : my.x === 'center' ? -elemWidth / 2 : 0);
			position.top += adjust.y + (my.y === 'bottom' ? -elemHeight : my.y === 'center' ? -elemHeight / 2 : 0);

			// Calculate collision offset values
			if(posOptions.viewport.jquery && target[0] !== window && target[0] !== docBody) {
				position.adjusted = { left: readjust.left(position.left), top: readjust.top(position.top) };
			}
			else {
				position.adjusted = { left: 0, top: 0 };
			}

			// Set tooltip position class
			tooltip.attr('class', function(i, val) {
				return $.attr(this, 'class').replace(/ui-tooltip-pos-\w+/i, '');
			})
			.addClass(uitooltip + '-pos-' + my.abbreviation());

			// Call API method
			callback.originalEvent = $.extend({}, event);
			tooltip.trigger(callback, [self, position, viewport.elem]);
			if(callback.isDefaultPrevented()){ return self; }
			delete position.adjusted;

			// If effect is disabled, no animation is defined or positioning gives NaN out, set CSS directly
			if(effect === FALSE || isNaN(position.left) || isNaN(position.top) || !$.isFunction(posOptions.effect)) {
				tooltip.css(position);
			}
			
			// Use custom function if provided
			else if($.isFunction(posOptions.effect)) {
				posOptions.effect.call(tooltip, self, $.extend({}, position));
				tooltip.queue(function(next) {
					// Reset attributes to avoid cross-browser rendering bugs
					$(this).css({ opacity: '', height: '' });
					if($.browser.msie) { this.style.removeAttribute('filter'); }

					next();
				});
			}

			// Set positioning flag
			isPositioning = 0;

			return self;
		},

		// IMax/min width simulator function for all browsers.. yeaaah!
		redraw: function()
		{
			if(self.rendered < 1 || options.style.width || isDrawing) { return self; }

			var fluid = uitooltip + '-fluid', width, max, min;
			isDrawing = 1; // Set drawing flag

			// Reset width and add fluid class
			tooltip.css('width', '').addClass(fluid);

			// Grab our tooltip width (add 1 so we don't get wrapping problems in Gecko)
			width = tooltip.width() + ($.browser.mozilla ? 1 : 0);

			// Parse our max/min properties
			max = parseInt(tooltip.css('max-width'), 10) || 0;
			min = parseInt(tooltip.css('min-width'), 10) || 0;

			// Determine new dimension size based on max/min/current values
			width = max + min ? Math.min(Math.max(width, min), max) : width;

			// Set the newly calculated width and remvoe fluid class
			tooltip.css('width', width).removeClass(fluid);

			// Set drawing flag
			isDrawing = 0;

			return self;
		},

		disable: function(state)
		{
			var c = disabled;
			
			if('boolean' !== typeof state) {
				state = !(tooltip.hasClass(c) || cache.disabled);
			}
			 
			if(self.rendered) {
				tooltip.toggleClass(c, state);
				$.attr(tooltip[0], 'aria-disabled', state);
			}
			else {
				cache.disabled = !!state;
			}

			return self;
		},
		
		enable: function() { return self.disable(FALSE); },

		destroy: function()
		{
			var t = target[0],
				title = $.attr(t, oldtitle);

			// Destroy tooltip and  any associated plugins if rendered
			if(self.rendered) {
				tooltip.remove();
				
				$.each(self.plugins, function() {
					if(this.destroy) { this.destroy(); }
				});
			}

			// Clear timers and remove bound events
			clearTimeout(self.timers.show);
			clearTimeout(self.timers.hide);
			unassignEvents(1, 1, 1, 1);

			// Remove api object
			$.removeData(t, 'qtip');

			// Reset old title attribute if removed 
			if(title) {
				$.attr(t, 'title', title);
				target.removeAttr(oldtitle);
			}

			// Remove ARIA attributes and bound qtip events
			target.removeAttr('aria-describedby').unbind('.qtip');

			return target;
		}
	});
}

// Initialization method
function init(id, opts)
{
	var obj, posOptions, attr, config,

	// Setup element references
	elem = $(this),
	docBody = $(document.body),

	// Use document body instead of document element if needed
	newTarget = this === document ? docBody : elem,

	// Grab metadata from element if plugin is present
	metadata = (elem.metadata) ? elem.metadata(opts.metadata) : NULL,

	// If metadata type if HTML5, grab 'name' from the object instead, or use the regular data object otherwise
	metadata5 = opts.metadata.type === 'html5' && metadata ? metadata[opts.metadata.name] : NULL,

	// Grab data from metadata.name (or data-qtipopts as fallback) using .data() method,
	html5 = elem.data(opts.metadata.name || 'qtipopts');

	// If we don't get an object returned attempt to parse it manualyl without parseJSON
	try { html5 = typeof html5 === 'string' ? (new Function("return " + html5))() : html5; }
	catch(e) { debug('Unable to parse HTML5 attribute data: ' + html5); }

	// Merge in and sanitize metadata
	config = $.extend(TRUE, {}, QTIP.defaults, opts, 
		typeof html5 === 'object' ? sanitizeOptions(html5) : NULL,
		sanitizeOptions(metadata5 || metadata));

	// Remove metadata object so we don't interfere with other metadata calls
	if(metadata) { $.removeData(this, 'metadata'); }

	// Re-grab our positioning options now we've merged our metadata and set id to passed value
	posOptions = config.position;
	config.id = id;
	
	// Setup missing content if none is detected
	if('boolean' === typeof config.content.text) {
		attr = elem.attr(config.content.attr);

		// Grab from supplied attribute if available
		if(config.content.attr !== FALSE && attr) { config.content.text = attr; }

		// No valid content was found, abort render
		else { return FALSE; }
	}

	// Setup target options
	if(posOptions.container === FALSE) { posOptions.container = docBody; }
	if(posOptions.target === FALSE) { posOptions.target = newTarget; }
	if(config.show.target === FALSE) { config.show.target = newTarget; }
	if(config.show.solo === TRUE) { config.show.solo = docBody; }
	if(config.hide.target === FALSE) { config.hide.target = newTarget; }
	if(config.position.viewport === TRUE) { config.position.viewport = posOptions.container; }

	// Convert position corner values into x and y strings
	posOptions.at = new PLUGINS.Corner(posOptions.at);
	posOptions.my = new PLUGINS.Corner(posOptions.my);

	// Destroy previous tooltip if overwrite is enabled, or skip element if not
	if($.data(this, 'qtip')) {
		if(config.overwrite) {
			elem.qtip('destroy');
		}
		else if(config.overwrite === FALSE) {
			return FALSE;
		}
	}

	// Remove title attribute and store it if present
	if($.attr(this, 'title')) {
		$.attr(this, oldtitle, $.attr(this, 'title'));
		this.removeAttribute('title');
	}

	// Initialize the tooltip and add API reference
	obj = new QTip(elem, config, id, !!attr);
	$.data(this, 'qtip', obj);

	// Catch remove events on target element to destroy redundant tooltip
	elem.bind('remove.qtip', function(){ obj.destroy(); });

	return obj;
}

// jQuery $.fn extension method
QTIP = $.fn.qtip = function(options, notation, newValue)
{
	var command = ('' + options).toLowerCase(), // Parse command
		returned = NULL,
		args = command === 'disable' ? [TRUE] : $.makeArray(arguments).slice(1, 10),
		event = args[args.length - 1],
		opts = this[0] ? $.data(this[0], 'qtip') : NULL;

	// Check for API request
	if((!arguments.length && opts) || command === 'api') {
		return opts;
	}

	// Execute API command if present
	else if('string' === typeof options)
	{
		this.each(function()
		{
			var api = $.data(this, 'qtip');
			if(!api) { return TRUE; }

			// Cache the event if possible
			if(event && event.timeStamp) { api.cache.event = event; }

			// Check for specific API commands
			if((command === 'option' || command === 'options') && notation) {
				if($.isPlainObject(notation) || newValue !== undefined) {
					api.set(notation, newValue);
				}
				else {
					returned = api.get(notation);
					return FALSE;
				}
			}

			// Execute API command
			else if(api[command]) {
				api[command].apply(api[command], args);
			}
		});

		return returned !== NULL ? returned : this;
	}

	// No API commands. validate provided options and setup qTips
	else if('object' === typeof options || !arguments.length)
	{
		opts = sanitizeOptions($.extend(TRUE, {}, options));

		// Bind the qTips
		return QTIP.bind.call(this, opts, event);
	}
};

// $.fn.qtip Bind method
QTIP.bind = function(opts, event)
{
	return this.each(function(i) {
		var options, targets, events,

		// Find next available ID, or use custom ID if provided
		id = (!opts.id || opts.id === FALSE || opts.id.length < 1 || $('#'+uitooltip+'-'+opts.id).length) ? QTIP.nextid++ : opts.id,

		// Setup events namespace
		namespace = '.qtip-'+id+'-create',

		// Initialize the qTip and re-grab newly sanitized options
		api = init.call(this, id, opts);
		if(api === FALSE) { return TRUE; }
		options = api.options;

		// Initialize plugins
		$.each(PLUGINS, function() {
			if(this.initialize === 'initialize') { this(api); }
		});

		// Determine hide and show targets
		targets = { show: options.show.target, hide: options.hide.target };
		events = {
			show: $.trim('' + options.show.event).replace(/ /g, namespace+' ') + namespace,
			hide: $.trim('' + options.hide.event).replace(/ /g, namespace+' ') + namespace
		};
		
		/*
		 * If hide event is just 'unfocus', we'll use mouseleave as the hide event...
		 * since unfocus is actually library specific and won't fire as an event anywho.
		 */
		if(options.hide.event === 'unfocus') { events.hide = 'mouseleave' + namespace; }

		// Define hoverIntent function
		function hoverIntent(event) {
			function render() {
				// Cache mouse coords,render and render the tooltip
				api.render(typeof event === 'object' || options.show.ready);

				// Unbind show and hide event
				targets.show.unbind(events.show);
				targets.hide.unbind(events.hide);
			}

			// Only continue if tooltip isn't disabled
			if(api.cache.disabled) { return FALSE; }

			// Cache the event data
			api.cache.event = $.extend({}, event);

			// Start the event sequence
			if(options.show.delay > 0) {
				clearTimeout(api.timers.show);
				api.timers.show = setTimeout(render, options.show.delay);
				if(events.show !== events.hide) {
					targets.hide.bind(events.hide, function() { clearTimeout(api.timers.show); });
				}
			}
			else { render(); }
		}

		// Bind show events to target
		targets.show.bind(events.show, hoverIntent);

		// Prerendering is enabled, create tooltip now
		if(options.show.ready || options.prerender) { hoverIntent(event); }
	});
};

// Setup base plugins
PLUGINS = QTIP.plugins = {
	// Corner object parser
	Corner: function(corner) {
		corner = ('' + corner).replace(/([A-Z])/, ' $1').replace(/middle/gi, 'center').toLowerCase();
		this.x = (corner.match(/left|right/i) || corner.match(/center/) || ['inherit'])[0].toLowerCase();
		this.y = (corner.match(/top|bottom|center/i) || ['inherit'])[0].toLowerCase();

		this.precedance = (corner.charAt(0).search(/^(t|b)/) > -1) ? 'y' : 'x';
		this.string = function() { return this.precedance === 'y' ? this.y+this.x : this.x+this.y; };
		this.abbreviation = function() { 
			var x = this.x.substr(0,1), y = this.y.substr(0,1);
			return x === y ? x : (x === 'c' || (x !== 'c' && y !== 'c')) ? y + x : x + y;
		};
	},

	// Custom (more correct for qTip!) offset calculator
	offset: function(elem, container) {
		var pos = elem.offset(),
			parent = container,
			deep = 0,
			docBody = document.body,
			coffset;

		function scroll(e, i) {
			pos.left += i * e.scrollLeft();
			pos.top += i * e.scrollTop();
		}

		if(parent) {
			// Compensate for non-static containers offset
			do {
				if(parent[0] === docBody) { break; }
				else if(parent.css('position') !== 'static') {
					coffset = parent.position();
					pos.left -= coffset.left + (parseInt(parent.css('borderLeftWidth'), 10) || 0);
					pos.top -= coffset.top + (parseInt(parent.css('borderTopWidth'), 10) || 0);
					
					deep++;
				}
			}
			while(parent = parent.offsetParent());

			// Compensate for containers scroll if it also has an offsetParent
			if(container[0] !== docBody || deep > 1) { scroll( container, 1 ); }
			if(PLUGINS.iOS) { scroll( $(window), -1 ); }
		}

		return pos;
	},
	
	/*
	 * iOS 4.0 and below scroll fix detection used in offset() function.
	 */
	iOS: parseFloat(
		('' + (/CPU.*OS (3_2|4_0)|(CPU like).*AppleWebKit.*Mobile/i.exec(navigator.userAgent) || [0,'4_2'])[1])
		.replace('undefined', '3_2').replace('_','.')
	) < 4.1,
	
	/*
	 * jQuery-secpfic $.fn overrides 
	 */
	fn: {
		/* Allow other plugins to successfully retrieve the title of an element with a qTip applied */
		attr: function(attr, val) {
			if(!this.length) { return; }
			
			var self = this[0],
			title = 'title',
			api = $.data(self, 'qtip');
			
			if(attr === title) {
				if(arguments.length < 2) {
					return $.attr(self, oldtitle);
				}
				else if(typeof api === 'object') {
					// If qTip is rendered and title was originally used as content, update it
					if(api && api.rendered && api.options.content.attr === title && api.cache.attr) {
						api.set('content.text', val);
					}
					
					// Use the regular attr method to set, then cache the result
					$.fn['attr'+replaceSuffix].apply(this, arguments);
					$.attr(self, oldtitle, $.attr(self, title));
					return this.removeAttr(title);
				}
			}
		},
		
		/* Allow clone to correctly retrieve cached title attributes */
		clone: function(keepData) {
			var titles = $([]), title = 'title', elem;

			// Clone our element using the real clone method
			elem = $.fn['clone'+replaceSuffix].apply(this, arguments)
			
			// Grab all elements with an oldtitle set, and change it to regular title attribute
			.filter('[oldtitle]').each(function() {
				$.attr(this, title, $.attr(this, oldtitle));
				this.removeAttribute(oldtitle);
			})
			.end();

			return elem;
		},
		
		/* 
		 * Taken directly from jQuery 1.8.2 widget source code
		 * Trigger 'remove' event on all elements on removal if jQuery UI isn't present 
		 */
		remove: $.ui ? NULL : function( selector, keepData ) {
			$(this).each(function() {
				if (!keepData) {
					if (!selector || $.filter( selector, [ this ] ).length) {
						$('*', this).add(this).each(function() {
							$(this).triggerHandler('remove');
						});
					}
				}
			});
		}
	}
};

// Apply the fn overrides above
$.each(PLUGINS.fn, function(name, func) {
	if(!func) { return TRUE; }
	
	var old = $.fn[name+replaceSuffix] = $.fn[name];
	$.fn[name] = function() {
		return func.apply(this, arguments) || old.apply(this, arguments);
	};
});

// Cache mousemove events for positioning purposes
$(document).bind('mousemove.qtip', function(event) {
	MOUSE = { pageX: event.pageX, pageY: event.pageY, type: 'mousemove' };
});

// Set global qTip properties
QTIP.version = '2.0.0pre';
QTIP.nextid = 0;
QTIP.inactiveEvents = 'click dblclick mousedown mouseup mousemove mouseleave mouseenter'.split(' ');
QTIP.zindex = 15000;

// Define configuration defaults
QTIP.defaults = {
	prerender: FALSE,
	id: FALSE,
	overwrite: TRUE,
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
		viewport: FALSE,
		adjust: {
			x: 0, y: 0,
			mouse: TRUE,
			resize: TRUE,
			method: 'flip'
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
		inactive: FALSE,
		leave: 'window'
	},
	style: {
		classes: '',
		widget: FALSE,
		width: FALSE
	},
	events: {
		render: NULL,
		move: NULL,
		show: NULL,
		hide: NULL,
		toggle: NULL,
		focus: NULL,
		blur: NULL
	}
};
}(jQuery, window));