function Modal(api)
{
	var self = this,
		options = api.options.show.modal,
		elems = api.elements,
		tooltip = elems.tooltip,
		selector = '#qtip-overlay',
		namespace = '.qtipmodal',
		overlay;

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
			// If modal is disabled... return
			if(!options.on) { return self; }
			
			// Remove previous bound events in namespace
			tooltip.unbind(namespace).unbind(namespace+api.id)

			// Apply our show/hide/focus modal events
			.bind('tooltipshow'+namespace+' tooltiphide'+namespace, function(event, api, duration) {
				var type = event.type.replace('tooltip', '');

				if($.isFunction(options[type])) {
					options[type].call(elems.overlay, duration, api);
				}
				else {
					self[type](duration);
				}
			})
			.bind('tooltipfocus', function(event, api, zIndex) {
				overlay.css('z-index', zIndex - 1); // Adjust modal z-index on tooltip focus
			});

			// Create the overlay if needed
			self.create();

			// Hide tooltip on overlay click if enabled and toggle cursor style
			elems.overlay.css('cursor', options.blur ? 'pointer' : '');
			if(options.blur === TRUE) {
				elems.overlay.bind('click'+namespace+api.id, function(){ api.hide.call(api); });
			}

			return self;
		},

		create: function()
		{
			var elem = $(selector);

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
			var effect = api.options.show.modal.effect,
				type = state ? 'show': 'hide',
				zindex;

			// Create our overlay if it isn't present already
			if(!overlay) { overlay = self.create(); }

			// Prevent modal from conflicting with show.solo
			if(overlay.is(':animated') && !state) { return; }

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

			return self;
		},

		show: function() { return self.toggle(TRUE); },
		hide: function() { return self.toggle(FALSE); },

		destroy: function()
		{
			var delBlanket = overlay;

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
			return tooltip.unbind(namespace);
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