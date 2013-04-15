// Munge the primitives - Paul Irish tip
var TRUE = true,
	FALSE = false,
	NULL = null,

	// Common variables
	X = 'x', Y = 'y',
	WIDTH = 'width',
	HEIGHT = 'height',

	// Positioning sides
	TOP = 'top',
	LEFT = 'left',
	BOTTOM = 'bottom',
	RIGHT = 'right',
	CENTER = 'center',

	// Position adjustment types
	FLIP = 'flip',
	FLIPINVERT = 'flipinvert',
	SHIFT = 'shift',

	// Shortcut vars
	QTIP, PROTOTYPE, PLUGINS, CHECKS,
	NAMESPACE = 'qtip',
	HASATTR = 'data-hasqtip',
	WIDGET = ['ui-widget', 'ui-tooltip'],
	usedIDs = {},
	selector = 'div.'+NAMESPACE,
	defaultClass = NAMESPACE + '-default',
	focusClass = NAMESPACE + '-focus',
	hoverClass = NAMESPACE + '-hover',
	disabledClass = 'qtip-disabled',
	replaceSuffix = '_replacedByqTip',
	oldtitle = 'oldtitle',
	trackingBound;

