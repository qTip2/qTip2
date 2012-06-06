[qTip<sup>2</sup>](http://craigsworks.com/projects/qtip2/) - Pretty powerful tooltips
================================

Introducing&hellip; qTip<sup>2</sup>. The second generation of the advanced qTip plugin for the ever popular jQuery framework.

Building on 1.0's user friendly, yet feature rich base, qTip<sup>2</sup> provides you with tonnes of features like
[speech bubble tips](/Craga89/qTip2/tree/master/docs/plugins/tips.md) and [imagemap support](/Craga89/qTip2/tree/master/docs/plugins/imagemap.md), and best of all...
**it's completely free under the MIT/GPLv2 licenses!**

More documentation and information is available at the [official site](http://craigsworks.com/projects/qtip2).

## Browser support
<div style="text-transform: sub; text-align: center;">
<img src="http://media1.juggledesign.com/qtip2/images/browsers/64-chrome.png" title="Chrome 8+" /> 8+ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
<img src="http://media1.juggledesign.com/qtip2/images/browsers/64-firefox.png" title="Firefox 3+" /> 3+ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
<img src="http://media1.juggledesign.com/qtip2/images/browsers/64-ie.png" title="Internet Explorer 6+" /> 6+ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
<img src="http://media1.juggledesign.com/qtip2/images/browsers/64-opera.png" title="Opera 9+" /> 9+ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
<img src="http://media1.juggledesign.com/qtip2/images/browsers/64-safari.png" title="Safari 2+, iOS 4+" /> 2+, iOS 4+
</div>


## Getting qTip<sup>2</sup>

### Stable releases
You can grab the *latest stable releases* from the [download page](http://craigsworks.com/projects/qtip2/download) of the [official site](http://craigsworks.com/projects/qtip2). This also lets
you choose what [plugins](/Craga89/qTip2/tree/master/docs/plugins/) you'd like included in your download, as well as other things.

### Bleeding edge
You can grab the latest and greatest qTip<sup>2</sup> nightly from the [dist](/Craga89/qTip2/tree/master/dist/) directory and get started quickly. If you want more options
over what plugins are included in your build, take a look below.

### Custom builds
You can also build your own qTip<sup>2</sup> script that includes select [plugins](/Craga89/qTip2/tree/master/docs/plugins/) and [styles](/Craga89/qTip2/tree/master/docs/style.md) to reduce the overall file size and remove features
you don't plan on using. Find more information about this [here](/Craga89/qTip2/tree/master/docs/build.md)


## Installation
Now you have the jQuery library and qTip<sup>2</sup> files, it's time to include them within your HTML. I **highly recommend** that all JavaScript includes be placed just before the end *&lt;/body&gt;*
tag as this ensures the DOM is loaded before manipulation of it occurs. This is not a requirement, simply an insiders tip!

```html
<html>
<head>
<title>My site</title>
<!-- css file -->
<link type="text/css" rel="stylesheet" href="/path/to/jquery.qtip-2.0.0.css" />
</head>
<body>
<!-- content here -->
<script type="text/javascript" src="/path/to/jquery.1.4.2.min.js"></script>

<!-- Notice we only include the minified script here. You can include the non-minified version, just don't include both! -->
<script type="text/javascript" src="/path/to/jquery.qtip-2.0.0.min.js"></script>
</body>
</html>
```

**Note:** Make sure to include either the non-minified *or* the un-minified script, **not both!** <br/>
**Note:** Notice *the jQuery library is included ***before** qTip<sup>2</sup>*. This is absolutely essential for correct functioning of the plugin!


## Questions or problems?
If you have any questions, please feel free to post on the [support forums](http://craigsworks.com/projects/forums), but before you do make sure to
check out the [thorough documentation](/Craga89/qTip2/tree/master/docs/) both here in the repo and on the [official site](http://craigsworks.com/projects/qtip2).

## Special thanks
Big shout-out to the jQuery team for providing the directory structure and base files for the git repo, as well as the base-files for the new NodeJS build system!