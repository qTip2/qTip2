PLUGINS = QTIP.plugins = {
	// Corner object parser
	Corner: function(corner, forceY) {
		corner = ('' + corner).replace(/([A-Z])/, ' $1').replace(/middle/gi, CENTER).toLowerCase();
		this.x = (corner.match(/left|right/i) || corner.match(/center/) || ['inherit'])[0].toLowerCase();
		this.y = (corner.match(/top|bottom|center/i) || ['inherit'])[0].toLowerCase();
		this._forceY = !!forceY;

		var f = corner.charAt(0); this.precedance = (f === 't' || f === 'b' ? Y : X);

		this.string = function() {
			var x = this.x, y = this.y;
			return x === y ? x : this.precedance === Y || (this._forceY && y !== 'center') ? y+' '+x : x+' '+y;
		};
		this.abbrev = function() {
			var x = this.x.substr(0,1), y = this.y.substr(0,1);
			return x === y ? x : this.precedance === Y || (this._forceY && y !== 'c') ? y + x : x + y;
		};

		this.invertx = function(center) { this.x = this.x === LEFT ? RIGHT : this.x === RIGHT ? LEFT : center || this.x; };
		this.inverty = function(center) { this.y = this.y === TOP ? BOTTOM : this.y === BOTTOM ? TOP : center || this.y; };

		this.clone = function() {
			return {
				x: this.x, y: this.y, precedance: this.precedance,
				string: this.string, abbrev: this.abbrev, clone: this.clone,
				invertx: this.invertx, inverty: this.inverty
			};
		};
	},

	// Custom (more correct for qTip!) offset calculator
	offset: function(elem, pos, container) {
		if(!container[0]) { return pos; }

		var ownerDocument = $(elem[0].ownerDocument),
			quirks = !!PLUGINS.ie && document.compatMode !== 'CSS1Compat',
			parent = container[0],
			scrolled, position, parentOffset, overflow;

		function scroll(e, i) {
			pos.left += i * e.scrollLeft();
			pos.top += i * e.scrollTop();
		}

		// Compensate for non-static containers offset
		do {
			if((position = $.css(parent, 'position')) !== 'static') {
				if(position === 'fixed') {
					parentOffset = parent.getBoundingClientRect();
					scroll(ownerDocument, -1);
				}
				else {
					parentOffset = $(parent).position();
					parentOffset.left += (parseFloat($.css(parent, 'borderLeftWidth')) || 0);
					parentOffset.top += (parseFloat($.css(parent, 'borderTopWidth')) || 0);
				}

				pos.left -= parentOffset.left + (parseFloat($.css(parent, 'marginLeft')) || 0);
				pos.top -= parentOffset.top + (parseFloat($.css(parent, 'marginTop')) || 0);

				// If this is the first parent element with an overflow of "scroll" or "auto", store it
				if(!scrolled && (overflow = $.css(parent, 'overflow')) !== 'hidden' && overflow !== 'visible') { scrolled = parent; }
			}
		}
		while((parent = parent.offsetParent));

		// Compensate for containers scroll if it also has an offsetParent (or in IE quirks mode)
		if(scrolled && scrolled !== ownerDocument[0] || quirks) {
			scroll(scrolled, 1);
		}

		return pos;
	},

	/*
	 * IE version detection
	 *
	 * Adapted from: http://ajaxian.com/archives/attack-of-the-ie-conditional-comment
	 * Credit to James Padolsey for the original implemntation!
	 */
	ie: (function(){
		var v = 3, div = document.createElement('div');
		while ((div.innerHTML = '<!--[if gt IE '+(++v)+']><i></i><![endif]-->')) {
			if(!div.getElementsByTagName('i')[0]) { break; }
		}
		return v > 4 ? v : NaN;
	}()),
 
	/*
	 * iOS version detection
	 */
	iOS: parseFloat( 
		('' + (/CPU.*OS ([0-9_]{1,5})|(CPU like).*AppleWebKit.*Mobile/i.exec(navigator.userAgent) || [0,''])[1])
		.replace('undefined', '3_2').replace('_', '.').replace('_', '')
	) || FALSE
};