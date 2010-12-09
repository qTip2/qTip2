function Ajax(qTip)
{
	var self = this;

	self.checks = {
		'^content.ajax': function() { this.plugins.ajax.load(this.options.content.ajax); }
	};

	$.extend(self, {

		init: function()
		{
			// Grab ajax options
			var ajax = qTip.options.content.ajax;

			// Bind render event to load initial content
			qTip.elements.tooltip.bind('tooltiprender.ajax', function() { 
				self.load(ajax);

				// Bind show event
				qTip.elements.tooltip.bind('tooltipshow.ajax', function() {
					// Update content if content.ajax.once is FALSE and the tooltip is rendered
					if(ajax.once === FALSE && qTip.rendered === TRUE) { self.load(ajax); }
				});
			});
		},

		load: function(ajax)
		{
			// Define success and error handlers
			function successHandler(content, status)
			{
				// Call user-defined success handler if present
				if($.isFunction(ajax.success)) {
					var result = ajax.success.call(qTip.hash(), content, status);
					if(result === FALSE){ return; }
				}

				// Update content
				qTip.set('content.text', content);

			}
			function errorHandler(xhr, status, error)
			{
				var content = status || error, result;

				// Call user-defined success handler if present
				if($.isFunction(ajax.error)) {
					result = ajax.error.call(qTip.hash(), xhr, status, error);
					if(result === FALSE){ return; }
				}

				// Update tooltip content to indicate error
				qTip.set('content.text', content);
			}

			// Setup $.ajax option object and process the request
			$.ajax( $.extend(TRUE, {}, ajax, { success: successHandler, error: errorHandler }) );

			return self;
		},

		destroy: function()
		{
			// Remove bound events
			qTip.elements.tooltip.unbind('tooltipshow.ajax');
		}
	});

	self.init();
}


$.fn.qtip.plugins.ajax = function(qTip)
{
	var api = qTip.plugins.ajax,
		opts = qTip.options.content.ajax;

	// Make sure the qTip uses the $.ajax functionality
	if(opts && opts.url) {
		// An API is already present, return it
		if(api) {
			return api;
		}
		// No API was found, create new instance
		else {
			qTip.plugins.ajax = new Ajax(qTip);
			return qTip.plugins.ajax;
		}
	}
};

$.fn.qtip.plugins.ajax.initialize = 'render';

// Setup plugin sanitization
$.fn.qtip.plugins.ajax.sanitize = function(options)
{
	var content = options.content, opts;
	if(content && 'ajax' in content) {
		opts = content.ajax;
		if(typeof opts !== 'object') { opts = options.content.ajax = { url: opts }; }
		if('boolean' !== typeof opts.once && opts.once) { opts.once = !!opts.once; }
	}
};

// Extend original qTip defaults
$.extend(TRUE, $.fn.qtip.defaults, {
	content: {
		ajax: {
			once: TRUE
		}
	}
});