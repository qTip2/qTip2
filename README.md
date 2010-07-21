[qTip](http://craigsworks.com/projects/qtip/) - The jQuery tooltip plugin
================================

What you need to build qTip
---------------------------------------
* *nix make or [Apache Ant](http://ant.apache.org/bindownload.cgi)
* [Java Runtime Environment](http://java.sun.com/javase/downloads/index.jsp) (If you wish to build minified sources or use JSLint check)


How to build qTip (using MAKE)
------------------------

In the main directory of the distribution (the one that this file is in), type
the following to build qTip and its accompanying CSS and images:

	make

You can also create each individually using these commands:

	make qtip		# Build non-minified qTip source
	make min 		# Build minified qTip source
	make pack		# Build minified and packed qTip source (Smallest filesize!)
	make css 		# Build CSS files
	make images		# Build images

To build and test the source code against JSLint type this:

	make lint

Finally, you can remove all the built files using the command:

	make clean


How to build qTip (Using ANT)
------------------------

For those of you without access to *nix make, an ANT build file is also included in the repository. Build instructions are identical to
those above, but replace _make_ with _ant_ e.g.

	ant [command]
	
[command] is optional and can be any of the above i.e. qtip, min, pack etc.


Building to a different directory (MAKE only)
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