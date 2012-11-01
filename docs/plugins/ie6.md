# qTip<sup>2</sup> - Plugins - IE6

<a name="overview"></a>
## Overview
This plugin is an IE6 compatibility layer that wraps around the [IE6 BGIFrame jquery plugin](http://plugins.jquery.com/project/bgiframe) by Brandon Aaron, and also simulates the [max/min]-width CSS properties applied to the tooltip (if present).

<a name="usage"></a>
## Usage
This particular plugin requires no additional user configuration. In order to utilise it, simply make sure it's included in your [qTip<sup>2</sup> build](http://craigsworks.com/projects/qtip2/tutorials/github).

Note that this is a compatability plugin for IE6 only, and will have no effect in any other browser.

<a name="elements"></a>
## Elements
**In IE6 only**, the created BGIframe element is available through the API's elements object:

```js
$('.selector').qtip({
	content: {
		text: 'IE6 bgiframe plugin'
	},
	events: {
		render: function(event, api) {
			// Grab the BGIFrame element
			var elem = api.elements.bgiframe;
		}
	}
});
```