/*global module:false*/
module.exports = function(grunt) {
	// Load grunt helpers
	grunt.loadNpmTasks('grunt-contrib');

	// Project configuration.
	grunt.initConfig({
		// Meta properties
		pkg: '<json:qtip2.jquery.json>',
		meta: {
			banners: {
				full: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
					'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
					'<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
					'* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
					' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */',

				min:'/*! <%= pkg.name %> v<%= pkg.version %> | <%= pkg.homepage %> | '+
					'Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
			}
		},

		// Directories
		dirs: { src: 'src', dist: 'dist' },

		// Styles and plugins map
		styles: {
			basic: '<%=dirs.src%>/basic.css',
			css3: '<%=dirs.src%>/css3.css'
		},
		plugins: {
			svg: { js: '<%=dirs.src%>/svg/svg.js' },
			ajax: { js: '<%=dirs.src%>/ajax/ajax.js' },
			tips: { js: '<%=dirs.src%>/tips/tips.js', css: '<%=dirs.src%>/tips/tips.css' },
			modal: { js: '<%=dirs.src%>/modal/modal.js', css: '<%=dirs.src%>/modal/modal.css' },
			viewport: { js: '<%=dirs.src%>/viewport/viewport.js' },
			imagemap: { js: '<%=dirs.src%>/imagemap/imagemap.js' },
			bgiframe: { js: '<%=dirs.src%>/bgiframe/bgiframe.js' }
		},

		// Actual tasks
		clean: {
			dist: 'dist/**/*' // Changed by the 'dist' command-line option (see "init" task)
		},
		concat: {
			basic: {
				src: [
					'<banner:meta.banners.full>', '<%=dirs.src%>/intro.js',
					'<%=dirs.src%>/core.js', '<%=dirs.src%>/outro.js'
				],
				dest: '<%=dirs.dist%>/basic/jquery.qtip.js'
			},
			basic_css: {
				src: [ '<banner:meta.banners.full>', '<%=dirs.src%>/core.css', '<%=styles.basic%>' ],
				dest: '<%=dirs.dist%>/basic/jquery.qtip.css'
			},
			dist: {
				// See "init" task for src
				dest: '<%=dirs.dist%>/jquery.qtip.js'
			},
			dist_css: {
				// See "init" task for src
				dest: '<%=dirs.dist%>/jquery.qtip.css'
			}
		},
		min: {
			basic: {
				src: ['<banner:meta.banners.min>', '<file_strip_banner:<%=dirs.dist%>/basic/jquery.qtip.js:block>'],
				dest: '<%=dirs.dist%>/basic/jquery.qtip.min.js'
			},
			dist: {
				src: ['<banner:meta.banners.min>', '<file_strip_banner:<%=dirs.dist%>/jquery.qtip.js:block>'],
				dest: '<%=dirs.dist%>/jquery.qtip.min.js'
			}
		},
		mincss: {
			basic: {
				files: {
					'<%=dirs.dist%>/basic/jquery.qtip.min.css': [
						'<banner:meta.banners.min>', '<file_strip_banner:<%=dirs.dist%>/basic/jquery.qtip.css:block>'
					]
				}
			},
			dist: {
				files: {
					'<%=dirs.dist%>/jquery.qtip.min.css': [
						'<banner:meta.banners.min>', '<file_strip_banner:<%=dirs.dist%>/jquery.qtip.css:block>'
					]
				}
			}
		},
		lint: {
			beforeconcat: ['grunt.js', '<%=dirs.src%>/core.js', '<%=dirs.src%>/*/*.js']
		},
		watch: {
			files: '<config:lint.beforeconcat.files>',
			tasks: 'lint'
		},
		jshint: {
			options: {
				curly: true,
				eqeqeq: true,
				immed: true,
				latedef: true,
				newcap: true,
				noarg: true,
				sub: true,
				boss: true,
				eqnull: true,
				browser: true,
				undef: false
			},
			globals: {
				jQuery: true,
				'$': true
			}
		},
		uglify: {}
	});

	// Parse command line options
	grunt.registerTask('init', 'Default build', function() {
		if(grunt.config('concat.dist.src')) { return; } // Only do it once

		// Grab command-line options, using valid defaults if not given
		var plugins = (grunt.option('plugins') || Object.keys( grunt.config('plugins')).join(' ')).replace(/ /g, ' ').split(' '),
			styles = (grunt.option('styles') || Object.keys( grunt.config('styles')).join(' ')).replace(/ /g, ' ').split(' '),
			valid;

		// Setup JS/CSS arrays
		var js = ['<banner:meta.banners.full>', '<%=dirs.src%>/intro.js', '<%=dirs.src%>/core.js'],
			css = ['<banner:meta.banners.full>', '<%=dirs.src%>/core.css'],
			dist = grunt.option('dist');

		// Parse 'styles' option (decides which stylesheets are included)
		if(grunt.option('styles') !== 0) {
			styles.forEach(function(style, i) {
				if( (valid = grunt.config('styles.'+style)) ) {
					css.push(valid);
				}
				else { styles[i] = style+('*'.red); }
			});
		}
		else { styles = ['None']; }

		// Parse 'plugins' option (decides which plugins are included)
		if(grunt.option('plugins') !== 0) {
			plugins.forEach(function(plugin, i) {
				if( (valid = grunt.config('plugins.'+plugin)) ) {
					if(valid.js) { js.push(valid.js); }
					if(valid.css) { css.push(valid.css); }
				}
				else { plugins[i] = plugin+('*'.red); }
			});
		}
		else { plugins = ['None']; }

		// Update config
		grunt.config('concat.dist.src', js.concat(['<%=dirs.src%>/outro.js']));
		grunt.config('concat.dist_css.src', css);

		// Parse 'dist' option (decides which directory to build into)
		if(dist) {
			grunt.config('dirs.dist', dist);
			grunt.config('clean.dist', dist + '/**/*');
		}

		// Output current build properties
		grunt.log.write("\nBuilding " + "qTip2".green + " with " +
			"plugins " + plugins.join(' ').green + " and " +
			"styles "  +styles.join(' ').green + "\n"
		);
	});

	// Setup all other tasks
	grunt.registerTask('css', 'init clean concat:dist_css mincss:dist');
	grunt.registerTask('basic', 'init clean lint concat:basic concat:basic_css min:basic mincss:basic');
	grunt.registerTask('default', 'init clean lint concat:dist concat:dist_css min:dist mincss:dist');
	grunt.registerTask('dev', 'init clean lint concat min mincss');
};