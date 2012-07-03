# qTip<sup>2</sup> - Plugins - Viewport

The Viewport plugin allows your qTip's to adjust their positioning to keep within a specified viewport i.e. a DOM element.

<a name="classes"></a>
## Position-dependant classes
When the [position.adjust.method](#adjustmethod) is set to either "flip" or "flipinvert" *on one or both directions* an appropriate class is applied
to the qTip which denotes it's current [Corner](../position.md#basics) position. The following list details the [corner values](../position.md#basics)
along with their associated class:

* top left - *ui-tooltip-pos-tl*
* top center - *ui-tooltip-pos-tc*
* top right - *ui-tooltip-pos-tr*
* bottom left - *ui-tooltip-pos-bl*
* bottom center - *ui-tooltip-pos-bc*
* bottom right - *ui-tooltip-pos-br*
* left top - *ui-tooltip-pos-lt*
* left center - *ui-tooltip-pos-lc*
* left bottom - *ui-tooltip-pos-lb*
* right top - *ui-tooltip-pos-rt*
* right center - *ui-tooltip-pos-rc*
* right bottom - *ui-tooltip-pos-rb*
* center center - *ui-tooltip-pos-c*

You can use this to easily adjust the styling of your qTip's based upon their viewport position, cool huh? For example:

```css
.myStyle.ui-tooltip-pos-tl{
	color: red;
}
```

This will cause all qTips with a class (see [style.classes](../style.md#classes)) of *myStyle* to have red text when it's **top left** corner is pointing
at the [position.target](../position.md#target).

<a name="viewport"></a>
## position.viewport

### Values
jQuery([ ]), true, false *(Default: false)*

### Overview
Determines the viewport used to keep the tooltip visible i.e. the element whose boundaries the tooltip must stay visible within at all times if possible.
If **true** it's value will be inherited from the [position.container](../position.md#container) property.

### Examples
Make a tooltip that will attempt to stay within the window viewport, adjusting the positioning corners as needed:

```js
$('.selector').qtip({
	content: {
		text: 'If I go off-screen, my positioning corners will adjust. Resize your browser window to see!'
	},
	position: {
		viewport: $(window)
	}
});
```

### Notes
* Your [position.my/at](../position.md#basics) options will be temporarily adjusted when using this functionality.
* If set to **true** this value will be inherited from the [position.container](../position.md#container) property.


<a name="adjustmethod"></a>
## position.adjust.method

### Values
"{flip|flipinvert|shift|none} {flip|flipinvert|shift|none}" *(Default: "flip")*

### Overview
This option determines the kind of [viewport positioning](#viewport) that takes place.

The default "flip" type basically flips the tooltip when it goes off-screen i.e. from top-right, to bottom-right etc. The "flipinvert" type works the same way, except when the flip happens it inverts the [adjust.x](../position.md#adjust.x) and [adjust.y](../position.md#adjust.y) properties. The "shift" type attempts to keep the tooltip on screen by adjusting only by the amount needed to keep it within the viewport boundaries.

You can specify the behaviour of each axis (i.e. horizontal and vertical) separately, for example a value of "flip none" will cause the tooltip to flip across the horizontal axis when it extends out the viewport, but do nothing when it extends out the viewport vertically. There are a number of combinations.

### Examples
Instead of the default flip repositioning, let's use the shift repositioning, but only shift it horizontally

```js
$('.selector').qtip({
	content: {
		text: 'My position is adjusted just enough to keep me within the viewport, but only along the x axis (horizontally)'
	},
	position: {
		adjust: {
			method: 'shift none'
		}
	}
});
```

### Notes
* Supplying a single string such as "flip", "flipinvert" or "shift" will cause qTip<sup>2</sup> to use that method for **both** axis'.
* This system is very similar to that used in the [jQuery UI Position plugin](http://jqueryui.com/demos/position/).
* Both flip and shift methods also adjusts the [tip](./tips.md) position, if enabled.

### See also
* [position.viewport](#viewport)