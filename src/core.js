// Option object sanitizer
function sanitizeOptions(opts)
{
	var content;

	if(!opts) { return FALSE; }

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

	if('style' in opts && 'object' !== typeof opts.style) {
		opts.style = {
			classes: opts.style
		};
	}

	// Sanitize plugin options
	$.each($.fn.qtip.plugins, function() {
		if(this.sanitize) { this.sanitize(opts); }
	});

	return opts;
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
	widget = 'ui-widget',
	selector = '.qtip.'+uitooltip;
	

	// Setup class attributes
	self.id = id;
	self.rendered = FALSE;
	self.elements = { target: target };
	self.cache = { event: {}, target: NULL, disabled: FALSE, position: NULL };
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

	function offset(elem, container) {
		var pos = { left: 0, top: 0 },
			addScroll = !$.fn.qtip.plugins.iOS,
			offsetParent, parentIsContainer;
		
		if(container) {
			pos = offset(container);
			pos.left *= -1; pos.top *= -1;
		}
		
		if(elem.offsetParent) {
			do {
				offsetParent = elem.offsetParent;
				parentIsContainer = offsetParent === container;

				pos.left += elem.offsetLeft - (addScroll && offsetParent && !parentIsContainer ? offsetParent.scrollLeft : 0);
				pos.top += elem.offsetTop - (addScroll &&  offsetParent && !parentIsContainer ? offsetParent.scrollTop : 0);
			}
			while(elem = offsetParent);
		}
		
		return pos;
	}

	function calculate(detail, fluid)
	{
		var tooltip = self.elements.tooltip,
			accessible = uitooltip + '-accessible ' + (fluid ? uitooltip + '-accessible-fluid' : ''),
			show = !tooltip.is(':visible'),
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
				returned = offset(tooltip[0], options.position.container);
			break;
		}
		if(show) { tooltip.removeClass(accessible); }

		return returned;
	}

	function setWidget() {
		var elems = self.elements,
			on = options.style.widget;

		elems.tooltip.toggleClass(widget, on);
		elems.content.toggleClass(widget+'-content', on);
		
		if(elems.titlebar){
			elems.titlebar.toggleClass(widget+'-header', on);
		}
		if(elems.button){
			elems.button.children('span').toggleClass(uitooltip+'-icon', !on).toggleClass('ui-icon', on);
		}
	}

	function removeTitle()
	{
		var elems = self.elements;

		if(elems.title) {
			elems.titlebar.remove();
			elems.titlebar = elems.title = elems.button = NULL;
			elems.tooltip.removeAttr('aria-labelledby');
			self.reposition();
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
				'title': 'Close tooltip'
			})
			.prepend(
				$('<span />', { 'class': (options.style.widget ? 'ui' : uitooltip) + '-icon ui-icon-close' })
			);
		}

		// Create button and setup attributes
		elems.button
			.prependTo(elems.titlebar)
			.attr('role', 'button')
			.addClass(uitooltip + '-close')
			.hover(function(event){ $(this).toggleClass('ui-state-hover', event.type === 'mouseenter'); })
			.click(function() {
				if(!elems.tooltip.hasClass('ui-state-disabled')) { self.hide(); }
				return FALSE;
			})
			.bind('mousedown keydown mouseup keyup mouseout', function(event) {
				$(this).toggleClass('ui-state-active ui-state-focus', (/down$/i).test(event.type));
			});

		// Redraw the tooltip when we're done
		self.redraw();
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
		.insertBefore(elems.content);

		// Create button if enabled
		if(options.content.title.button) { createButton(); }

		// Redraw the tooltip dimensions if it's rendered
		else if(self.rendered === TRUE){ self.redraw(); } 
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
					self.redraw();
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

				return TRUE;
			});

			// If no images were found, continue with queue
			if(images.length === 0) { imageLoad(images);  }
		});

		return self;
	}

	function assignEvents(show, hide, tooltip, doc)
	{
		var namespace = '.qtip-'+id,
			posOptions = options.position,
			targets = {
				show: options.show.target,
				hide: options.hide.target,
				tooltip: self.elements.tooltip,
				container: posOptions.container[0] === document.body ? document : posOptions.container
			},
			events = { show: String(options.show.event).split(' '), hide: String(options.hide.event).split(' ') },
			IE6 = $.browser.msie && parseInt($.browser.version, 10) === 6;

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
			var callback = function(){ self.show(event); };
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
			var ontoTooltip = $(event.relatedTarget || event.target).parents(selector)[0] === targets.tooltip[0],
				ontoTarget = $(event.relatedTarget || event.target)[0] === targets.show[0];

			// Clear timers and stop animation queue
			clearTimeout(self.timers.show);
			clearTimeout(self.timers.hide);

			// Prevent hiding if tooltip is fixed and event target is the tooltip. Or if mouse positioning is enabled and cursor momentarily overlaps
			if(options.hide.fixed && ((posOptions.target === 'mouse' && ontoTooltip) || ((/mouse(out|leave|move)/).test(event.type) && (ontoTooltip || ontoTarget))))
			{
				// Prevent default and popagation
				event.stopPropagation();
				event.preventDefault();
				return FALSE;
			}

			// If tooltip has displayed, start hide timer
			targets.tooltip.stop(1, 1);

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
			if(self.cache.processing) { return; }

			// Only update position if tooltip is visible
			self.cache.processing = 1;
			if(self.elements.tooltip.is(':visible')) { self.reposition(event); }
			self.cache.processing = 0;
		}

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
			if(posOptions.adjust.resize || posOptions.viewport) {
				$($.event.special.resize ? posOptions.viewport : window).bind('resize'+namespace, repositionMethod);
			}

			// Adjust tooltip position on scroll if screen adjustment is enabled
			if(posOptions.viewport || (IE6 && targets.tooltip.css('position') === 'fixed')) {
				$(posOptions.viewport).bind('scroll'+namespace, repositionMethod);
			}

			// Hide tooltip on document mousedown if unfocus events are enabled
			if((/unfocus/i).test(options.hide.event)) {
				$(document).bind('mousedown'+namespace, function(event) {
					var tooltip = self.elements.tooltip;

					if($(event.target).parents(selector).length === 0 && $(event.target).add(target).length > 1 &&
					tooltip.is(':visible') && !tooltip.hasClass('ui-state-disabled')) {
						self.hide(event);
					}
				});
			}

			// If mouse is the target, update tooltip position on document mousemove
			if(posOptions.target === 'mouse') {
				$(document).bind('mousemove'+namespace, function(event) {
					// Update the tooltip position only if the tooltip is visible and adjustment is enabled
					if(posOptions.adjust.mouse && !targets.tooltip.hasClass('ui-state-disabled') && targets.tooltip.is(':visible')) {
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
				show: show ? options.show.target : NULL,
				hide: hide ? options.hide.target : NULL,
				tooltip: tooltip ? self.elements.tooltip : NULL,
				content: tooltip ? self.elements.content : NULL,
				container: doc ? options.position.container[0] === document.body ? document : options.position.container : NULL,
				window: doc ? window : NULL
			};

		// Check if tooltip is rendered
		if(self.rendered)
		{
			$([]).pushStack(
				$.grep(
					[ targets.show, targets.hide, targets.tooltip, targets.container, targets.content, targets.window ],
					function(){ return this !== null; }
				)
			)
			.unbind(namespace);
		}

		// Tooltip isn't yet rendered, remove render event
		else if(show) { targets.show.unbind(namespace+'-create'); }
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

			// Create tooltip element
			elements.tooltip = $('<div/>')
				.attr({
					'id': uitooltip + '-'+id,
					'role': 'tooltip',
					'class': uitooltip + ' qtip ui-tooltip-accessible ui-helper-reset ' + options.style.classes,
					'css': {
						'z-index': $.fn.qtip.zindex + $(selector).length
					}
				})
				.toggleClass('ui-state-disabled', self.cache.disabled)
				.data('qtip', self)
				.appendTo(options.position.container);

			// Create content element
			elements.content = $('<div />', {
					'class': uitooltip + '-content',
					'id': uitooltip + '-' + id + '-content'
				})
				.appendTo(elements.tooltip);

			// Setup title and update content
			if(options.content.title.text) { createTitle(); }
			updateContent(options.content.text);

			// Initialize 'render' plugins
			$.each($.fn.qtip.plugins, function() {
				if(this.initialize === 'render') { this(self); }
			});

			// Set rendered status to TRUE
			self.rendered = TRUE;

			// Assign events
			assignEvents(1, 1, 1, 1);
			$.each(options.events, function(name, callback) {
				if(callback) {
					var events = name === 'toggle' ? 'tooltipshow tooltiphide' : 'tooltip'+name;
					elements.tooltip.bind(events, callback);
				}
			});

			/* Queue this part of the render process in our fx queue so we can
			 * load images before the tooltip renders fully.
			 *
			 * See: updateContent method
			*/
			elements.tooltip.queue('fx', function(next) {
				// Remove accessible class
				elements.tooltip.removeClass('ui-tooltip-accessible');

				// Trigger tooltiprender event and pass original triggering event as original
				callback.originalEvent = self.cache.event;
				elements.tooltip.trigger(callback, [self]);

				// Update tooltip position and show tooltip if needed
				if(options.show.ready || show) {
					elements.tooltip.hide();
					self.show(self.cache.event);
				}

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
						'^id$': function(obj, opt, val, prev) {
							var id = value === TRUE ? $.fn.qtip.nextid : value,
								idStr = uitooltip + '-' + id;

							if(id !== FALSE && id.length > 0 && !$('#ui-tooltip-'+id).length) {
								tooltip[0].id = idStr;
								elems.content[0].id = idStr + '-content';
								elems.title[0].id = idStr + '-title';
							}
						},

						// Content checks
						'^content.text$': function(){ updateContent(value); },
						'^content.title.text$': function(){ updateTitle(value); },
						'^content.title.button$': function(){ updateButton(value); },

						// Position checks
						'^position.(my|at)$': function(){
							// Parse new corner value into Corner objecct
							var corner = (/my$/i).test(notation) ? 'my' : 'at';

							if('string' === typeof value) {
								options.position[corner] = new $.fn.qtip.plugins.Corner(value);
							}
						},

						'^position.container$': function(){
							if(self.rendered === TRUE) { 
								tooltip.appendTo(value); 
							}
						},

						// Show & hide checks
						'^(show|hide).(event|target|fixed|delay|inactive)$': function(obj, opt, val, prev) {
							var args = notation.search(/fixed/i) > -1 ? [0, [0,1,1,1]] : [notation.substr(0,3), notation.charAt(0) === 's' ? [1,0,0,0] : [0,1,0,0]];

							if(args[0]) { obj[opt] = prev; }
							unassignEvents.apply(self, args[1]);

							if(args[0]) { obj[opt] = val; }
							assignEvents.apply(self, args[1]);
						},
						'^show.ready$': function() { if(self.rendered === FALSE) { self.show(); } },

						// Style checks
						'^style.classes$': function() { 
							self.elements.tooltip.attr('class', uitooltip + ' qtip ui-helper-reset ' + value);
						},
						'^style.widget|content.title': setWidget,

						// Events check
						'^events.(render|show|move|hide|focus|blur)$': function(obj, opt, val, prev) {
							elems.tooltip[($.isFunction(value) ? '' : 'un') + 'bind']('tooltip'+opt, val);
						},

						// Update position on ANY style update or position change
						'^position.(my|at|adjust|target|container)|style|content': function(){ 
							self.reposition();
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
			sanitizeOptions(options);

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
				callback;

			// Detect state if valid one isn't provided
			if((typeof state).search('boolean|number')) { state = !tooltip.is(':visible'); }

			// Return if element is already in correct state
			if((!visible && !state) || tooltip.is(':animated')) { return self; }

			// Try to prevent flickering when tooltip overlaps show element
			if(event) {
				if((/over|enter/).test(event.type) && (/out|leave/).test(self.cache.event.type) &&
					event.target === options.show.target[0] && tooltip.has(event.relatedTarget).length){
					return self;
					}

				// Cache event
				self.cache.event = $.extend({}, event);
			}

			// Define after callback
			function after()
			{
				var elem = $(this),
					attr = state ? 'attr' : 'removeAttr',
					opacity = (/^1|0$/).test(elem.css('opacity')),
					ieStyle = this.style;

				// Apply ARIA attributes when tooltip is shown
				if(self.elements.title){ target[attr]('aria-labelledby', uitooltip + '-'+id+'-title'); }
				target[attr]('aria-describedby', uitooltip + '-'+id+'-content');

				// Prevent antialias from disappearing in IE7 by removing filter and opacity attribute
				if(state) {
					if($.browser.msie && ieStyle && opacity) {
						ieStyle.removeAttribute('filter');
						ieStyle.removeAttribute('opacity');
					}
				}

				// Otherwise just hide
				else if(opacity) { elem.hide(); }
			}

			// Call API methods
			callback = $.Event('tooltip'+type); 
			callback.originalEvent = event ? self.cache.event : NULL;
			tooltip.trigger(callback, [self, 90]);
			if(callback.isDefaultPrevented()){ return self; }

			// Execute state specific properties
			if(state) {
				self.focus(); // Focus the tooltip before show to prevent visual stacking
				self.reposition(event); // Update tooltip position

				// Hide other tooltips if tooltip is solo
				if(opts.solo) { $(selector).qtip('hide'); }
			}

			// Clear show timer if we're hiding 
			else { clearTimeout(self.timers.show); }

			// Set ARIA hidden status attribute
			tooltip.attr('aria-hidden', Boolean(!state));

			// Clear animation queue
			tooltip.stop(1, 1);

			// Use custom function if provided
			if($.isFunction(opts.effect)) {
				opts.effect.call(tooltip, self);
				tooltip.queue(function(){ after.call(this); $(this).dequeue(); });
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

		show: function(event){ self.toggle(TRUE, event); },

		hide: function(event){ self.toggle(FALSE, event); },

		focus: function(event)
		{
			if(self.rendered === FALSE) { return FALSE; }

			var tooltip = self.elements.tooltip,
				qtips = $(selector),
				curIndex = parseInt(tooltip[0].style.zIndex, 10),
				newIndex = $.fn.qtip.zindex + qtips.length,
				focusClass = uitooltip + '-focus',
				cachedEvent = $.extend({}, event),
				callback;

			// Only update the z-index if it has changed and tooltip is not already focused
			if(!tooltip.hasClass(focusClass) && curIndex !== newIndex)
			{
				// Reduce our z-index's and keep them properly ordered
				qtips.each(function() {
					this.style.zIndex = this.style.zIndex - 1;
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
				tooltip.trigger(callback, [self, newIndex]);

				// Set the new z-index and set focus status to TRUE if callback wasn't FALSE
				if(!callback.isDefaultPrevented()) {
					tooltip.addClass(focusClass)[0].style.zIndex = newIndex;
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
				adjust = posOptions.adjust,
				elemWidth = self.elements.tooltip.outerWidth(),
				elemHeight = self.elements.tooltip.outerHeight(),
				targetWidth = 0,
				targetHeight = 0,
				callback = $.Event('tooltipmove'),
				fixed = tooltip.css('position') === 'fixed',
				viewport = posOptions.viewport.jquery ? posOptions.viewport : $(window),
				position = { left: 0, top: 0 },
				readjust = {
					left: function(posLeft) {
						var viewportScroll = viewport.scrollLeft,
							myWidth = my.x === 'left' ? elemWidth : my.x === 'right' ? -elemWidth : -elemWidth / 2,
							atWidth = at.x === 'left' ? targetWidth : at.x === 'right' ? -targetWidth : -targetWidth / 2,
							overflowLeft = viewportScroll - posLeft,
							overflowRight = posLeft + elemWidth - viewport.width - viewportScroll,
							offset = myWidth - (my.precedance === 'x' || my.x === my.y ? atWidth : 0);

						if(overflowLeft > 0 && (my.x !== 'left' || overflowRight > 0)) {
							position.left -= offset;
						}
						else if(overflowRight > 0 && (my.x !== 'right' || overflowLeft > 0)  ) {
							position.left -= (my.x === 'center' ? -1 : 1) * offset + (2 * adjust.x);
						}

						// Make sure we haven't made things worse with the adjustment and return the adjusted difference
						if(position.left < 0 && -position.left > overflowRight) { position.left = posLeft; }
						return position.left - posLeft;
					},
					top: function(posTop) {
						var viewportScroll = viewport.scrollTop,
							myHeight = my.y === 'top' ? elemHeight : my.y === 'bottom' ? -elemHeight : -elemHeight / 2,
							atHeight = at.y === 'top' ? targetHeight : at.y === 'bottom' ? -targetHeight : -targetHeight / 2,
							overflowTop = viewportScroll - posTop,
							overflowBottom = posTop + elemHeight - viewport.height - viewportScroll,
							offset = myHeight - (my.precedance === 'y' || my.x === my.y ? atHeight : 0);

						if(overflowTop > 0 && (my.y !== 'top' || overflowBottom > 0)) {
							position.top -= offset;
						}
						else if(overflowBottom > 0 && (my.y !== 'bottom' || overflowTop > 0)  ) {
							position.top -= (my.y === 'center' ? -1 : 1) * offset + (2 * adjust.y);
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
				event = event && (event.type === 'resize' || event.type === 'scroll') ? self.cache.event :
					adjust.mouse || !event || !event.pageX ? $.extend({}, $.fn.qtip.mouse) : event;

				// Use event coordinates for position
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
							top: fixed ? 0 : viewport.scrollTop,
							left: fixed ? 0 : viewport.scrollLeft
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

					position = offset(target[0], posOptions.container[0]);
				}

				// Adjust position relative to target
				position.left += at.x === 'right' ? targetWidth : at.x === 'center' ? targetWidth / 2 : 0;
				position.top += at.y === 'bottom' ? targetHeight : at.y === 'center' ? targetHeight / 2 : 0;
			}

			// Adjust position relative to tooltip
			position.left += adjust.x + (my.x === 'right' ? -elemWidth : my.x === 'center' ? -elemWidth / 2 : 0);
			position.top += adjust.y + (my.y === 'bottom' ? -elemHeight : my.y === 'center' ? -elemHeight / 2 : 0);

			// Calculate collision offset values
			if(posOptions.viewport.jquery && target[0] !== window && target[0] !== document.body) {
				position.adjusted = { left: readjust.left(position.left), top: readjust.top(position.top) };
			}
			else {
				position.adjusted = { left: 0, top: 0 };
			}

			// Set tooltip position class
			tooltip.attr('class', function(i, val) {
				return $(this).attr('class').replace(/ui-tooltip-pos-\w+/i, '');
			})
			.addClass(uitooltip + '-pos-' + my.abbreviation());

			// Call API method
			callback.originalEvent = $.extend({}, event);
			tooltip.trigger(callback, [self, position, viewport.elem]);
			if(callback.isDefaultPrevented()){ return self; }
			delete position.adjusted;

			// Use custom function if provided
			if(tooltip.is(':visible') && $.isFunction(posOptions.effect)) {
				posOptions.effect.call(tooltip, self, position);
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

		// IE max/min height/width simulartor function
		redraw: function()
		{
			// Make sure tooltip is rendered and the browser needs the redraw
			if(!self.rendered || !($.browser.msie && parseInt($.browser.version.charAt(0), 10) < 9)) { return FALSE; }

			var tooltip = self.elements.tooltip, 
				style = tooltip.attr('style'),
				dimensions;

			// Determine actual dimensions using our calculate function
			tooltip.css({ width: 'auto', height: 'auto' });
			dimensions = calculate('dimensions', 1);

			// Determine actual width
			$.each(['width', 'height'], function(i, prop) {
				// Parse our max/min properties
				var max = parseInt(tooltip.css('max-'+prop), 10) || 0,
					min = parseInt(tooltip.css('min-'+prop), 10) || 0;

				// Determine new dimension size based on max/min/current values
				dimensions[prop] = max + min ? Math.min( Math.max( dimensions[prop], min ), max ) : dimensions[prop];
			});

			// Set the newly calculated dimensions
			tooltip.css(dimensions);
		},

		disable: function(state)
		{
			var tooltip = self.elements.tooltip,
				c = 'ui-state-disabled';
			
			if('boolean' !== typeof state) {
				state = !(tooltip.hasClass(c) || self.cache.disabled);
			}
			 
			if(self.rendered) {
				tooltip.toggleClass(c, state);
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

			// Destroy tooltip and  any associated plugins if rendered
			if(self.rendered) {
				elements.tooltip.remove();
				
				$.each(self.plugins, function() {
					if(this.initialize === 'render') { this.destroy(); }
				});
			}

			// Clear timers and remove bound events
			clearTimeout(self.timers.show);
			clearTimeout(self.timers.hide);
			unassignEvents(1, 1, 1, 1);

			// Remove api object
			target.removeData('qtip');

			// Reset old title attribute if removed and reset describedby attribute
			if(oldtitle) {
				target.attr('title', oldtitle);
			}
			target.removeAttr('aria-describedby');

			return target;
		}
	});
}

// Initialization method
function init(id, opts)
{
	var obj, posOptions,

	// Setup element references
	elem = $(this),
	docBody = $(document.body),

	// Use document body instead of document element if needed
	newTarget = this === document ? docBody : elem,

	// Grab metadata from element if plugin is present
	metadata = (elem.metadata) ? elem.metadata(opts.metadata) : NULL,

	// Check if the metadata returned is in HTML5 form and grab 'name' from the object instead
	metadata5 = metadata && opts.metadata.type === 'html5' ? metadata[opts.metadata.name] : NULL,

	// Merge in our sanitized metadata and remove metadata object so we don't interfere with other metadata calls
	config = $.extend(TRUE, {}, $.fn.qtip.defaults, opts, sanitizeOptions(metadata5 || metadata));
	elem.removeData('metadata');

	// Re-grab our positioning options now we've merged our metadata
	posOptions = config.position;

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

	// Remove title attribute and store it if present
	if(elem.attr('title')) {
		elem.data('oldtitle', elem.attr('title')).removeAttr('title');
	}

	// Initialize the tooltip and add API reference
	obj = new QTip(elem, config, id);
	elem.data('qtip', obj);

	// Catch remove events on target element to destroy redundant tooltip
	elem.bind('remove.qtip', function(){ obj.destroy(); });

	return obj;
}

// jQuery $.fn extension method
$.fn.qtip = function(options, notation, newValue)
{
	var command = String(options).toLowerCase(), // Parse command
		returned = NULL,
		args = command === 'disable' ? [TRUE] : $.makeArray(arguments).slice(1, 10),
		event = args[args.length - 1],
		opts;

	// Check for API request
	if((!arguments.length && this.data('qtip')) || command === 'api') {
		opts = this.data('qtip');
		return opts ? opts : undefined;
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
					api.render(1);
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
	else if('object' === typeof options || !arguments.length)
	{
		opts = sanitizeOptions($.extend(TRUE, {}, options));

		// Bind the qTips
		return $.fn.qtip.bind.call(this, opts, event);
	}
};

// $.fn.qtip Bind method
$.fn.qtip.bind = function(opts, event)
{
	return this.each(function(i) {
		var options, targets, events,
			
		// Find next available ID, or use custom ID if provided
		id = opts.id = (!opts.id || opts.id === FALSE || opts.id.length < 1 || $('#ui-tooltip-'+opts.id).length) ? $.fn.qtip.nextid++ : opts.id,
		
		// Setup events namespace
		namespace = '.qtip-'+id+'-create',

		// Initialize the qTip and re-grab newly sanitized options
		self = init.call(this, id, opts);
		if(self === FALSE) { return TRUE; }
		options = self.options;

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
		if(options.show.ready || options.prerender) { hoverIntent(event); }
	});
};

// Override some of the core jQuery methods for library-specific purposes
$.each({
	/* Allow other plugins to successfully retrieve the title of an element with a qTip applied */
	attr: function(attr) {
		var self = $(this), api = self.data('qtip');
		return (arguments.length === 1 && attr === 'title' && api && api.rendered === TRUE) ? self.data('oldtitle') : NULL;
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
$.fn.qtip.version = '@VERSION';
$.fn.qtip.nextid = 0;
$.fn.qtip.inactiveEvents = 'click dblclick mousedown mouseup mousemove mouseleave mouseenter'.split(' ');
$.fn.qtip.zindex = 15000;

// Setup base plugins
$.fn.qtip.plugins = {
	// Corner object parser
	Corner: function(corner) {
		corner = String(corner).replace(/([A-Z])/, ' $1').replace(/middle/gi, 'center').toLowerCase();
		this.x = (corner.match(/left|right/i) || corner.match(/center/) || ['inherit'])[0].toLowerCase();
		this.y = (corner.match(/top|bottom|center/i) || ['inherit'])[0].toLowerCase();

		this.precedance = (corner.charAt(0).search(/^(t|b)/) > -1) ? 'y' : 'x';
		this.string = function() { return this.precedance === 'y' ? this.y+this.x : this.x+this.y; };
		this.abbreviation = function() { 
			var x = this.x.substr(0,1), y = this.y.substr(0,1);
			return x === y ? x : (x === 'c' || (x !== 'c' && y !== 'c')) ? y + x : x + y;
		};
	},
	
	/*
	 * iOS 4.0 and below scroll fix detection used in offset() function.
	 */
	iOS: parseFloat(((/CPU.+OS ([0-9_]{3}).*AppleWebkit.*Mobile/i.exec(navigator.userAgent)) || [0,'4_2'])[1].replace('_','.')) < 4.1
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
		viewport: FALSE,
		adjust: {
			x: 0, y: 0,
			mouse: TRUE,
			resize: TRUE
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
		render: NULL,
		move: NULL,
		show: NULL,
		hide: NULL,
		toggle: NULL,
		focus: NULL,
		blur: NULL
	}
};