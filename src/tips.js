// Tip coordinates calculator
function calculateTip(corner, width, height)
{	
	var width2 = Math.ceil(width / 2), height2 = Math.ceil(height / 2),

	// Define tip coordinates in terms of height and width values
	tips = {
		bottomright:	[[0,0],				[width,height],		[width,0]],
		bottomleft:		[[0,0],				[width,0],				[0,height]],
		topright:		[[0,height],		[width,0],				[width,height]],
		topleft:			[[0,0],				[0,height],				[width,height]],
		topcenter:		[[0,height],		[width2,0],				[width,height]],
		bottomcenter:	[[0,0],				[width,0],				[width2,height]],
		rightcenter:	[[0,0],				[width,height2],		[0,height]],
		leftcenter:		[[width,0],			[width,height],		[0,height2]]
	};

	// Set common side shapes
	tips.lefttop = tips.bottomright; tips.righttop = tips.bottomleft;
	tips.leftbottom = tips.topright; tips.rightbottom = tips.topleft;

	return tips[ corner.string() ];
}


function Tip(qTip, command)
{
	var self = this,
		opts = qTip.options.style.tip,
		elems = qTip.elements,
		tooltip = elems.tooltip,
		wrapper = elems.wrapper,
		cache = { 
			top: 0, 
			left: 0, 
			corner: { string: function(){} }
		},
		size = {
			width: opts.width,
			height: opts.height
		},
		color = { },
		border = opts.border || 0,
		method = opts.method || FALSE,
		namespace = '.qtip-tip';

	self.corner = NULL;
	self.mimic = NULL;
	self.checks = {
		'^position.my|style.tip.(corner|mimic|method|border)': function() {
			// Re-determine tip type and update
			border = opts.border;

			// Make sure a tip can be drawn
			if(!self.init()) {
				self.destroy();
			}

			// Only update the position if mouse isn't the target
			else if(qTip.get('position.target') !== 'mouse') {
				qTip.reposition();
			}
		},
		'^style.tip.(height|width)': function() {
			// Re-set dimensions and redraw the tip
			size = {
				width: opts.width,
				height: opts.height
			};
			self.create();
			self.update();

			// Reposition the tooltip
			qTip.reposition();
		},
		'^style.(classes|widget)$': function() {
			self.detectColours();
			self.update();
		}
	};

	function reposition(event, api, pos, viewport) {
		if(!elems.tip) { return; }

		var newCorner = $.extend({}, self.corner),
			precedance = newCorner.precedance === 'y' ? ['y', 'top', 'left', 'height', 'x'] : ['x', 'left', 'top', 'width', 'y'],
			adjusted = pos.adjusted,
			offset = [0, 0];

		// Make sure our tip position isn't fixed e.g. doesn't adjust with adjust.screen
		if(self.corner.fixed !== TRUE) {
			// Adjust tip corners
			if(adjusted.left) {
				newCorner.x = newCorner.x === 'center' ? (adjusted.left > 0 ? 'left' : 'right') : (newCorner.x === 'left' ? 'right' : 'left');
			}
			if(adjusted.top) {
				newCorner.y = newCorner.y === 'center' ? (adjusted.top > 0 ? 'top' : 'bottom') : (newCorner.y === 'top' ? 'bottom' : 'top');
			}

			// Update and redraw the tip if needed
			if(newCorner.string() !== cache.corner.string() && (cache.top !== adjusted.top || cache.left !== adjusted.left)) {
				self.update(newCorner);
			}
		}

		// Setup offset adjustments
		offset[0] = border ? parseInt(wrapper.css('border-' + newCorner[ precedance[0] ] + '-width'), 10) || 0 : (method === 'vml' ? 1 : 0);
		offset[1] = Math.max(newCorner[ precedance[4] ] === 'center' ? opts.offset : 0, opts.offset);

		// Adjust tooltip position in relation to tip element
		pos[ precedance[1] ] += (newCorner[ precedance[0] ] === precedance[1] ? 1 : -1) * (size[ precedance[3] ] - offset[0]);
		pos[ precedance[2] ] -= (newCorner[ precedance[4] ] === precedance[2] || newCorner[ precedance[4] ] === 'center' ? 1 : -1) * offset[1];

		// Cache details
		cache.left = adjusted.left;
		cache.top = adjusted.top;
		cache.corner = newCorner;
	}

	$.extend(self, {
		init: function()
		{
			var enabled = self.detectCorner();

			// Determine tip corner and type
			if(enabled) {
				// Check if rendering method is possible and if not fall back
				if(method !== 'polygon') {
					method = $('<canvas />')[0].getContext ? 'canvas' : $.browser.msie ? 'vml' : 'polygon';
				}

				// Create a new tip
				self.create();
				self.detectColours();
				self.update();

				// Bind update events
				tooltip.unbind(namespace).bind('tooltipmove'+namespace, reposition);
			}
			
			return enabled;
		},

		detectCorner: function()
		{
			var corner = opts.corner,
				posOptions = qTip.options.position,
				at = posOptions.at,
				my = posOptions.my.string ? posOptions.my.string() : posOptions.my;

			// Detect corner and mimic properties
			if(corner === FALSE || (my === FALSE && at === FALSE)) {
				return FALSE;
			}
			else {
				if(corner === TRUE) {
					self.corner = new $.fn.qtip.plugins.Corner(my);
				}
				else if(!corner.string) {
					self.corner = new $.fn.qtip.plugins.Corner(corner);
					self.corner.fixed = TRUE;
				}
			}

			return self.corner.string() !== 'centercenter';
		},

		detectColours: function() {
			var tip = elems.tip.css({ backgroundColor: '', border: '' }),
				corner = self.corner,
				precedance = corner[ corner.precedance ],

				borderSide = 'border-' + precedance + '-color',
				borderSideCamel = 'border' + precedance.charAt(0) + precedance.substr(1) + 'Color',

				invalid = /rgba?\(0, 0, 0(, 0)?\)|transparent/i,
				backgroundColor = 'background-color',
				transparent = 'transparent',

				isTitleTop = elems.titlebar && corner.y === 'top',
				isWidget = qTip.options.style.widget,
				elemFill = isWidget ? elems.content : isTitleTop ? elems.titlebar : elems.wrapper,
				elemBorder = !isWidget ? elems.wrapper : isTitleTop ? elems.titlebar : elems.content;

			// Detect tip colours from CSS styles
			color.fill = tip.css(backgroundColor) || transparent;
			color.border = tip[0].style[borderSideCamel]; // Make sure we grab the actual border color ad not inherited font color!

			// Make sure colours are valid
			if(invalid.test(color.fill)) { 
				color.fill = border ? elemFill.css(backgroundColor) : elemBorder.css(borderSide);
			}
			if(!color.border || invalid.test(color.border)) {
				color.border = elemBorder.css(borderSide) || color.fill;
			}

			// Reset background and border colours
			$('*', tip).add(tip).css(backgroundColor, transparent).css('border', 0);
		},

		create: function()
		{
			var width = size.width,
				height = size.height,
				vml;

			// Remove previous tip element if present
			if(elems.tip){ elems.tip.remove(); }

			// Create tip element and prepend to the tooltip
			elems.tip = $('<div />', { 'class': 'ui-tooltip-tip' })
				.css(size)
				.toggleClass('ui-widget-content', qTip.options.style.widget)
				.prependTo(tooltip);

			// Create tip drawing element(s)
			switch(method)
			{
				case 'canvas':
					// save() as soon as we create the canvas element so FF2 doesn't bork on our first restore()!
					$('<canvas height="'+height+'" width="'+width+'" />').appendTo(elems.tip)[0].getContext('2d').save(); 
				break;

				case 'vml':
					vml = '<vml:shape coordorigin="0,0" coordsize="'+width+' '+height+'" stroked="false" ' +
							' style="behavior:url(#default#VML); display:inline-block; position:absolute; antialias:false;' +
							' left: 0; top: 0; width:'+width+'px; height:'+height+'px;"></vml:shape>';

					elems.tip.html( border ? vml += vml : vml );
				break;

				case 'polygon':
					elems.tip.append('<div class="ui-tooltip-tip-inner" />')
						.append(border ? '<div class="ui-tooltip-tip-border" />' : '');
				break;
			}

			return self;
		},

		update: function(corner)
		{
			var tip = elems.tip,
				inner = tip.children(),
				width = size.width,
				height = size.height,
				regular = 'px solid ',
				transparent = 'px dashed transparent', // Dashed IE6 border-transparency hack. Awesome!
				i = border > 0 ? 0 : 1,
				mimic = opts.mimic,
				context, coords, center, translate, round;

			// Re-determine tip if not already set
			if(!corner) { corner = self.corner; }

			// Use corner property if we detect an invalid mimic value
			if(mimic === FALSE) { mimic = corner; }

			// Otherwise inherit mimic properties from the corner object as necessary
			else {
				mimic = new $.fn.qtip.plugins.Corner(mimic);
				mimic.precedance = corner.precedance;

				if(mimic.x === 'inherit') { mimic.x = corner.x; }
				else if(mimic.y === 'inherit') { mimic.y = corner.y; }
				else if(mimic.x === mimic.y) {
					mimic[ corner.precedance ] = corner[ corner.precedance ];
				}
			}

			// Determine if tip is a "center" based one
			center = mimic.string().indexOf('center') > -1;

			// Custom rounding for pixel perfect precision!
			round = Math[ /b|r/.test(mimic[ mimic.precedance === 'y' ? 'x' : 'y' ]) ? 'ceil' : 'floor' ];

			// Create tip element
			switch(method)
			{
				case 'canvas':
					// Grab canvas context and clear it
					context = inner.get(0).getContext('2d');
					if(context.restore) { context.restore(); }
					context.clearRect(0,0,3000,3000);

					// Grab tip coordinates
					coords = calculateTip(mimic, width, height);

					// Draw the canvas tip (Delayed til after DOM creation)
					for(i; i < 2; i++) {
						// Save and translate canvas origin
						if(i) {
							context.save();
							context.translate(
								round((mimic.x === 'left' ? 1 : mimic.x === 'right' ? -1 : 0) * (border + 1) * (mimic.precedance === 'y' ? 0.5 : 1)),
								round((mimic.y === 'top' ? 1 : mimic.y === 'bottom' ? -1 : 0) * (border + 1) * (mimic.precedance === 'x' ? 0.5 : 1))
							);
						}

						context.beginPath();
						context.moveTo(coords[0][0], coords[0][1]);
						context.lineTo(coords[1][0], coords[1][1]);
						context.lineTo(coords[2][0], coords[2][1]);
						context.closePath();
						context.fillStyle = color[ i ? 'fill' : 'border' ];
						context.fill();
					}
				break;

				case 'vml':
					// Determine tip coordinates based on dimensions and setup path string
					coords = calculateTip(mimic, width , height);
					coords = 'm' + coords[0][0] + ',' + coords[0][1] + ' l' + coords[1][0] +
						',' + coords[1][1] + ' ' + coords[2][0] + ',' + coords[2][1] + ' xe';

					// Apply the calculated path to the child VML elements, and apply border/fill colour
					inner.each(function(i) {
						$(this).attr({
							'path': coords,
							'fillcolor': color[ i || !border ? 'fill' : 'border' ]
						})
						.css('antialias', ''+center);
					});
				break;

				case 'polygon':
					inner.removeAttr('style')
						.css({ 'position': 'absolute', 'left': 0, 'top' : 0 })
						.each(function(i) {
							// Determine what border corners/colors to set
							var toSet = {
									x: mimic.precedance === 'x' ? (mimic.x === 'left' ? 'right' : 'left') : mimic.x,
									y: mimic.precedance === 'y' ? (mimic.y === 'top' ? 'bottom' : 'top') : mimic.y
								},
								path = mimic.x === 'center' ? ['left', 'right', toSet.y, height, width] : ['top', 'bottom', toSet.x, width, height],
								col = color[!i && border ? 'border' : 'fill'];

							// Setup borders based on corner values
							if(mimic.x === 'center' || mimic.y === 'center') {
								$(this).css('border-' + path[2], path[3] + regular + col)
									.css('border-' + path[0], round(path[4] / 2) + transparent)
									.css('border-' + path[1], round(path[4] / 2) + transparent);
							}
							else {
								$(this).css('border-width', round(height / 2) + 'px ' + round(width / 2) + 'px')
									.css('border-' + toSet.x, round(width / 2) + regular + col)
									.css('border-' + toSet.y, round(height / 2) + regular + col);
							}
						});
				break;
			}
			
			// Position inner border element if VML or polygon rendering was used and border is enabled
			if(method !== 'canvas' && border) {
				translate = [ border * 2.75, border ];
				if(mimic.precedance === 'y') {
					translate = [
						mimic.x === 'left' ? translate[1] : mimic.x === 'right' ? -translate[1] : 0,
						mimic.y === 'bottom' ? -translate[0] : translate[0]
					];
				}
				else {
					translate = [
						mimic.x === 'left' ? translate[0] : -translate[0],
						mimic.y === 'bottom' ? -translate[1] : mimic.y === 'top' ? translate[1] : 0
					];
				}

				// Apply the calculated offset
				inner.eq(1).css({ 'left': translate[0], 'top': translate[1] });
			}

			// Update position
			self.reposition(corner);

			return self;
		},

		// Tip positioning method
		reposition: function(corner)
		{
			var tip = elems.tip,
				corners  = ['left', 'right'],
				offset = opts.offset,
				accessible = 'ui-tooltip-accessible',
				precedance, precedanceOp;

			// Return if tips are disabled or tip is not yet rendered
			if(opts.corner === FALSE || !tip) { return FALSE; }

			// Inherit corner if not provided
			corner = corner || self.corner;

			// Cache precedances
			precedance = corner.precedance;
			precedanceOp = corner[ precedance === 'y' ? 'x' : 'y' ];

			// Setup corners to be adjusted
			corners[ precedance === 'y' ? 'push' : 'unshift' ]('top', 'bottom');

			// Calculate offset adjustments
			offset = Math.max(precedanceOp === 'center' ? offset : 0, offset);

			// Reet initial position
			tip.css({ top: '', bottom: '', left: '', right: '', margin: '' });
			
			// Adjust primary corners
			switch(precedanceOp)
			{
				case 'center':
					tip.css(corners[0], '50%').css('margin-'+corners[0], -Math.floor(size[ (precedance === 'y') ? 'width' : 'height' ] / 2) + offset);
				break;

				case corners[0]:
					tip.css(corners[0], offset);
				break;

				case corners[1]:
					tip.css(corners[1], offset);
				break;
			}

			// Determine secondary adjustments
			offset = size[ precedance === 'x' ? 'width' : 'height' ];
			if(border) {
				tooltip.toggleClass(accessible, !tooltip.is(':visible'));
				offset -= parseInt(wrapper.css('border-' + corner[ precedance ] + '-width'), 10) || 0;
				tooltip.removeClass(accessible);
			}

			// Adjust secondary corners
			tip.css(corner[precedance], -offset);
		},
		
		destroy: function()
		{
			// Remov tip and bound events
			if(elems.tip) { elems.tip.remove(); }
			tooltip.unbind(namespace);
		}
	});
	
	self.init();
}

