# qTip<sup>2</sup> - Plugins - SVG

<a name="overview"></a>
## Overview
The SVG plugin adds additional positioning and dimension calculation logic for SVG elements, allowing you to use qTips special [corner positioning](../position.md)
system with your SVG elements.

This plugin was originally developed by [Edward Rudd](http://www.outoforder.cc/). Big shout-out to him for this!

<a name="usage"></a>
## Usage
This particular plugin requires no additional user configuration. In order to utilise it, simply make sure you have it included in your qTip build and use as normal:

```js
$('path').qtip({
	content: {
		text: 'Support for SVG with no extra configuration! Awesome.'
	},
	position: {
		my: 'top left',
		at: 'bottom right'
	}
});
```