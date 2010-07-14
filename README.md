[qTip](http://craigsworks.com/projects/qtip/) - The jQuery tooltip plugin
================================

What you need to build your own jQuery
---------------------------------------
* Make sure that you have PHP installed (if you want to build a minified version of qTip).
* Make sure that you have Java installed (if you want to use the JSLint checker).
If not, [go to this page](http://java.sun.com/javase/downloads/index.jsp) and download "Java Runtime Environment (JRE) 5.0"


How to build qTip
-----------------------------

In the main directory of the distribution (the one that this file is in), type
the following to make all versions of qTip:

	make

The standard, uncompressed, jQuery code.
Makes: `./dist/jquery.qtip.js`

	make min

A compressed version of qTip (made using Dean Edwards [Packer](http://dean.edwards.name/packer/)).
Makes: `./dist/jquery.qtip.min.js`

	make lint

Tests a build of qTip against JSLint, looking for potential errors and non-conformant code.


Finally, you can remove all the built files using the command:

	make clean


Building to a different directory
----------------------------------

If you want to build jQuery to a directory that is different from the default location, you can...

	make PREFIX=/home/john/test/ [command]
	
With this, the output files would be contained in `/home/john/test/dist/`

*`[command]` is optional.*


Questions?
----------

If you have any questions, please feel free to ask them on the jQuery
mailing list, which can be found here:  
[http://docs.jquery.com/Discussion](http://docs.jquery.com/Discussion)