$.fn.qtip.plugins.tip = function(qTip)
{
	var api = qTip.plugins.tip;

	return 'object' === typeof api ? api : (qTip.plugins.tip = new Tip(qTip));
};

// Initialize tip on render
$.fn.qtip.plugins.tip.initialize = 'render';

// Setup plugin sanitization options
$.fn.qtip.plugins.tip.sanitize = function(options)
{
	var style = options.style, opts;
	if(style && 'tip' in style) {
		opts = options.style.tip;
		if(typeof opts !== 'object'){ options.style.tip = { corner: opts }; }
		if(!(/string|boolean/i).test(typeof opts.corner)) { opts.corner = true; }
		if(typeof opts.method !== 'string'){ opts.method = TRUE; }
		if(!(/canvas|polygon/i).test(opts.method)){ opts.method = TRUE; }
		if(typeof opts.width !== 'number'){ delete opts.width; }
		if(typeof opts.height !== 'number'){ delete opts.height; }
		if(typeof opts.border !== 'number'){ delete opts.border; }
		if(typeof opts.offset !== 'number'){ delete opts.offset; }
	}
};

// Extend original qTip defaults
$.extend(TRUE, $.fn.qtip.defaults, {
	style: {
		tip: {
			corner: TRUE,
			mimic: FALSE,
			method: TRUE,
			width: 8,
			height: 8,
			border: 0,
			offset: 0
		}
	}
});