# grunt-clean

Removes previously generated files and directories.

## Getting Started
Install this grunt plugin next to your project's [grunt.js gruntfile][getting_started] with: `npm install grunt-clean`

Then add this line to your project's `grunt.js` gruntfile:

```javascript
grunt.loadNpmTasks('grunt-clean');
```

[grunt]: https://github.com/cowboy/grunt
[getting_started]: https://github.com/cowboy/grunt/blob/master/docs/getting_started.md

## Documentation
Configure which files and directories to delete in your `initConfig`:

```javascript
grunt.initConfig({
  // ... other configs

  clean: {
    folder: "assets/js/"
  }

  // ... other configs
});
```

There's no need to specify `assets/js/**/*` since the task will automatically recursively delete whatever is in that path.

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt][grunt].

## Release History
* 4/25/12 - v0.1.0 - Initial release.

## License
Copyright (c) 2012 Max Beatty
Licensed under the MIT license.
