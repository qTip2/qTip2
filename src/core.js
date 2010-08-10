// Option object sanitizer
function sanitizeOptions(opts)
{
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

			var noContent = opts.content.text || FALSE;
			if(noContent.length < 1 || (!noContent && !noContent.attr) || (noContent.jquery && noContent.is(':empty'))) {
				opts.content.text = FALSE;
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

	// Sanitize plugin options
	$.each($.fn.qtip.plugins, function() {
		if(this.sanitize) { this.sanitize(opts); }
	});
}

/*
* Core plugin implementation
*/
function QTip(target, options, id)
{
	// Declare this reference
	var self = this;

	// Setup class attributes
	self.id = id;
	self.rendered = FALSE;
	self.elements = { target: target };
	self.cache = { event: {}, target: NULL, disabled: FALSE };
	self.timers = {};
	self.options = options;
	self.plugins = {};

	/*
	* Private core functions
	*/
	function convertNotation(notation)
	{
		var actual, option, i;

		// Split notation into array
		actual = notation.split('.');

		// Locate required option
		option = options[ actual[0] ];
		for(i = 1; i < actual.length; i+=1) {
			if(typeof option[ actual[i] ] === 'object' && !option[ actual[i] ].jquery) {
				option = option[ actual[i] ];
			}
			else{ break; }
		}

		return [option, actual[i] ];
	}

	function calculate(detail)
	{
		var tooltip = self.elements.tooltip,
			accessible = 'ui-tooltip-accessible',
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
			
			case 'offsetParent':
				returned = tooltip.offsetParent();
			break;

			case 'position':
				returned = tooltip.offset();
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
		if(!self.rendered || !$.browser.msie) { return FALSE; }

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

	function createTitle()
	{
		var elems = self.elements,
			button = options.content.title.button;

		// Destroy previous title element, if present
		if(elems.titlebar) { removeTitle(); }

		// Create title bar and title elements
		elems.titlebar = $('<div />', {
			'class': 'ui-tooltip-titlebar ' + (options.style.widget ? 'ui-widget-header' : '')
		})
		.append(
			elems.title = $('<div />', {
				'id': 'ui-tooltip-'+id+'-title',
				'class': 'ui-tooltip-title',
				'html': options.content.title.text
			})
		)
		.prependTo(elems.wrapper);

		// Create title close buttons if enabled
		if(button) {
			// Use custom button if one was supplied by user, else use default
			if(button.jquery) {
				elems.button = button;
			}
			else if('string' === typeof button) {
				elems.button = $('<a />', { 'html': button });
			}
			else {
				elems.button = $('<a />', {
					'class': 'ui-state-default'
				})
				.append(
					$('<span />', { 'class': 'ui-icon ui-icon-close' })
				);
			}

			// Setup event handlers
			elems.button
				.prependTo(elems.titlebar)
				.attr('role', 'button')
				.addClass('ui-tooltip-' + (button === TRUE ? 'close' : 'button'))
				.hover(function(event){ $(this).toggleClass('ui-state-hover', event.type === 'mouseenter'); })
				.click(function() {
					if(!elems.tooltip.hasClass('ui-state-disabled')) { self.hide(); }
					return FALSE;
				})
				.bind('mousedown keydown mouseup keyup mouseout', function(event) {
					$(this).toggleClass('ui-state-active ui-state-focus', (/down$/i).test(event.type));
				});
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
		// Make sure tooltip is rendered and content is defined. If not return
		if(!self.rendered || !content) { return FALSE; }

		// Append new content if its a DOM array and show it if hidden
		if(content.jquery && content.length > 0) {
			self.elements.content.append(content.css({ display: 'block' }));
		}

		// Content is a regular string, insert the new content
		else {
			self.elements.content.html(content);
		}

		// Update width and position
		updateWidth();
		self.reposition(self.cache.event);

		// Show the tooltip if rendering is taking place
		if(self.rendered < 0) {
			// Show tooltip on ready
			if(options.show.ready || self.rendered === -2) {
				self.show(self.cache.event);
			}

			// Set rendered status to TRUE
			self.rendered = TRUE;
		}

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
			self.timers.show = setTimeout(function(){ self.show(event); }, options.show.delay);
		}

		// Define hide method
		function hideMethod(event)
		{
			if(targets.tooltip.hasClass('ui-state-disabled')) { return FALSE; }

			// Check if new target was actually the tooltip element
			var ontoTooltip = $(event.relatedTarget).parents('.qtip.ui-tooltip')[0] == targets.tooltip[0];

			// Clear timers and stop animation queue
			clearTimeout(self.timers.show);
			clearTimeout(self.timers.hide);

			// Prevent hiding if tooltip is fixed and event target is the tooltip. Or if mouse positioning is enabled and cursor momentarily overlaps
			if((options.position.target === 'mouse' && ontoTooltip) || (options.hide.fixed && (/mouse(out|leave|move)/).test(event.type) && ontoTooltip))
			{
				// Prevent default and popagation
				event.stopPropagation();
				event.preventDefault();
				return FALSE;
			}

			// If tooltip has displayed, start hide timer
			targets.tooltip.stop(TRUE, TRUE);
			self.timers.hide = setTimeout(function(){ self.hide(event); }, options.hide.delay);
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

					if($(event.target).parents('.qtip.ui-tooltip').length === 0 && $(event.target).add(target).length > 1 &&
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
						self.reposition(event);
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
			var elements = self.elements;

			// If tooltip has already been rendered, exit
			if(self.rendered) { return FALSE; }

			// Call API method and set rendered status
			self.rendered = show ? -2 : -1; // -1: rendering	 -2: rendering and show when done

			// Create initial tooltip elements
			elements.tooltip = $('<div/>')
				.attr({
					id: 'ui-tooltip-'+id,
					role: 'tooltip'
				})
				.addClass('qtip ui-tooltip ui-helper-reset '+options.style.classes)
				.toggleClass('ui-widget', options.style.widget)
				.toggleClass('ui-state-disabled', self.cache.disabled)
				.css('z-index', $.fn.qtip.zindex + $('div.qtip.ui-tooltip').length)
				.data('qtip', self)
				.appendTo(options.position.container);

			// Append to container element
			elements.wrapper = $('<div />').addClass('ui-tooltip-wrapper').appendTo(elements.tooltip);
			elements.content = $('<div />').addClass('ui-tooltip-content')
				.attr('id', 'ui-tooltip-'+id+'-content')
				.addClass('ui-tooltip-content')
				.toggleClass('ui-widget-content', options.style.widget)
				.appendTo(elements.wrapper);

			// Create title if enabled
			if(options.content.title.text) {
				createTitle();
			}

			// Initialize plugins and apply border
			$.each($.fn.qtip.plugins, function() {
				if(this.initialize === 'render') { this(self); }
			});

			// Assign events
			assignEvents(1, 1, 1, 1);
			$.each(options.events, function(name, callback) {
				elements.tooltip.bind('tooltip'+name, callback);
			});
			
			// Catch remove events on target element to destroy tooltip
			target.bind('remove.qtip', function(){ self.destroy(); });

			// Set the tooltips content
			updateContent(options.content.text);

			// Call API method and if return value is FALSE, halt
			elements.tooltip.trigger('tooltiprender', [self.hash()]);

			return self;
		},

		get: function(notation)
		{
			var result, option;

			switch(notation.toLowerCase())
			{
				case 'offset':
					result = calculate('position');
				break;

				case 'dimensions':
					result = calculate('dimensions');
				break;

				default:
					option = convertNotation(notation.toLowerCase());
					result = (option[0].precedance) ? option[0].string() : (option[0].jquery) ? option[0] : option[0][ option[1] ];
				break;
			}

			return result;
		},

		set: function(notation, value)
		{
			var option = convertNotation(notation.toLowerCase()),
				previous,
				category, rule,
				checks = {
					builtin: {
						// Content checks
						'^content.text': function(){ updateContent(value); },
						'^content.title.text': function(){ updateTitle(value); },

						// Position checks
						'^position.container$': function(){ if(self.rendered) { self.elements.tooltip.appendTo(value); } },
						'^position.(corner|adjust|target)': function(){ if(self.rendered) { self.reposition(); } },
						'^position.(my|at)$': function(){
							// Parse new corner value into Corner objecct
							var corner = (notation.search(/my$/i) > -1) ? 'my' : 'at';

							if('string' === typeof value) {
								options.position[corner] = new $.fn.qtip.plugins.Corner(value);
							}
						},

						// Show & hide checks
						'^(show|hide).(event|target|fixed)': function(obj, opt, val, prev) {
							var args = (notation.search(/fixed/i) > -1) ? [0, [0,1,1,1]] : (notation.search(/hide/i) < 0) ? ['show', [1,0,0,0]] : ['hide', [0,1,0,0]];

							if(args[0]) { obj[opt] = prev; }
							unassignEvents.apply(self, args[1]);

							if(args[0]) { obj[opt] = val; }
							assignEvents.apply(self, args[1]);
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
			option[0][ option[1] ] = value;

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
			if(!self.rendered) { return FALSE; }

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
				var attr = state ? 'attr' : 'removeAttr';

				// Reset opacity to avoid bugs
				$(this).css({ opacity: '', height: '' });

				// Apply ARIA attributes when tooltip is shown
				if(self.elements.title){ target[attr]('aria-labelledby', 'ui-tooltip-'+id+'-title'); }
				target[attr]('aria-describedby', 'ui-tooltip-'+id+'-content');

				// Prevent antialias from disappearing in IE7 by removing filter and opacity attribute
				if(state) {
					if($.browser.msie && $(this).get(0).style) { 
						ieStyle = $(this).get(0).style;
						ieStyle.removeAttribute('filter');
						ieStyle.removeAttribute('opacity');
					}
				}
				else {
					$(this).hide();
				}
			}

			// Return if element is already in correct state
			if((visible && state) || (!visible && !state) || tooltip.is(':animated')) { return self; }

			// Attempt to prevent 'blinking' effect when tooltip and show target overlap
			if(event) {
				// Compare targets and events
				if(self.cache.event && (/over|enter/).test(event.type) && (/out|leave/).test(self.cache.event.type) &&
				$(event.target).add(options.show.target).length < 2 && $(event.relatedTarget).parents('.qtip.ui-tooltip').length > 0){
					return self;
				}

				// Cache event
				self.cache.event = $.extend({}, event);
			}

			// Call API methods
			callback = $.Event('tooltip'+type);
			tooltip.trigger(callback, [self.hash(), 90]);
			if(callback.isDefaultPrevented()){ return self; }

			// Execute state specific properties
			if(state) {
				// Check tooltip is full rendered
				if(self.rendered === TRUE) {
					self.focus(); // Focus the tooltip before show to prevent visual stacking
					self.reposition(event); // Update tooltip position
				}

				// Hide other tooltips if tooltip is solo
				if(opts.solo) { $(':not(.qtip.ui-tooltip)').qtip('hide'); }
			}
			else {
				// Clear timeout and reset opacity
				clearTimeout(self.timers.show);  // Clear show timer
				tooltip.css({ opacity: '' }); // Reset opacity
			}

			// Set ARIA hidden status attribute
			tooltip.attr('aria-hidden', Boolean(!state));

			// Clear animation queue
			tooltip.stop(TRUE, FALSE);

			// Use custom function if provided
			if($.isFunction(opts.effect)) {
				opts.effect.call(tooltip);
				tooltip.queue(function(){ after(); $(this).dequeue(); });
			}

			// If no effect type is supplied, use a simple toggle
			else if(opts.effect === FALSE) {
				tooltip[ type ]();
				after();
			}

			// Use basic fade function
			else {
				tooltip.fadeTo(90, state ? 100 : 0, after);
			}

			// If inactive hide method is set, active it
			if(state) { opts.target.trigger('qtip-'+id+'-inactive'); }

			return self;
		},

		show: function(event){ self.toggle(TRUE, event); },

		hide: function(event){ self.toggle(FALSE, event); },

		focus: function(event)
		{
			if(!self.rendered) { return FALSE; }

			var tooltip = self.elements.tooltip,
				curIndex = parseInt(tooltip.css('z-index'), 10),
				newIndex = $.fn.qtip.zindex + $('.qtip.ui-tooltip').length,
				focusClass = 'ui-tooltip-focus',
				callback;

			// Only update the z-index if it has changed and tooltip is not already focused
			if(!tooltip.hasClass(focusClass) && curIndex !== newIndex)
			{
				$('.qtip.ui-tooltip').each(function()
				{
					var api = $(this).qtip(), tooltip, elemIndex;
					if(!api || !api.rendered) { return TRUE; }
					tooltip = api.elements.tooltip;

					// Reduce all other tooltip z-index by 1
					elemIndex = parseInt(tooltip.css('z-index'), 10);
					if(!isNaN(elemIndex)) { tooltip.css({ zIndex: elemIndex - 1 }); }

					// Set focused status to FALSE
					tooltip.removeClass(focusClass);

					// Trigger blur event
					tooltip.trigger('tooltipblur', [api, newIndex]);
				});

				// Call API method
				callback = $.Event('tooltipfocus');
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
				targetWidth = 0,
				targetHeight = 0,
				position = { left: 0, top: 0 },
				callback = $.Event('tooltipmove'),
				adjust = {
					left: function(posLeft) {
						var targetLeft = target === 'mouse' ? event.pageX : target.offset().left,
							winScroll = $(window).scrollLeft(),
							winWidth = $(window).width(),
							myOffset = my.x === 'left' ? -elemWidth : my.x === 'right' ? elemWidth : elemWidth / 2,
							atOffset = at.x === 'left' ? targetWidth : at.x === 'right' ? -targetWidth : targetWidth / 2,
							adjustX = -2 * posOptions.adjust.x,
							newOffset = atOffset + myOffset + adjustX,
							overflowLeft = winScroll - posLeft,
							overflowRight = posLeft + elemWidth - winWidth - winScroll;

						if(overflowLeft > 0 && posLeft !== targetLeft) {
							position.left += newOffset;
						}
						else if(overflowRight > 0 && posLeft + elemWidth !== targetLeft + targetWidth) {
							position.left += (my.x === 'center' ? -1 : 1) * newOffset;
						}

						return position.left - posLeft;
					},
					top: function(posTop) {
						var winScroll = $(window).scrollTop(),
							winHeight = $(window).height(),
							myOffset = my.y === 'top' ? -elemHeight : my.y === 'bottom' ? elemHeight : -elemHeight / 2,
							atOffset = at.y === 'top' ? targetHeight : at.y === 'bottom' ? -targetHeight : 0,
							adjustY = -2 * posOptions.adjust.y,
							newOffset = posTop < 0 ? myOffset + targetHeight + adjustY : myOffset + atOffset + adjustY,
							overflowTop = winScroll - posTop,
							overflowBottom = posTop + elemHeight - winHeight - winScroll;

						if(posTop + newOffset < winScroll + winHeight && (overflowTop > 0 || overflowBottom > 0)) { 
							position.top += my.precedance === 'y' ? (posTop + newOffset < winScroll ? 0 : newOffset) : (overflowTop > 0 ? -1 : 1) * newOffset;
						}

						return position.top - posTop;
					}
				};

			// Check if mouse was the target
			if(target === 'mouse') {
				// Force left top to allow flipping
				at = { x: 'left', y: 'top' };

				// Use cached event if one isn't available for positioning
				if(!event) { event = self.cache.event; }
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

				// Check if window or document is the target
				if(target[0] === document || target[0] === window) {
					targetWidth = target.width();
					targetHeight = target.height();
					position = {
						top: (tooltip.css('position') === 'fixed') ? 0 : target.scrollTop(),
						left: target.scrollLeft()
					};
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

					if(!posOptions.adjust.offset || calculate('offsetParent')[0] === document.body) {
						position = target.offset();
					}
					else {
						// Account for offset parent and it's scroll positions
						position = target.position();
						position.top += target.offsetParent().scrollTop();
						position.left += target.offsetParent().scrollLeft();
					}
				}

				// Adjust position relative to target
				position.left += at.x === 'right' ? targetWidth : at.x === 'center' ? targetWidth / 2 : 0;
				position.top += at.y === 'bottom' ? targetHeight : at.y === 'center' ? targetHeight / 2 : 0;
			}

			// Adjust position relative to tooltip
			position.left += posOptions.adjust.x + (my.x === 'right' ? -elemWidth : my.x === 'center' ? -elemWidth / 2 : 0);
			position.top += posOptions.adjust.y + (my.y === 'bottom' ? -elemHeight : my.y === 'center' ? -elemHeight / 2 : 0);

			// Calculate collision offset values
			if(posOptions.adjust.screen) {
				position.adjusted = { left: adjust.left(position.left), top: adjust.top(position.top) };
			}
			else {
				position.adjusted = { left: 0, top: 0 };
			}

			// Set tooltip position class
			tooltip.attr('class', function(i, val) {
				return $(this).attr('class').replace(/ui-tooltip-pos-\w+/i, '');
			})
			.addClass('ui-tooltip-pos-' + my.abbreviation());

			// Call API method
			tooltip.trigger(callback, [self.hash(), position]);
			if(callback.isDefaultPrevented()){ return self; }
			delete position.adjust;

			// Use custom function if provided
			if(tooltip.is(':visible') && $.isFunction(posOptions.adjust.effect)) {
				posOptions.adjust.effect.call(tooltip, position);
				tooltip.queue(function() {
					// Reset attributes to avoid cross-browser rendering bugs
					$(this).css({ opacity: '', height: '' });
					if($.browser.msie && $(this).get(0).style) { $(this).get(0).style.removeAttribute('filter'); }
					$(this).dequeue();
				});
			}
			else {
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

			// Reset old title attribute if removed
			if(oldtitle) {
				target.attr('title', oldtitle);
			}

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

	// Grab metadata from element if plugin is present
	metadata = ($(this).metadata) ? $(this).metadata(opts.metadata) : {},

	// Create unique configuration object using metadata
	config = $.extend(TRUE, {}, opts, metadata),
	posOptions = config.position,

	// Use document body instead of document element if needed
	newTarget = $(this)[0] === document ? $(document.body) : $(this);

	// Setup missing content if none is detected
	if('boolean' === typeof config.content.text) {

		// Grab from supplied attribute if available
		if(config.content.attr !== FALSE && $(this).attr(config.content.attr)) {
			config.content.text = $(this).attr(config.content.attr);
		}

		// No valid content was found, abort render
		else {
			return FALSE;
		}
	}

	// Setup target options
	if(posOptions.container === FALSE) { posOptions.container = $(document.body); }
	if(posOptions.target === FALSE) { posOptions.target = newTarget; }
	if(config.show.target === FALSE) { config.show.target = newTarget; }
	if(config.hide.target === FALSE) { config.hide.target = newTarget; }

	// Convert position corner values into x and y strings
	posOptions.at = new $.fn.qtip.plugins.Corner(posOptions.at);
	posOptions.my = new $.fn.qtip.plugins.Corner(posOptions.my);

	// Destroy previous tooltip if overwrite is enabled, or skip element if not
	if($(this).data('qtip')) {
		if(config.overwrite) {
			$(this).qtip('destroy');
		}
		else if(config.overwrite === FALSE) {
			return FALSE;
		}
	}

	// Initialize the tooltip and add API reference
	obj = new QTip($(this), config, id);
	$(this).data('qtip', obj);

	return obj;
}

// jQuery $.fn extension method
$.fn.qtip = function(options, notation, newValue)
{
	var command =  String(options).toLowerCase(), // Parse command
		returned = FALSE,
		args = command === 'disable' ? [TRUE] : $.makeArray(arguments).splice(1),
		event = args[args.length - 1],
		opts;

	// Check for API request
	if((!options && $(this).data('qtip')) || command === 'api') {
		opts = $(this).eq(0).data('qtip');
		return opts ? opts.hash() : undefined;
	}

	// Execute API command if present
	else if('string' === typeof options)
	{
		$(this).each(function()
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
					if(event.timeStamp) { api.cache.event = event; }
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

		return returned !== FALSE ? returned : $(this);
	}

	// No API commands. validate provided options and setup qTips
	else if('object' === typeof options)
	{
		// Sanitize options
		sanitizeOptions(options);

		// Build new sanitized options object
		opts = $.extend(TRUE, {}, $.fn.qtip.defaults, options);

		// Bind the qTips
		return $.fn.qtip.bind.call(this, opts);
	}
};

// $.fn.qtip Bind method
$.fn.qtip.bind = function(opts)
{
	return $(this).each(function() {
		var id, self, options, targets, events, namespace;

		// Find next available ID, or use custom ID if provided
		id = (opts.id === FALSE || opts.id.length < 1 || $('#ui-tooltip-'+opts.id).length) ? $.fn.qtip.nextid++ : opts.id;

		// Setup events namespace
		namespace = '.qtip-'+id+'-create';

		// Initialize the qTip
		self = init.call($(this), id, opts);
		if(self === FALSE) { return TRUE; }
		options = self.options;

		// Remove title attribute and store it if present
		if($(this).attr('title')) {
			$(this).data('oldtitle', $(this).attr('title')).removeAttr('title');
		}

		// Initialize plugins
		$.each($.fn.qtip.plugins, function() {
			if(this.initialize === 'initialize') { this(self); }
		});

		// Determine hide and show targets
		targets = { show: options.show.target, hide: options.hide.target };
		events = {
			show: String(options.show.event).replace(' ', namespace+' ') + namespace,
			hide: (String(options.hide.event) + ' mouseleave').replace(' ', namespace+' ') + namespace
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

			// Cache the mouse data
			self.cache.event = $.extend({}, event);

			// Start the event sequence
			if(options.show.delay > 0) {
				self.timers.show = setTimeout(render, options.show.delay);
				if(events.show !== events.hide) {
					targets.hide.bind(events.hide, function(event){ clearTimeout(self.timers.show); });
				}
			}
			else { render(); }
		}

		// Prerendering is enabled, create tooltip now
		if(options.show.ready || options.prerender || options.show.event === FALSE) {
			hoverIntent();
		}

		// Prerendering is disabled, create tooltip on show event
		else {
			targets.show.bind(events.show, hoverIntent);
		}
	});
};

$.each({
	/* Allow other plugins to successfully retrieve the title of an element with a qTip applied */
	attr: function(attr) {
		var api = $(this).data('qtip');
		return (arguments.length === 1 && attr === 'title' && api && api.rendered === TRUE) ? $(this).data('oldtitle') : NULL;
	},

	/* Taken directly from jQuery 1.8.2 widget source code */
	/* Trigger 'remove' event on all elements on removal if jQuery UI isn't present */
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
	if(!func) { return true; }
	var old = $.fn[name];
	$.fn[name] = function() {
		return func.apply(this, arguments) || old.apply(this, arguments);
	};
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
			effect: TRUE,
			offset: FALSE
		}
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
		widget: TRUE
	},
	events: {
		render: $.noop,
		move: $.noop,
		show: $.noop,
		hide: $.noop,
		focus: $.noop,
		blur: $.noop
	}
};

