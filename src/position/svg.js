PLUGINS.svg = function(api, svg, corner, adjustMethod)
{
	var doc = $(document),
		elem = svg[0],
		result, position, dimensions,
		len, next, i, points; // line/polygon/polyline

	// Ascend the parentNode chain until we find an element with getBBox()
	while(!elem.getBBox) { elem = elem.parentNode; }
	if(!elem.getBBox || !elem.parentNode) { return FALSE; }

	// Determine which shape calculation to use
	switch(elem.nodeName) {
		case 'rect':
			position = PLUGINS.svg.toPixel(elem, elem.x, elem.y);

			dimensions = PLUGINS.svg.toPixel(elem,
				elem.x.baseVal.value + elem.width.baseVal.value,
				elem.y.baseVal.value + elem.height.baseVal.value
			);

			result = PLUGINS.polys.rect(
				position[0], position[1],
				dimensions[0], dimensions[1],
				corner
			);
		break;

		case 'ellipse':
		case 'circle':
			position = PLUGINS.svg.toPixel(elem, elem.cx, elem.cy);

			dimensions = PLUGINS.svg.toPixel(elem,
				(elem.rx || elem.r).baseVal.value, 
				(elem.ry || elem.r).baseVal.value
			);

			result = PLUGINS.polys.ellipse(
				position[0], position[1],
				dimensions[0], dimensions[1],
				corner
			);
		break;

		case 'line':
		case 'polygon':
		case 'polyline':
			points = elem.points || [ { x: elem.x1, y: elem.y1 }, { x: elem.x2, y: elem.y2 } ];

			for(result = [], i = -1, len = points.numberOfItems || points.length; ++i < len;) {
				next = points.getItem ? points.getItem(i) : points[i];
				result.push.apply(result, PLUGINS.svg.toPixel(elem, next.x, next.y));
			}

			result = PLUGINS.polys.polygon(result, corner);
		break;

		// Unknown shape... use bounding box
		default: 
			result = elem.getBBox();

			position = PLUGINS.svg.toPixel(elem, result.x, result.y);
			dimensions = PLUGINS.svg.toPixel(elem,
				result.x + result.width,
				result.y + result.height
			);

			result = PLUGINS.polys.rect(
				position[0], position[1],
				dimensions[0], dimensions[1],
				corner
			);
		break;
	}

	// Adjust by scroll offset
	result.position.left += doc.scrollLeft();
	result.position.top += doc.scrollTop();

	return result;
};

PLUGINS.svg.toPixel = function(elem, x, y) {
	var mtx = elem.getScreenCTM(),
		root = elem.farthestViewportElement || elem,
		result, point;

	// Create SVG point
	if(!root.createSVGPoint) { return FALSE; }
	point = root.createSVGPoint();

	point.x = x.baseVal ? x.baseVal.value : x;
	point.y = y.baseVal ? y.baseVal.value : y;
	result = point.matrixTransform(mtx);
	return [ result.x, result.y ];
};
