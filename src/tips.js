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
		namespace = '.qtip-tip';

	self.corner = NULL;
	self.mimic = NULL;
	self.checks = {
		'^position.my|style.tip.(corner|mimic|border)$': function() {
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
			adjusted = pos.adjusted,
			offset;

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

	function calculateSize(corner) {
		var y = corner.precedance === 'y',
			width = size [ y ? 'width' : 'height' ],
			height = size [ y ? 'height' : 'width' ],
			isCenter = corner.string().indexOf('center') > -1,
			base = width * (isCenter ? 0.5 : 1),
			pow = Math.pow,
			bigHyp, ratio, result,

		smallHyp = Math.sqrt( pow(base, 2) + pow(height, 2) ),
		
		hyp = [
			(border / base) * smallHyp, (border / height) * smallHyp
		];
		hyp[2] = Math.sqrt( pow(hyp[0], 2) - pow(border, 2) );
		hyp[3] = Math.sqrt( pow(hyp[1], 2) - pow(border, 2) );

		bigHyp = smallHyp + hyp[2] + hyp[3] + (isCenter ? 0 : hyp[0]);
		ratio = bigHyp / smallHyp;

		result = [ ratio * height, ratio * width ];
		return { height: result[ y ? 0 : 1 ], width: result[ y ? 1 : 0 ] };
	}

	$.extend(self, {
		init: function()
		{
			var enabled = self.detectCorner() && ($('<canvas/>')[0].getContext || $.browser.msie);

			// Determine tip corner and type
			if(enabled) {
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
				if(invalid.test(color.border) || color.border === $(document.body).css('color')) { 
					color.border = (colorElem.css(borderSide) !== $(qTip.elements.content).css('color') ? 
						colorElem.css(borderSide) : transparent);
				}
			}

			// Reset background and border colours
			$('*', tip).add(tip).css(backgroundColor, transparent).css('border', '0px dashed transparent');
		},

		create: function()
		{
			var width = size.width,
				height = size.height,
				vml;

			// Remove previous tip element if present
			if(elems.tip) { elems.tip.remove(); }

			// Create tip element and prepend to the tooltip
			elems.tip = $('<div />', { 'class': 'ui-tooltip-tip' }).css({ width: width, height: height }).prependTo(tooltip);

			// Create tip drawing element(s)
			if($.browser.msie) {
				vml = '<vml:shape coordorigin="0,0" stroked="false" style="behavior:url(#default#VML); ' +
						' display:inline-block; position:absolute; antialias:true;"></vml:shape>';
				elems.tip.html( border ? vml += vml : vml );
			}
			else {
				// save() as soon as we create the canvas element so FF2 doesn't bork on our first restore()!
				$('<canvas />').appendTo(elems.tip)[0].getContext('2d').save();
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
				precedance, context, coords, translate, newSize;

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
			precedance = mimic.precedance;

			// Update our colours
			self.detectColours();

			// Detect border width, taking into account colours
			border = color.border === 'transparent' || color.border === '#123456' ? 0 :
				opts.border === TRUE ? borderWidth(corner, NULL, TRUE) : opts.border;

			// Calculate coordinates
			coords = calculateTip(mimic, width , height);

			// Determine tip size
			newSize = calculateSize(corner);
			tip.css(newSize);

			// Calculate tip translation
			if(corner.precedance === 'y') {
				translate = [
					Math.round(mimic.x === 'left' ? border : mimic.x === 'right' ? newSize.width - width - border : (newSize.width - width) / 2),
					Math.ceil(mimic.y === 'top' ?  newSize.height - height : 0)
				];
			}
			else {
				translate = [
					Math.ceil(mimic.x === 'left' ? newSize.width - width : 0),
					Math.round(mimic.y === 'top' ? border : mimic.y === 'bottom' ? newSize.height - height - border : (newSize.height - height) / 2)
				];
			}

			// Create tip element
			if($.browser.msie) {
				// Setup coordinates string
				coords = 'm' + coords[0][0] + ',' + coords[0][1] + ' l' + coords[1][0] +
					',' + coords[1][1] + ' ' + coords[2][0] + ',' + coords[2][1] + ' xe';

				// Set the translation offset
				inner.attr({
					coordsize: (width+border) + ' ' + (height+border),
					fillcolor: color.fill,
					path: coords
				})
				.css({
					antialias: ''+(mimic.string().indexOf('center') > -1),
					left: translate[0] - Number(precedance === 'x'),
					top: translate[1] - Number(precedance === 'y'),
					width: width + border,
					height: height + border
				});

				// Check if border is enabled and format it
				if(border > 0) {
					inner = inner.eq(0);
					inner.css({ left: translate[0], top: translate[1] })
						.attr({ filled: FALSE, stroked: TRUE });
					
					if(inner.html() === '') {
						inner.html('<vml:stroke weight="'+(border*2)+'px" color="'+color.border+'" miterlimit="1000" joinstyle="miter" ' +
							' style="behavior:url(#default#VML); display:inline-block;" />');
					}
				}
			}
			else {
				// Set the canvas size using calculated size
				inner.attr(newSize);

				// Grab canvas context and clear/save it
				context = inner[0].getContext('2d');
				context.restore(); context.save();
				context.clearRect(0,0,3000,3000);

				// Translate origin
				context.translate(translate[0], translate[1]);

				// Draw the tip
				context.beginPath();
				context.moveTo(coords[0][0], coords[0][1]);
				context.lineTo(coords[1][0], coords[1][1]);
				context.lineTo(coords[2][0], coords[2][1]);
				context.closePath();
				context.fillStyle = color.fill;
				context.strokeStyle = color.border;
				context.lineWidth = border * 2;
				context.lineJoin = 'miter';
				context.miterLimit = 100;
				context.stroke();
				context.fill();
			}

			return self.position(corner, 1);
		},

		// Tip positioning method
		position: function(corner, set)
		{
			var tip = elems.tip,
				position = {},
				offset = Math.max(0, opts.offset),
				precedance, dimension,
				adjust = corner.string().charAt(0);
				adjust = border && (adjust === 'b' || adjust === 'r') ? Number($.browser.msie) : 0;
				
			// Return if tips are disabled or tip is not yet rendered
			if(opts.corner === FALSE || !tip) { return FALSE; }

			// Inherit corner if not provided
			corner = corner || self.corner;
			precedance = corner.precedance;

			// Determine which tip dimension to use for adjustment
			dimension = calculateSize(corner)[ precedance === 'x' ? 'width' : 'height' ];

			/* Calculate tip position */
			$.each(
				precedance === 'y' ? [ corner.x, corner.y ] : [ corner.y, corner.x ],
				function(i, side)
				{
					var b, br;

					if(side === 'center') {
						b = precedance === 'y' ? 'left' : 'top';
						position[ b ] = '50%';
						position['margin-' + b] = -Math.floor(dimension / 2) + offset;
					}
					else {
						b = borderWidth(corner, side, TRUE);
						br = borderRadius(corner);

						position[ side ] = i || border === undefined ? 
							borderWidth(corner, side) :
							offset + (br > b ? br : 0);
					}
				}
			);
			position[ corner[precedance] ] -= dimension + (adjust || 0);

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
			width: 8,
			height: 8,
			border: TRUE,
			offset: 0
		}
	}
});