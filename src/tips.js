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
		cache = { 
			top: 0, 
			left: 0, 
			corner: ''
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
		'^position.my|style.tip.(corner|mimic|method|border)$': function() {
			// Make sure a tip can be drawn
			if(!self.init()) {
				self.destroy();
			}

			// Reposition the tooltip
			qTip.reposition();
		},
		'^style.tip.(height|width)$': function() {
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
		'^content.title.text|style.(classes|widget)$': function() {
			if(elems.tip) {
				self.update();
			}
		}
	};

	function reposition(event, api, pos, viewport) {
		if(!elems.tip) { return; }

		var newCorner = $.extend({}, self.corner),
			precedance = newCorner.precedance,
			adjusted = pos.adjusted,
			sides = ['top', 'left'],
			offset, offsetPrecedance;

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
			if(newCorner.string() !== cache.corner && (cache.top !== adjusted.top || cache.left !== adjusted.left)) {
				offset = self.update(newCorner);
			}
		}

		// Adjust position to accomodate tip dimensions
		if(!offset) { offset = self.position(newCorner, 0); }
		if(offset.right !== undefined) { offset.left = offset.right; }
		if(offset.bottom !== undefined) { offset.top = offset.bottom; }
		offset.option = Math.max(0, opts.offset);

		pos.left -= offset.left.charAt ? offset.option : (offset.right ? -1 : 1) * offset.left;
		pos.top -= offset.top.charAt ? offset.option : (offset.bottom ? -1 : 1) * offset.top;

		// Cache details
		cache.left = adjusted.left; cache.top = adjusted.top;
		cache.corner = newCorner.string();
	}

	/* border width calculator */
	function borderWidth(corner, side, backup) {
		side = !side ? corner[corner.precedance] : side;

		var isTitleTop = elems.titlebar && corner.y === 'top',
			elem = isTitleTop ? elems.titlebar : elems.content,
			css = 'border-' + side + '-width',
			val = parseInt(elem.css(css), 10);

		return (backup ? val || parseInt(tooltip.css(css), 10) : val) || 0;
	}
	
	
	function borderRadius(corner) {
		var isTitleTop = elems.titlebar && corner.y === 'top',
			elem = isTitleTop ? elems.titlebar : elems.content,
			moz = $.browser.mozilla,
			prefix = moz ? '-moz-' : $.browser.webkit ? '-webkit-' : '',
			side = corner.y + (moz ? '' : '-') + corner.x,
			css = prefix + (moz ? 'border-radius-' + side : 'border-' + side + '-radius');

		return parseInt(elem.css(css), 10) || parseInt(tooltip.css(css), 10) || 0;
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

				// Create a new tip and draw it
				self.create();
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

				useTitle = elems.titlebar && 
					(corner.y === 'top' || (corner.y === 'center' && tip.position().top + (size.height / 2) + opts.offset < elems.titlebar.outerHeight(1))),
				colorElem = useTitle ? elems.titlebar : elems.content;
				
			// Detect tip colours from CSS styles
			color.fill = tip.css(backgroundColor) || transparent;
			color.border = tip[0].style[ borderSideCamel ];


			// Make sure colours are valid
			if(!color.fill || invalid.test(color.fill)) { 
				color.fill = colorElem.css(backgroundColor);
				if(invalid.test(color.fill)) {
					color.fill = tooltip.css(backgroundColor);
				}
			}

			if(!color.border || invalid.test(color.border)) {
				color.border = tooltip.css(borderSide);
				if(invalid.test(color.border) || color.border === $(docBody).css('color')) { 
					color.border = colorElem.css(borderSide) || color.fill;
				}
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
				.css(size).prependTo(tooltip);

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
		},

		update: function(corner)
		{
			var tip = elems.tip,
				inner = tip.children(),
				width = size.width,
				height = size.height,
				regular = 'px solid ',
				transparent = 'px dashed transparent', // Dashed IE6 border-transparency hack. Awesome!
				mimic = opts.mimic,
				position, i, img, context, coords, center, translate, round;

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

			// Detect border width
			border = opts.border === TRUE ? borderWidth(corner, NULL, TRUE) : opts.border;
			i = border > 0 ? 0 : 1;

			// Determine if tip is a "center" based one
			center = mimic.string().indexOf('center') > -1;

			// Custom rounding for pixel perfect precision!
			round = Math[ /b|r/.test(mimic[ mimic.precedance === 'y' ? 'x' : 'y' ]) ? 'ceil' : 'floor' ];

			// Update position first
			position = self.position(corner, 1);

			// Update our colours
			self.detectColours();

			// Create tip element
			switch(method)
			{
				case 'canvas':
					// Grab canvas context and clear it
					context = inner[0].getContext('2d');
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
			
			return position;
		},

		// Tip positioning method
		position: function(corner, set)
		{
			var tip = elems.tip,
				position = {},
				offset = Math.max(0, opts.offset),
				precedance, dimension;

			// Return if tips are disabled or tip is not yet rendered
			if(opts.corner === FALSE || !tip) { return FALSE; }

			// Inherit corner if not provided
			corner = corner || self.corner;
			precedance = corner.precedance;

			// Determine which tip dimension to use for adjustment
			dimension = size[ precedance === 'x' ? 'width' : 'height' ];

			/* Calculate tip position */
			$.each(
				precedance === 'y' ? [ corner.x, corner.y ] : [ corner.y, corner.x ],
				function(i, side)
				{
					var b;

					if(side === 'center') {
						b = precedance === 'y' ? 'left' : 'top';
						position[ b ] = '50%';
						position['margin-' + b] = -Math.floor(dimension / 2) + offset;
					}
					else {
						b = borderWidth(corner, side, TRUE);
						position[ side ] = i || border === undefined ? 
							borderWidth(corner, side) : 
							offset + (!b ? borderRadius(corner) : 0);
					}
				}
			);
			position[ corner[precedance] ] -= dimension;

			// Set and return new position
			if(set) { tip.css({ top: '', bottom: '', left: '', right: '', margin: '' }).css(position); }
			return position;
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
		if(!(/string|boolean/i).test(typeof opts.corner)) { opts.corner = TRUE; }
		if(typeof opts.method !== 'string'){ opts.method = TRUE; }
		if(!(/canvas|polygon/i).test(opts.method)){ opts.method = TRUE; }
		if(typeof opts.width !== 'number'){ delete opts.width; }
		if(typeof opts.height !== 'number'){ delete opts.height; }
		if(typeof opts.border !== 'number' && opts.border !== TRUE){ delete opts.border; }
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
			border: TRUE,
			offset: 0
		}
	}
});