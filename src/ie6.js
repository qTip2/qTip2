function IE6(qTip)
{
	var self = this;
	self.elements = {
		bgiframe: NULL
	};
	self.ns = '.qtipie6-' + qTip.id;

	$.extend(self, {
		init: function()
		{
			var tooltip = qTip.elements.tooltip,
				bgiframe = self.elements.bgiframe;

			// Setup BGIFrame if select objects are present
			if($('select, object').length) {
				// Create the BGIFrame element
				bgiframe = $('<iframe class="ui-tooltip-bgiframe" frameborder="0" tabindex="-1" src="javascript:\'\';" ' +
					' style="display:block; position:absolute; z-index:-1; filter:alpha(opacity=0);"></iframe>');

				// Append the new element to the tooltip
				bgiframe.appendTo(tooltip);

				// Update BGIFrame on tooltip move
				tooltip.bind('tooltipmove'+self.ns+' tooltipshow'+self.ns, self.bgiframe);
			}

			// Apply automatic position: fixed override
			if(tooltip.css('position') === 'fixed') {
				// Set positioning to absolute
				tooltip.css({ position: 'absolute' });

				// Reposition tooltip when window is scrolled
				$(window).bind('scroll'+self.ns, self.scroll);
			}
		},

		scroll: function(event)
		{
			var size = self.dimensions();

			// Update position only if tooltip is visible and smaller than window dimensions
			if(qTip.elements.tooltip.is(':visible') && !(size.height > $(window).height() || size.width > $(window).width())) {
				qTip.reposition(event);
			}
		},

		/* BGIFrame adaption (http://plugins.jquery.com/project/bgiframe) - Special thanks to Brandon Aaron */
		bgiframe: function()
		{
			var tipAdjust,
				offset = { left: 0, top: 0 },
				dimensions = self.dimensions(); // Determine current tooltip dimensions

			// Determine correct offset
			offset = parseInt(qTip.elements.tooltip.css('border-left-width'), 10);
			offset = { left: -offset, top: -offset };
			if(qTip.plugins.tip && qTip.plugins.tip.tip) {
				tipAdjust = (qTip.plugins.tip.corner.precedance === 'x') ? ['width', 'left'] : ['height', 'top'];
				offset[ tipAdjust[1] ] -= qTip.plugins.tip.tip[ tipAdjust[0] ]();
			}

			// Update bgiframe
			self.elements.bgiframe.css(offset).css(dimensions);
		},

		destroy: function()
		{
			// Remove iframe
			self.elements.bgiframe.remove();

			// Unbind scroll event
			$(window).unbind('scroll'+self.ns);

			// Remove bound events
			qTip.elements.tooltip.unbind('tooltipmove'+self.ns+' tooltipshow'+self.ns);
		}
	});

	self.init();
}

$.fn.qtip.plugins.ie6 = function(qTip)
{
	// Use this plugin _only_ if the browser is IE6
	if(!($.browser.msie && (/^6\.[0-9]/).test($.browser.version))) {
		return FALSE;
	}

	// Retrieve previous API object
	var api = qTip.plugins.ie6;

	// An API is already present,
	if(api) {
		return api;
	}
	// No API was found, create new instance
	else {
		qTip.plugins.ie6 = new IE6(qTip);
		return qTip.plugins.ie6;
	}
};

// Plugin needs to be initialized on render
$.fn.qtip.plugins.ie6.initialize = 'render';

