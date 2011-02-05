function Modal(api)
{
	var self = this,
		options = api.options.show.modal,
		elems = api.elements,
		tooltip = elems.tooltip,
		
		selector = '#qtip-overlay',
		namespace = '.qtipmodal',
		events = 'tooltipshow'+namespace+' tooltiphide'+namespace;

	// Setup option set checks
	api.checks.modal = {
		'^show.modal.(on|blur)$': function() {
			// Initialise
			self.init();
			
			// Show the modal if not visible already and tooltip is visible
			elems.overlay.toggle( tooltip.is(':visible') );
		}
	};

	$.extend(self, {
		init: function()
		{
			if(options.on) {
				// Apply our modal events (unbind the mfirst so we don't duplicate)
				tooltip.unbind(namespace).bind(events, function(event, api, duration) {
					var type = event.type.replace('tooltip', '');

					if($.isFunction(options[type])) {
						options[type].call(elems.overlay, duration, api);
					}
					else {
						self[type](duration);
					}
				});

				// Create the overlay if needed
				self.create();

				// Hide tooltip on overlay click if enabled and toggle cursor style
				if(options.blur === TRUE) {
					elems.overlay.unbind(namespace+api.id).bind('click'+namespace+api.id, function(){ api.hide.call(api); });
				}
				elems.overlay.css('cursor', options.blur ? 'pointer' : '');
			}
		},

		create: function()
		{
			var elem = $(selector), overlay;

			// Return if overlay is already rendered
			if(elem.length) { elems.overlay = elem; return elem; }

			// Create document overlay
			overlay = elems.overlay = $('<div />', {
				id: selector.substr(1),
				css: {
					position: 'absolute',
					top: 0,
					left: 0,
					display: 'none'
				},
				mousedown: function() { return FALSE; }
			})
			.appendTo(document.body);

			// Update position on window resize or scroll
			$(window).bind('resize'+namespace, function() {
				overlay.css({
					height: Math.max( $(window).height(), $(document).height() ),
					width: Math.max( $(window).width(), $(document).width() )
				});
			})
			.trigger('resize');

			return overlay;
		},

		toggle: function(state)
		{
			var overlay = elems.overlay,
				effect = api.options.show.modal.effect,
				type = state ? 'show': 'hide',
				zindex;

			// Create our overlay if it isn't present already
			if(!overlay) { overlay = self.create(); }

			// Prevent modal from conflicting with show.solo
			if(overlay.is(':animated') && !state) { return; }

			// Setop all animations
			overlay.stop(TRUE, FALSE);

			// Set z-indx if we're showing it
			if(state) {
				zindex = parseInt( $.css(tooltip[0], 'z-index'), 10);
				overlay.css('z-index', (zindex || QTIP.zindex) - 1);
			}

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
			var delBlanket = elems.overlay;

			if(delBlanket) {
				// Check if any other modal tooltips are present
				$(selector).each(function() {
					var api = $(this).data('qtip');

					// If another modal tooltip is present, leave overlay
					if(api && api.id !== api.id && api.options.show.modal) {
						return (delBlanket = FALSE);
					}
				});

				// Remove overlay if needed
				if(delBlanket) {
					elems.overlay.remove();
					$(window).unbind(namespace);
				}
				else {
					elems.overlay.unbind(namespace+api.id);
				}
			}

			// Remove bound events
			tooltip.unbind(events);
		}
	});

	self.init();
}

PLUGINS.modal = function(api)
{
	var self = api.plugins.modal;

	return 'object' === typeof self ? self : (api.plugins.modal = new Modal(api));
};

// Plugin needs to be initialized on render
PLUGINS.modal.initialize = 'render';

// Setup sanitiztion rules
PLUGINS.modal.sanitize = function(opts) {
	if(opts.show) { 
		if(typeof opts.show.modal !== 'object') { opts.show.modal = { on: !!opts.show.modal }; }
		else if(typeof opts.show.modal.on === 'undefined') { opts.show.modal.on = TRUE; }
	}
};

// Extend original api defaults
$.extend(TRUE, QTIP.defaults, {
	show: {
		modal: {
			on: FALSE,
			effect: TRUE,
			blur: TRUE
		}
	}
});