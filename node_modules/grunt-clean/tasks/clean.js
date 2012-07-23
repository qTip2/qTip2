/*
 * grunt-clean
 * https://github.com/maxbeatty/grunt-clean
 *
 * Copyright (c) 2012 Max Beatty
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {

  // Please see the grunt documentation for more information regarding task and
  // helper creation: https://github.com/cowboy/grunt/blob/master/docs/toc.md

  // ==========================================================================
  // TASKS
  // ==========================================================================

  grunt.registerMultiTask('clean', 'Removes previously generated files and directories', function() {
    if (!this.data) { return false; }

    var status = grunt.helper('clean', this.data);

    grunt.log.writeln("Folder \"" + this.data + "\" contents removed.");
  });

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  grunt.registerHelper('clean', function(p) {
    // extracted from rimraf
    var fs = require('fs'),
        path = require('path'),
        lstat = process.platform === "win32" ? "stat" : "lstat",
        lstatSync = lstat + "Sync",
        d = path.resolve(p),
        s;

    try {
      s = fs[lstatSync](d);
    } catch (er) {
      if (er.code === "ENOENT") { return true; }
      throw er;
    }

    if(!s.isDirectory()) { return fs.unlinkSync(d); }

    fs.readdirSync(d).forEach(function (f) {
      grunt.helper('clean', path.join(d, f));
    });

    fs.rmdirSync(d);
  });

};
