# Getting Started

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
**Note:** Notice *the jQuery library is included <b>before</b> qTip<sup>2</sup>*. This is absolutely essential for correct functioning of the plugin!
