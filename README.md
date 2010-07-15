[qTip](http://craigsworks.com/projects/qtip/) - The jQuery tooltip plugin
================================

What you need to build qTip
---------------------------------------
* Make sure that you have PHP installed (if you want to build a minified version of qTip).
* Make sure that you have Java installed (if you want to use the JSLint checker).
If not, [go to this page](http://java.sun.com/javase/downloads/index.jsp) and download "Java Runtime Environment (JRE) 5.0"


How to build qTip
-----------------

In the main directory of the distribution (the one that this file is in), type
the following to make qTip and its accompanying CSS and images:

	make

You can also create each individually using these commands:

	make qtip		# Build non-minified qTip source
	make min			# Build minified qTip source
	make css			# Build CSS files
	make images		# Build images

To build and test the source code against JSLint type this:

	make lint

Finally, you can remove all the built files using the command:

	make clean


Building to a different directory
----------------------------------

If you want to build qTip to a directory that is different from the default location, you can...

	make PREFIX=/home/craig/qtip/ [command]
	
With this, the output files would be contained in `/home/craig/qtip/dist/`

*`[command]` is optional.*


Questions or problems?
----------------------

If you have any questions, please feel free to post on the support forums:
[http://craigsworks.com/projects/forums](http://craigsworks.com/projects/forums)


Special thanks
--------------
Big shout-out to the jQuery team for providing the directory structure and base files for the git repo!