/*
 * grunt-css
 * https://github.com/jzaefferer/grunt-css
 *
 * Copyright (c) 2012 Jörn Zaefferer
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {

  grunt.registerMultiTask( "csslint", "Lint CSS files with csslint", function() {
    var csslint = require( "csslint" ).CSSLint;
    var files = grunt.file.expandFiles( this.file.src );
    var ruleset = {};
    var verbose = grunt.verbose;
    csslint.getRules().forEach(function( rule ) {
      ruleset[ rule.id ] = 1;
    });
    for ( var rule in this.data.rules ) {
      if ( !this.data.rules[ rule ] ) {
        delete ruleset[rule];
      } else {
        ruleset[ rule ] = this.data.rules[ rule ];
      }
    }
    var hadErrors = 0;
    files.forEach(function( filepath ) {
      var file = grunt.file.read( filepath ),
        message = "Linting " + filepath + "...",
        result;

      // skip empty files
      if (file.length) {
        result = csslint.verify( file, ruleset );
        verbose.write( message );
        if (result.messages.length) {
          verbose.or.write( message );
          grunt.log.error();
        } else {
          verbose.ok();
        }

        result.messages.forEach(function( message ) {
          grunt.log.writeln( "[".red + (typeof message.line !== "undefined" ? ( "L" + message.line ).yellow + ":".red + ( "C" + message.col ).yellow : "GENERAL".yellow) + "]".red );
          grunt.log[ message.type === "error" ? "error" : "writeln" ]( message.message + " " + message.rule.desc + " (" + message.rule.id + ")" );
        });
        if ( result.messages.length ) {
          hadErrors += 1;
        }
      } else {
        grunt.log.writeln( "Skipping empty file " + filepath);
      }

    });
    if (hadErrors) {
      return false;
    }
    grunt.log.writeln( "Lint free files: " + files.length );
  });

  grunt.registerMultiTask( "cssmin", "Minify CSS files with Sqwish.", function() {
    var max = grunt.helper( "concat", grunt.file.expandFiles( this.file.src ) );
    var min = require( "sqwish" ).minify( max, false );
    grunt.file.write( this.file.dest, min );
    grunt.log.writeln( "File '" + this.file.dest + "' created." );
    grunt.helper( "min_max_info", min, max );
  });

};
