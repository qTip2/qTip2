# qTip<sup>2</sup> - Plugins - Imagemap

<a name="overview"></a>
## Overview
The imagemap plugin adds additional positioning logic for &lt;map&gt; and &lt;area&gt; elements, allowing you to use qTips special [corner positioning](../position.md)
system with your imagemaps.

<a name="usage"></a>
## Usage
This particular plugin requires no additional user configuration. In order to utilise it, simply make sure you have it included in your qTip build and make sure that you point your jQuery selector to
the &lt;area&gt; elements, **NOT the &lt;map&gt; element!** For example:

```js
$('area').qtip({
	content: {
		text: 'Support for area maps with no extra configuration! Awesome.'
	},
	position: {
		my: 'top left',
		at: 'bottom right'
	}
});
```