function Modal(qTip, options)
{
	var self = this;

	self.blanket = $('#qtip-blanket');
	self.options = options;
	self.ns = '.qtipmodal';

	$.extend(self, {

		init: function()
		{
			// Merge defaults with options
			options = $.extend(TRUE, $.fn.qtip.plugins.modal.defaults, options);

			// Check if the tooltip is modal
			qTip.elements.tooltip
				.bind('tooltipshow'+self.ns, function(event, api, duration) {
					if($.isFunction(options.show)) {
						options.show.call(self.blanket, duration, api);
					}
					else {
						self.show(duration);
					}
				})
				.bind('tooltiphide'+self.ns, function(event, api, duration) {
					if($.isFunction(options.hide)) {
						options.hide.call(self.blanket, duration, api);
					}
					else {
						self.hide(duration);
					}
				});

			// Create the blanket if needed
			if(!self.blanket.length) {
				self.create();
			}

			// Hide tooltip on blanket click if enabled
			if(options.blur === TRUE) {
				self.blanket.bind('click'+self.ns+qTip.id, function(){ qTip.hide.call(qTip); });
			}
		},

		create: function()
		{
			// Create document blanket
			self.blanket = $('<div />')
				.attr('id', 'qtip-blanket')
				.css({
					position: 'absolute',
					top: 0,
					left: 0,
					display: 'none'
				})
				.appendTo(document.body);

			// Update position on window resize or scroll
			$(window).bind('resize'+self.ns, function() {
				self.blanket.css({
					height: Math.max( $(window).height(), $(document).height() ),
					width: Math.max( $(window).width(), $(document).width() )
				});
			})
			.trigger('resize');
		},

		show: function(duration)
		{
			self.blanket.fadeIn(duration);
		},

		hide: function(duration)
		{
			self.blanket.fadeOut(duration);
		},

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
				self.blanket.remove();
				$(window).unbind('scroll'+self.ns+' resize'+self.ns);
			}
			else {
				self.blanket.unbind('click'+self.ns+qTip.id);
			}

			// Remove bound events
			qTip.elements.tooltip.unbind('tooltipshow'+self.ns+' tooltiphide'+self.ns);
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
	effects: {
		show: TRUE,
		hide: TRUE
	},
	blur: TRUE
};

