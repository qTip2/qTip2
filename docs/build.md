# qTip<sup>2</sup> - Custom builds

## What you need to build qTip2
In order to build qTip<sup>2</sup>, you need to have Node.js 0.7 or later, [grunt][grunt] and [grunt-contrib][contrib].

### Installing Node.js
Head over to [http://nodejs.org/](http://nodejs.org/) to grab the OS-specific installer for Node.js and the Node Package Manager.

### Installing grunt
1. Test that grunt is installed globally by running `grunt --version` at the command-line.
2. If grunt isn't installed globally, run `npm install -g grunt` to install the latest version. _You may need to run `sudo npm install -g grunt`._
3. From the root directory of this project, run `npm install` to install the project's dependencies.

### Installing grunt-contrib
1. run `npm install grunt-contrib` to install the latest version.

## Important notes
Please don't edit files in the `dist` subdirectory as they are automagically generated via grunt. You'll find source code in the `src` subdirectory!

## How to build qTip<sup>2</sup>
First, clone a copy of the main qTip2 git repo by running `git clone git://github.com/Craga89/qTip2.git`.

Then, in the main directory of the distribution (the one that this file is in), type
the following to build qTip<sup>2</sup> and its accompanying CSS:

	grunt

You can also create each individually using these commands:

	grunt clean			# Clean up the dist/ directory
	grunt basic			# Build qTip2 with no plugins included
	grunt css 			# Build CSS files
	grunt compress		# Generate a zip of the dist/ directory

To build and test the source code against JSLint type this:

	grunt lint

Finally, you can remove all the built files using the command:

	grunt clean


## Submitting a pull request to the qTip2 repository
If you're planning on submitting a pull request to the GitHub repository, you'll need to make sure your local git repo rebuilds the `dist/` directory on each commit. To do this,
simply copy the `hooks` folder into the `.git` directory. Inside here is a pre-commit script that will run `grunt` for you prior to each commit call, to generate the `dist/` files.

## Choosing which features are included in your qTip<sup>2</sup> build
By default qTip<sup>2</sup> is built with all plugins enabled. You can see an example of this in the [dist][dist] file.
If you want more control over what plugins are included, you can do so by adding some extra parameters to your build commands.

For example, if you plan on using only the tips plugin, you'd specify the plugins variable as so:

	grunt --plugins="tips" [command]

Notice the only thing that was added was the PLUGINS parameter. This tells the compiler which files to include in the final qTip<sup>2</sup> build. You can specify multiple
plugins by separating them with a space:

	grunt --plugins="tips ajax viewport" [command]

By default all plugins are included in the build, so the regular `[grunt all]` command is actually equivilent to:

	grunt --plugins="ajax viewport tips imagemap svg modal bgiframe" [command]

* Note: The above was correct at the time of writing. Subsequent revisions may change file names or add new plugins, so checkout the `grunt.js` file for a full up-to-date list
of all plugins*

[dist]: /Craga89/qTip2/tree/master/dist/jquery.qtip.js
[grunt]: https://github.com/cowboy/grunt
[contrib]: https://github.com/gruntjs/grunt-contrib