function Ajax(qTip)
{
	var self = this,
		tooltip = qTip.elements.tooltip,
		opts = qTip.options.content.ajax;

	self.checks = {
		'^content.ajax': function(obj, name) {
			if(name === 'once') {
				self.once();
			}
			else if(opts && opts.url) {
				self.load();
			}
		}
	};

	$.extend(self, {
		init: function()
		{
			// Make sure ajax options are enabled before proceeding
			if(opts && opts.url) {
				self[ opts.once ? 'once' : 'load' ]();
			}
		},

		once: function()
		{
			if(opts.once) {
				self.destroy();
			}
			else {
				tooltip.bind('tooltipshow.ajax', function() { self.load(); });
			}
		},

		load: function()
		{
			// Define success and error handlers
			function successHandler(content){ qTip.set('content.text', content); }
			function errorHandler(xh, status, error){ qTip.set('content.text', status + ': ' + error); }

			// Setup $.ajax option object and process the request
			$.ajax( $.extend({ success: successHandler, error: errorHandler, context: qTip }, opts) );

			return self;
		},

		destroy: function()
		{
			// Remove bound events
			tooltip.unbind('.ajax');
		}
	});

	self.init();
}


$.fn.qtip.plugins.ajax = function(qTip)
{
	var api = qTip.plugins.ajax;
	
	return 'object' === typeof api ? api : (qTip.plugins.ajax = new Ajax(qTip));
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