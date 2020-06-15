var path = require('path');
var fs = require('fs');
var browserify = require('browserify');
var outPath = path.join( __dirname, 'npm-and-browserify-pack.js' );
var inPath = path.join( __dirname, 'npm-and-browserify-src.js' );

browserify({
  entries: [ inPath ]
}).bundle().pipe( fs.createWriteStream( outPath ) );
