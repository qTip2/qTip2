/*global module:false*/
module.exports = function(grunt) {
	// Load grunt CSS helper
	grunt.loadNpmTasks('grunt-css');

	// Project configuration.
	grunt.initConfig({
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
		plugins: {
			svg: { js: 'src/svg/svg.js' },
			ajax: { js: 'src/ajax/ajax.js' },
			tips: { js: 'src/tips/tips.js', css: 'src/tips/tips.css' },
			modal: { js: 'src/modal/modal.js', css: 'src/modal/modal.js' },
			viewport: { js: 'src/viewport.js' },
			imagemap: { js: 'src/imagemap/imagemap.js' },
			bgiframe: { js: 'src/bgiframe/bgiframe.js' }
		},
		clean: {
			
		},
		concat: {
			basic: {
				src: [ '<banner:meta.banners.full>', 'src/intro.js', 'src/core.js', 'src/outro.js' ],
				dest: 'dist/basic/jquery.qtip.js'
			},
			basic_css: {
				src: [ '<banner:meta.banners.full>', 'core.css', 'styles.css' ],
				dest: 'dist/basic/jquery.qtip.css'
			},
			dist: {
				// See "set_plugins" task for src
				dest: 'dist/jquery.qtip.js'
			},
			dist_css: {
				// See "set_plugins" task for src
				dest: 'dist/jquery.qtip.css'
			}
		},
		min: {
			basic: {
				src: ['<banner:meta.banners.min>', '<file_strip_banner:dist/basic/jquery.qtip.js:block>'],
				dest: 'dist/basic/jquery.qtip.min.js'
			},
			dist: {
				src: ['<banner:meta.banners.min>', '<file_strip_banner:dist/jquery.qtip.js:block>'],
				dest: 'dist/jquery.qtip.min.js'
			}
		},
		cssmin: {
			basic: {
				src: ['<banner:meta.banners.min>', '<file_strip_banner:dist/basic/jquery.qtip.css:block>'],
				dest: 'dist/basic/jquery.qtip.min.css'
			},
			dist: {
				src: ['<banner:meta.banners.min>', '<file_strip_banner:dist/jquery.qtip.css:block>'],
				dest: 'dist/jquery.qtip.min.css'
			}
		},
		lint: {
			beforeconcat: ['grunt.js', 'src/core.js', 'src/*/*.js']
		},
		csslint: {
			src: {
				src: ['*.css', 'src/**/*.css'],
				rules: {
					ids: false,
					important: false,
					'empty-rules': false,
					'star-property-hack': false,
					'universal-selector': false
				}
			}
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

	// Set extras and extras_css "src" based on defined plugins
	grunt.registerTask('init', 'Default build', function() {
		if(grunt.config('concat.dist.src')) { return; } // Only do it once

		var plugins = (grunt.option('plugins') || 'ajax viewport tips modal imagemap svg bgiframe').split(' '),
			js = ['<banner:meta.banners.full>', 'src/intro.js', 'src/core.js'],
			css = ['<banner:meta.banners.full>', 'src/core.css', 'src/extra.css'];

		// Console out
		grunt.log.write("\nBuilding qTip2 with plugins: " + plugins.join(' ') + "\n");

		// Setup include strings
		plugins.forEach(function(plugin) {
			js.push('src/'+plugin+'/'+plugin+'.js');
			css.push('src/'+plugin+'/'+plugin+'.css');
		});

		// Update config
		grunt.config.set('concat.dist.src', js.concat(['src/outro.js']));
		grunt.config.set('concat.dist_css.src', css);

		// Clean up dist folder
		grunt.helper.clean('dist/');
	});

	// Setup all other tasks
	grunt.registerTask('css', 'init csslint concat:dist_css cssmin:dist');
	grunt.registerTask('full', 'init lint csslint concat:dist concat:dist_css min:dist cssmin:dist');
	grunt.registerTask('basic', 'init lint csslint concat:basic concat:basic_css min:basic cssmin:basic');
	grunt.registerTask('default', 'full');
	grunt.registerTask('dev', 'basic full');
};
