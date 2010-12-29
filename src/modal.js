function Modal(qTip)
{
	var self = this,
		options = qTip.options.show.modal,
		elems = qTip.elements,
		tooltip = elems.tooltip,
		
		selector = '#qtip-overlay',
		namespace = '.qtipmodal',
		events = 'tooltipshow'+namespace+' tooltiphide'+namespace;

	// Setup option set checks
	self.checks = {
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

				// Hide tooltip on overlay click if enabled
				if(options.blur === TRUE) {
					elems.overlay.unbind(namespace+qTip.id).bind('click'+namespace+qTip.id, function(){ qTip.hide.call(qTip); });
				}
			}
		},

		create: function()
		{
			// Return if overlay is already rendered
			var elem = $(selector);
			if(elem.length) { elems.overlay = elem; return; }

			// Create document overlay
			elems.overlay = $('<div />', {
				id: selector.substr(1),
				css: {
					position: 'absolute',
					top: 0,
					left: 0,
					display: 'none',
					zIndex: parseInt( tooltip.css('z-index'), 10 ) - 1 // Use the current tooltips z-index as a base
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

				// If another modal tooltip is present, leave overlay
				if(api && api.id !== qTip.id && api.options.show.modal) {
					return (delBlanket = FALSE);
				}
			});

			// Remove overlay if needed
			if(delBlanket) {
				elems.overlay.remove();
				$(window).unbind(namespace);
			}
			else {
				elems.overlay.unbind(namespace+qTip.id);
			}

			// Remove bound events
			tooltip.unbind(events);
		}
	});

	self.init();
}

$.fn.qtip.plugins.modal = function(qTip)
{
	var api = qTip.plugins.modal;

	return 'object' === typeof api ? api : (qTip.plugins.modal = new Modal(qTip));
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
});