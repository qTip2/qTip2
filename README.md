# [qTip2](http://craigsworks.com/projects/qtip2/) - Pretty powerful tooltips
================================

Pre-compiled scripts
--------------------
If you're not interested in compiling your own version of qTip2, you can grab the pre-compiled scripts from the
[dist](http://github.com/Craga89/qTip2/tree/master/dist/) directory and get started quickly. If you want more options
over what plugins are included in your build, take a look below.


What you need to build qTip2
----------------------------
In order to build qTip, you need to have GNU make 3.8 or later, Node.js 0.2 or later, and git 1.7 or later.
(Earlier versions might work OK, but are not tested.)

Windows users have two options:

1. Install [msysgit](https://code.google.com/p/msysgit/) (Full installer for official Git),
   [GNU make for Windows](http://gnuwin32.sourceforge.net/packages/make.htm), and a
   [binary version of Node.js](http://node-js.prcn.co.cc/). Make sure all three packages are installed to the same
   location (by default, this is C:\Program Files\Git).
2. Install [Cygwin](http://cygwin.com/) (make sure you install the git, make, and which packages), then either follow
   the [Node.js build instructions](https://github.com/ry/node/wiki/Building-node.js-on-Cygwin-%28Windows%29) or install
   the [binary version of Node.js](http://node-js.prcn.co.cc/).

Linux/BSD users should use their appropriate package managers to install make, git, and node, or build from source
if you swing that way. Easy-peasy.

Mac OS users should install Xcode (comes on your Mac OS install DVD, or downloadable from
[Apple's Xcode site](http://developer.apple.com/technologies/xcode.html)) and
[http://mxcl.github.com/homebrew/](Homebrew). Once Homebrew is installed, run `brew install git` to install git,
and `brew install node` to install Node.js.


How to build qTip2
------------------
First, clone a copy of the main qTip2 git repo by running `git clone git://github.com/Craga89/qTip2.git`.

Then, in the main directory of the distribution (the one that this file is in), type
the following to build qTip2 and its accompanying CSS:

	make

You can also create each individually using these commands:

	make qtip		# Build non-minified qTip2 source
	make css 		# Build CSS files
	make min 		# Build minified JS and CSS (Smaller filesize)

To build and test the source code against JSLint type this:

	make lint

Finally, you can remove all the built files using the command:

	make clean


Submitting a pull request to the qTip2 repository
-------------------------------------------------
If you're planning on submitting a pull request to the GitHub repository, you'll need to make sure your local git repo rebuilds the `dist/` directory on each commit. To do this,
simply copy the `hooks` folder into the `.git` directory. Inside here is a pre-commit script that will run `make` for you prior to each commit call. Make sure to make MAke installed as
detailed above


Building to a different directory
---------------------------------
If you want to build qTip2 to a directory that is different from the default location, you can specify the PREFIX
directory: `make PREFIX=/home/craig/qtip/ [command]`

With this example, the output files would end up in `/home/craig/qtip/dist/`.


Choosing which features are included in your qTip2 build
--------------------------------------------------------
By default qTip2 is built with all plugins enabled. You can see an example of this in the [dist](http://github.com/Craga89/qTip2/tree/master/dist/jquery.qtip.js) file.
If you want more control over what plugins are included, you can do so by adding some extra parameters to your build commands.

For example, if you plan on using only the tips plugin, you'd specify the plugins variable as so:

	make PLUGINS="tips" [command]

Notice the only thing that was added was the PLUGINS parameter. This tells the compiler which files to include in the final qTip2 build. You can specify multiple
plugins by separating them with a space:

	make PLUGINS="tips ajax modal" [command]

By default all plugins are included in the build, so the regular `[make all]` command is actually equivilent to:

	make PLUGINS="ajax tips imagemap svg modal bgiframe" [command]

* Note: The above was correct at the time of writing. Subsequent revisions may change file names or add new plugins, so checkout the Makefile for a full up-to-date list of all plugins*


Questions or problems?
----------------------
If you have any questions, please feel free to post on the support forums:
[http://craigsworks.com/projects/forums](http://craigsworks.com/projects/forums)


Special thanks
--------------
Big shout-out to the jQuery team for providing the directory structure and base files for the git repo, as well as the base-files for the new NodeJS build system!