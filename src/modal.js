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
			// Merge defaults with options
			options = $.extend(TRUE, $.fn.qtip.plugins.modal.defaults, options);

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
	else if(opts.on === TRUE) {
		qTip.plugins.modal = new Modal(qTip, opts);
		return qTip.plugins.modal;
	}
};

// Plugin needs to be initialized on render
$.fn.qtip.plugins.modal.initialize = 'render';
$.fn.qtip.plugins.modal.sanitize = function(opts)
{
	if(opts.show && opts.show.modal !== undefined) {
		if(typeof opts.show.modal !== 'object'){ opts.show.modal = { on: opts.show.modal }; }
	}
};

// Setup plugin defaults
$.fn.qtip.plugins.modal.defaults = {
	on: TRUE,
	effect: TRUE,
	blur: TRUE
};

