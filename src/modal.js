function Modal(qTip, options)
{
	var self = this,
		elems = qTip.elements,
		tooltip = elems.tooltip,
		namespace = '.qtipmodal',
		events = 'tooltipshow'+namespace+' tooltiphide'+namespace;

	// See if blanket is already present
	elems.blanket = $('#qtip-blanket');

	$.extend(self, {
		init: function()
		{
			// Merge defaults with options
			options = $.extend(TRUE, $.fn.qtip.plugins.modal.defaults, options);

			// Check if the tooltip is modal
			tooltip.bind(events, function(event, api, duration) {
				var type = event.type.replace('tooltip', '');

				if($.isFunction(options[type])) {
					options[type].call(elems.blanket, duration, api);
				}
				else {
					self[type](duration);
				}
			});

			// Create the blanket if needed
			if(!elems.blanket.length) {
				self.create();
			}

			// Hide tooltip on blanket click if enabled
			if(options.blur === TRUE) {
				elems.blanket.bind('click'+namespace+qTip.id, function(){ qTip.hide.call(qTip); });
			}
		},

		create: function()
		{
			// Create document blanket
			elems.blanket = $('<div />', {
				id: 'qtip-blanket',
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
				elems.blanket.css({
					height: Math.max( $(window).height(), $(document).height() ),
					width: Math.max( $(window).width(), $(document).width() )
				});
			})
			.trigger('resize');
		},

		toggle: function(state)
		{
			var blanket = elems.blanket,
				effect = qTip.options.show.modal.effect,
				type = state ? 'show': 'hide';

			// Use custom function if provided
			if($.isFunction(effect)) {
				effect.call(elems.blanket);
			}
			
			// If no effect type is supplied, use a simple toggle
			else if(effect === FALSE) {
				blanket[ type ]();
			}
			
			// Use basic fade function
			else {
				blanket.fadeTo(90, state ? 100 : 0);
			}
		},

		show: function() { self.toggle(true); },
		hide: function() { self.toggle(false); },

		destroy: function()
		{
			var delBlanket = TRUE;

			// Check if any other modal tooltips are present
			$('*').each(function() {
				var api = $(this).data('qtip');
				if(api && api.id !== qTip.id && api.options.show.modal) {
					// Another modal tooltip was present, leave blanket
					delBlanket = FALSE;
					return FALSE;
				}
			});

			// Remove blanket if needed
			if(delBlanket) {
				elems.blanket.remove();
				$(window).unbind('scroll'+namespace+' resize'+namespace);
			}
			else {
				elems.blanket.unbind('click'+namespace+qTip.id);
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
	else if(typeof opts === 'object') {
		qTip.plugins.modal = new Modal(qTip, opts);
		return qTip.plugins.modal;
	}
};

// Plugin needs to be initialized on render
$.fn.qtip.plugins.modal.initialize = 'render';
$.fn.qtip.plugins.modal.sanitize = function(opts)
{
	if(opts.show && opts.show.modal !== undefined) {
		if(typeof opts.show.modal !== 'object'){ opts.show.modal = { }; }
	}
};

// Setup plugin defaults
$.fn.qtip.plugins.modal.defaults = {
	effect: TRUE,
	blur: TRUE
};

