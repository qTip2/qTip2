# qTip<sup>2</sup> - Complete guide - Content

qTip<sup>2</sup> supports the use of regular old browser text, as well as complex HTML, but what are the best ways of actually providing qTip<sup>2</sup> with the content? Element attributes? Hidden text? It really depends upon your spefific scenario, but here's some basic examples to get you started

## Simple text

### The *title* attribute
If you plan on using qTip<sup>2</sup> as simply a very thin replacement of the browser tooltips, the title attribute is a great way to do so. It's standards compliant, it's the expected place for tooltip text, and the plugin will automaically look there for it's content if none is given inside your `.qtip({ ... })` config object!

```js
$('[title]').qtip(); // Grab all elements with a title attribute, and apply qTip!
$('[title!=""]').qtip(); // A bit better. Grab elements with a title attribute that isn't blank.
```

This is the simplest method of using qTip<sup>2</sup>, as it requires very little setup and works to replace existing, native tooltips auto-magically!


### A custom attribute
If for some reason you can't use the title attribute, or you'd like to use a different attribute for your tooltip text, then you can easily tell qTip<sup>2</sup> not to look in the title attribute by default, by setting the `content.attr` config property. For example, say we're using a custom *data-* attribute named `data-tooltip`:

```js
$('[data-tooltip!=""]').qtip({ // Grab all elements with a non-blank data-tooltip attr.
	content: {
		attr: 'data-tooltip' // Tell qTip2 to look inside this attr for it's content
	}
})
```


## HTML

### A note on "this" variable
For those of you new to JavaScript/jQuery land, we'll take a small side-track here to describe a unique property of JavaScript: *the "this" variable*. Feel free to skip this is you're already familiar with it.

This `this` variable in JavaScript is *scope-dependant*, meaning it's value with change depending upon where abouts you access it within your code. For example, accessing the `this` keyword within the "global" scope i.e. outside any functions/scope, it will refer to the `window` element.

Here's a quick example of how "this" can change, depending upon where it's accessed:

```js
// This will print out the value of "this" for us
function log() { console.log(this); };

log(); // Will print out the "window" (log function has no set scope) 
log.call([ 1 ]) // Will print out the "[ 1 ]" array
log.apply({ foo: "bar" }); // Wll print out the "{ foo:"bar" }" object
```

Almost all of the jQuery methods which take a function as their parameter also set the value of "this" to refer to the element itself (or each element, if the jQuery object contains more than one). For example:

```js
$('a').each(function() { // Grab all "<a>" elements, and for each...
	log(this); // ...print out "this", which now refers to each <a> DOM element 
});

$('[title]').qtip({ // Grab all elements with a title attribute
	content: {
		text: $(this).next(); // Won't work, because "this" is the window element!
	}
});

$('[title]').each(function() { // Grab all elements with a title attribute,and set "this"
	$(this).qtip({ // 
		content: {
			text: $(this).next(); // WILL work, because .each() sets "this" to refer to each element
		}
	});
});
```

### A hidden element
For complex HTML content where you require the tooltip content to be printed out alongside the element that will be displaying the qTip, the hidden element approach is best suited. When printing out your HTML, either via some server-side script like PHP or Python, or via hand in a text editor, put the tooltip contents within a `<div>` element located *directly next to* the element which requires the qTip. For example:

```html
<div class="hasTooltip">Hover me to see a tooltip</div>
<div class="hidden"> <!-- This class should hide the element, change it if needed -->
	<p><b>Complex HTML</b> for your tooltip <i>here</i>!</p>
</div>
```

*It's important that the elements be **directly next to eachother** in the DOM* otherwise this approach won't work because of the nature of the jQuery `.next()` method we'll be using! Once you've got the HTML set up as described above, we can setup our qTip's like so:

```js
// Grab all elements with the class "hasTooltip"
$('.hasTooltip').each(function() { // Notice the .each() loop, discussed below
	$(this).qtip({
		content: {
			text: $(this).next('div') // Use the "div" element next to this for the content
		}
	});
});
```

### XHR (AJAX)
For situations where you'd like to load in additonal content from an external page (located on the same domain, or cross-domain if you're using CORS), use the AJAX plugin. This allows you to easily pull content into your qTip's from a defined URL using regular old `$.ajax` syntax, located in the `content.ajax` object. For example, say we've got a number of elements on the page with an attribute `data-url`, which contains the URL to look for that elements tooltip content:

```js
$('[data-url]').each(function(i) {
	// Store $(this) in a variable, more efficient than calling $() multile times
	var element = $(this); 

	element.qtip({
		content: {
			text: 'Loading...', // Set some initial text, otherwise qTip won't load!
			ajax: {
				url: element.data('url') // Use data-url attribute for the URL
			}
		}
	});
});
```

And there you have it. When mousing over those elements with the `data-url` attribute, qTip will automatically grab the HTML from the elements URL, and set it as the qTip content.