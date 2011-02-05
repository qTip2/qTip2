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
		tooltip, elements;

	// Setup class attributes
	self.id = id;
	self.rendered = FALSE;
	self.elements = elements = { target: target };
	self.timers = { img: [] };
	self.options = options;
	self.checks = {};
	self.plugins = {};
	self.cache = {
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
	
	function isVisible() {
		return tooltip && tooltip.css('left') !== hideOffset && tooltip.css('visibility') !== 'hidden';
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
		var button = options.content.title.button;

		if(elements.button) { elements.button.remove(); }

		// Use custom button if one was supplied by user, else use default
		if(button.jquery) {
			elements.button = button;
		}
		else {
			elements.button = $('<a />', {
				'class': 'ui-state-default ' + (options.style.widget ? '' : uitooltip+'-icon'),
				'title': 'Close tooltip',
				'aria-label': 'Close tooltip'
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
		if(self.rendered && isVisible()) {
			self.reposition(self.cache.event);
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

		// Insert into 'fx' queue our image dimension checker which will halt the showing of the tooltip until image dimensions can be detected
		tooltip.queue('fx', function(next) {
			// Find all content images without dimensions
			var images = elem.find('img:not([height]):not([width])');

			// Update tooltip width and position when all images are loaded
			function imageLoad(img) {
				// Remove the image from the array
				images = images.not(img);

				// If queue is empty, update tooltip and continue the queue
				if(images.length === 0) {
					self.redraw();
					if(self.rendered && isVisible()) {
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
					if(elem.height && elem.width) {
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

	function assignEvents(show, hide, tip, doc)
	{
		var namespace = '.qtip-'+id,
			posOptions = options.position,
			targets = {
				show: options.show.target,
				hide: options.hide.target,
				container: posOptions.container[0] === docBody ? document : posOptions.container
			},
			events = { show: String(options.show.event).split(' '), hide: String(options.hide.event).split(' ') },
			$doc = $(document),
			IE6 = $.browser.msie && parseInt($.browser.version, 10) === 6;

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
			tooltip.stop(1, 1);

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
			if(isVisible()) { self.reposition(event); }
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
						if(isVisible()) { hideMethod(event); }
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
				$doc.bind('mousedown'+namespace, function(event) {
					var $target = $(event.target);
					
					if($target.parents(selector).length === 0 && $target.add(target).length > 1 && isVisible() && !tooltip.hasClass(disabled)) {
						self.hide(event);
					}
				});
			}

			// If mouse is the target, update tooltip position on document mousemove
			if(posOptions.target === 'mouse') {
				$doc.bind('mousemove'+namespace, function(event) {
					// Update the tooltip position only if the tooltip is visible and adjustment is enabled
					if(posOptions.adjust.mouse && !tooltip.hasClass(disabled) && isVisible()) {
						self.reposition(event || QTIP.mouse);
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
				tooltip: tooltip ? elements.tooltip : NULL,
				content: tooltip ? elements.content : NULL,
				container: doc ? options.position.container[0] === docBody ? document : options.position.container : NULL,
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
		'^(show|hide).(event|target|fixed|delay|inactive)$': function(obj, o, v, p) {
			var args = o.search(/fixed/i) > -1 ? [0, [0,1,1,1]] : [o.substr(0,3), o.charAt(0) === 's' ? [1,0,0,0] : [0,1,0,0]];

			if(args[0]) { obj[o] = p; }
			unassignEvents.apply(self, args[1]);

			if(args[0]) { obj[o] = v; }
			assignEvents.apply(self, args[1]);
		},
		'^show.ready$': function() { if(!self.rendered) { self.show(); } },

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
			if(self.rendered) { return FALSE; } // If tooltip has already been rendered, exit

			var content = options.content.text,
				title = options.content.title.text,
				callback = $.Event('tooltiprender');

			// Add ARIA attributes to target
			$.attr(target[0], 'aria-describedby', tooltipID);

			// Create tooltip element
			tooltip = elements.tooltip = $('<div/>')
				.attr({
					'id': tooltipID,
					'class': uitooltip + ' qtip ui-helper-reset ' + options.style.classes,
					
					/* ARIA specific attributes */
					'role': 'alert',
					'aria-live': 'polite',
					'aria-atomic': FALSE,
					'aria-describedby': tooltipID + '-content',
					'aria-hidden': TRUE
				})
				.toggleClass(disabled, self.cache.disabled)
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

			// Set rendered status
			self.rendered = TRUE;

			// Update title and content
			if(title) { 
				createTitle();
				updateTitle(title);
			}
			updateContent(content);

			// Setup widget classes
			setWidget();

			// Initialize 'render' plugins
			$.each(PLUGINS, function() {
				if(this.initialize === 'render') { this(self); }
			});

			// Assign events
			assignEvents(1, 1, 1, 1);
			$.each(options.events, function(name, callback) {
				if(callback) {
					var events = name === 'toggle' ? 'tooltipshow tooltiphide' : 'tooltip'+name;
					tooltip.bind(events, callback);
				}
			});

			// Set visibility AFTER plugin initialization to prevent issues in IE
			tooltip.css('visibility', 'hidden')

			/* Queue this part of the render process in our fx queue so we can
			 * load images before the tooltip renders fully.
			 *
			 * See: updateContent method
			*/
			.queue('fx', function(next) {
				// Trigger tooltiprender event and pass original triggering event as original
				callback.originalEvent = self.cache.event;
				tooltip.trigger(callback, [self]);

				// Update tooltip position and show tooltip if needed
				if(options.show.ready || show) {
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
				case 'dimensions':
					// Find initial dimensions
					result = {
						height: tooltip.outerHeight(),
						width: tooltip.outerWidth()
					};
				break;

				case 'offset':
					result = PLUGINS.offset(tooltip, options.position.container);
				break;

				default:
					o = convertNotation(notation.toLowerCase());
					result = (o[0].precedance) ? o[0].string() : (o[0].jquery) ? o[0] : o[0][ o[1] ];
				break;
			}

			return result;
		},

		set: function(option, value)
		{
			var rmove = /^position.(my|at|adjust|target|container)|style|content/i,
				reposition = FALSE,
				checks = self.checks,
				name;

			function set(notation, value) {
				notation = notation.toLowerCase();

				var option = convertNotation(notation), previous, category, rule;

				// Set new option value
				previous = option[0][ option[1] ];
				option[0][ option[1] ] = value.nodeType ? $(value) : value;

				// Execute any valid callbacks (if rendered)
				if(self.rendered) {
					for(category in checks) {
						for(rule in checks[category]) {
							if((new RegExp(rule, 'i')).test(notation)) {
								checks[category][rule].call(self, option[0], option[1], value, previous);
							}
						}
					}
				}

				// If we're not rendered and show.ready was set, render it
				else if(notation === 'show.ready') { self.render(TRUE); }
			}

			// Convert singular option/value pair into object form
			if('string' === typeof option) {
				name = option; option = {}; option[name] = value;
			}

			/* 
			 * Set each option/value pair in the object.
			 * Also set isPositioning so we don't get loads of redundant repositioning calls
			 */
			isPositioning = 1;
			for(name in option) {
				set(name, option[name]);
				reposition = rmove.test(name) || reposition;
			}
			isPositioning = 0;

			// Update position on ANY style/position/content change if shown and rendered
			if(reposition && isVisible() && self.rendered) { self.reposition(); }

			// Re-sanitize options
			sanitizeOptions(options);

			return self;
		},

		toggle: function(state, event)
		{
			// Make sure tooltip is rendered
			if(!self.rendered) {
				if(state) { self.render(1); } // Render the tooltip if showing and it isn't already
				else { return FALSE; }
			}

			var type = state ? 'show' : 'hide',
				opts = options[type],
				visible = isVisible(),
				callback;

			// Detect state if valid one isn't provided
			if((typeof state).search('boolean|number')) { state = !visible; }

			// Return if element is already in correct state
			if(visible === state) { return self; }

			// Try to prevent flickering when tooltip overlaps show element
			if(event) {
				if((/over|enter/).test(event.type) && (/out|leave/).test(self.cache.event.type) &&
					event.target === options.show.target[0] && tooltip.has(event.relatedTarget).length){
					return self;
					}

				// Cache event
				self.cache.event = $.extend({}, event);
			}

			// Call API methods
			callback = $.Event('tooltip'+type); 
			callback.originalEvent = event ? self.cache.event : NULL;
			tooltip.trigger(callback, [self, 90]);
			if(callback.isDefaultPrevented()){ return self; }

			// Set ARIA hidden status attribute
			$.attr(tooltip[0], 'aria-hidden', !!!state);

			// Execute state specific properties
			if(state) {
				tooltip.hide().css({ visibility: '' }); // Hide it first so effects aren't skipped
				
				// Focus the tooltip
				self.focus(event);

				// Update tooltip position (without animation)
				self.reposition(event, 0);

				// Hide other tooltips if tooltip is solo
				if(opts.solo) { $(selector).not(tooltip).qtip('hide', callback); }
			}
			else {
				// Clear show timer if we're hiding 
				clearTimeout(self.timers.show);

				// Blur the tooltip
				self.blur(event);
			}

			// Define post-animation state specific properties
			function after() {
				// Prevent antialias from disappearing in IE by removing filter
				if(state) {
					if($.browser.msie) { tooltip[0].style.removeAttribute('filter'); }
				}
				// Hide the tooltip using negative offset and reset opacity
				else {
					tooltip.css({
						display: '',
						visibility: 'hidden',
						width: '',
						opacity: '',
						left: '',
						top: ''
					});
				}
			}

			// Clear animation queue
			tooltip.stop(1, 1);

			// Use custom function if provided
			if($.isFunction(opts.effect)) {
				opts.effect.call(tooltip, self);
				tooltip.queue('fx', function(next){ after.call(this, next); next(); });
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
			if(!self.rendered) { return FALSE; }

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
		},

		reposition: function(event, effect)
		{
			if(!self.rendered || isPositioning) { return FALSE; }

			// Set positioning flag
			isPositioning = TRUE;
	
			var target = options.position.target,
				posOptions = options.position,
				my = posOptions.my, 
				at = posOptions.at,
				adjust = posOptions.adjust,
				elemWidth = tooltip.outerWidth(),
				elemHeight = tooltip.outerHeight(),
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
				effect = effect === undefined || !!effect || FALSE;

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
					adjust.mouse || !event || !event.pageX ? $.extend({}, QTIP.mouse) : event;

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
				if(position.width) {
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

			// If effect is disabled or positioning gives NaN out, set CSS directly
			if(!effect || !isNaN(position.left, position.top)) {
				tooltip.css(position);
			}
			
			// Use custom function if provided
			else if(isVisible() && $.isFunction(posOptions.effect)) {
				posOptions.effect.call(tooltip, self, position);
				tooltip.queue(function(next) {
					var elem = $(this);
					// Reset attributes to avoid cross-browser rendering bugs
					elem.css({ opacity: '', height: '' });
					if($.browser.msie && this.style) { this.style.removeAttribute('filter'); }

					next();
				});
			}

			// Set positioning flag
			isPositioning = FALSE;

			return self;
		},

		// IE max/min height/width simulartor function
		redraw: function()
		{
			// Make sure tooltip is rendered and the browser needs the redraw
			if(!self.rendered || !($.browser.msie && $.browser.version < 8)) { return FALSE; }

			var fluid = uitooltip + '-fluid',
				dimensions;

			// Reset the height and width and add the fluid class to reset max/min widths
			tooltip.css({ width: 'auto', height: 'auto' }).addClass(fluid);

			// Grab our tooltip dimensions
			dimensions = {
				height: tooltip.outerHeight(),
				width: tooltip.outerWidth()
			};
			
			// Determine actual width
			$.each(['width', 'height'], function(i, prop) {
				// Parse our max/min properties
				var max = parseInt(tooltip.css('max-'+prop), 10) || 0,
					min = parseInt(tooltip.css('min-'+prop), 10) || 0;

				// Determine new dimension size based on max/min/current values
				dimensions[prop] = max + min ? Math.min( Math.max( dimensions[prop], min ), max ) : dimensions[prop];
			});

			// Set the newly calculated dimensions and remvoe fluid class
			tooltip.css(dimensions).removeClass(fluid);
		},

		enable: function() { self.disable(TRUE); },
		disable: function(state)
		{
			var c = disabled;
			
			if('boolean' !== typeof state) {
				state = !(tooltip.hasClass(c) || self.cache.disabled);
			}
			 
			if(self.rendered) {
				tooltip.toggleClass(c, state);
				$.attr(tooltip[0], 'aria-disabled', state);
			}
			else {
				self.cache.disabled = !!state;
			}

			return self;
		},

		destroy: function()
		{
			var t = target[0],
				title = $.data(t, oldtitle);

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
			}

			// Remove ARIA attributse
			target.removeAttr('aria-describedby');

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
		$.data(this, oldtitle, $.attr(this, 'title'));
		elem.removeAttr('title');
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
	var command = String(options).toLowerCase(), // Parse command
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

			// Call APIcommand
			if((/option|set/).test(command) && notation) {
				if($.isPlainObject(notation) || newValue !== undefined) {
					api.set(notation, newValue);
				}
				else {
					returned = api.get(notation);
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
		self = init.call(this, id, opts);
		if(self === FALSE) { return TRUE; }
		options = self.options;

		// Initialize plugins
		$.each(PLUGINS, function() {
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
	attr: function(attr, val) {
		if(!this.length) { return; }

		var self = this[0],
			title = 'title',
			api = $.data(self, 'qtip');

		if(attr === title) {
			if(arguments.length < 2) {
				return $.data(self, oldtitle);
			}
			else if(typeof api === 'object') {
				// If qTip is rendered and title was originally used as content, update it
				if(api && api.rendered && api.options.content.attr === title && api.cache.attr) {
					api.set('content.text', val);
				}

				// Use the regular attr method to set, then cache the result
				$.fn['attr'+replaceSuffix].apply(this, arguments);
				$.data(self, oldtitle, $.attr(self, title));
				return this.removeAttr('title');
			}
		}
	},
	
	/* Allow clone to correctly retrieve cached title attributes */
	clone: function(keepData) {
		var titles = $([]), elem;

		// Re-add cached titles before we clone
		$('*', this).add(this).each(function() {
			var title = $.data(this, oldtitle);
			if(title) {
				$.attr(this, 'title', title);
				titles = titles.add(this);
			}
		});

		// Clone our element using the real clone method
		elem = $.fn['clone'+replaceSuffix].apply(this, arguments);

		// Remove the old titles again
		titles.removeAttr('title');

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
},
function(name, func) {
	if(!func) { return TRUE; }

	var old = $.fn[name+replaceSuffix] = $.fn[name];
	$.fn[name] = function() {
		return func.apply(this, arguments) || old.apply(this, arguments);
	};
});

$(window).load(function() {
	var doc = document,
		docBody = doc.body;

	// Cache mousemove events for positioning purposes
	$(doc).bind('mousemove.qtip', function(event) {
		QTIP.mouse = { pageX: event.pageX, pageY: event.pageY };
	});

	/* 
	* If document.activeElement isn't available, we'll use our own implementation to record focus
	* http://ajaxandxml.blogspot.com/2007/11/emulating-activeelement-property-with.html
	*/
	if(doc.activeElement === undefined) {
		doc.addEventListener("focus", function(event) {
			if(event && event.target) {
				doc.activeElement = event.target === doc ? docBody : event.target;
			}
		},
		true);
	}
});

// Set global qTip properties
QTIP.version = '@VERSION';
QTIP.nextid = 0;
QTIP.inactiveEvents = 'click dblclick mousedown mouseup mousemove mouseleave mouseenter'.split(' ');
QTIP.zindex = 15000;

// Setup base plugins
PLUGINS = QTIP.plugins = {
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

	// Custom (more correct for qTip!) offset calculator
	offset: function(elem, container) {
		var pos = elem.offset(),
			parent = container,
			deep = 0,
			addScroll = !PLUGINS.iOS,
			coffset;

		if(parent) {
			// Compensate for non-static containers offset
			do {
				if(parent[0] === document.body) { break; }
				else if(parent.css('position') !== 'static') {
					coffset = parent.position();
					pos.left -= coffset.left;
					pos.top -= coffset.top;
					
					deep++;
				}
			}
			while(parent = parent.offsetParent());

			// Compensate for containers scroll if it also has an offsetParent
			if(!addScroll || deep > 1) {
				coffset = addScroll ? 1 : -1;
				pos.left += coffset * container.scrollLeft();
				pos.top += coffset * container.scrollTop();
			}
		}

		return pos;
	},
	
	/*
	 * iOS 4.0 and below scroll fix detection used in offset() function.
	 */
	iOS: parseFloat(((/CPU.+OS ([0-9_]{3}).*AppleWebkit.*Mobile/i.exec(navigator.userAgent)) || [0,'4_2'])[1].replace('_','.')) < 4.1
};

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