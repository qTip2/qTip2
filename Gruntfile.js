/*global module:false*/
module.exports = function(grunt) {
	// Load grunt helpers
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-csslint');
	grunt.loadNpmTasks('grunt-replace');

	// Project configuration.
	grunt.initConfig({
		// Package properties
		pkg: grunt.file.readJSON('package.json'),

		// So meta...
		meta: {
			banners: {
				full: '/*\n * <%= pkg.title || pkg.name %> - @@vVERSION\n' +
					' * <%=pkg.homepage%>\n' +
					' *\n' + 
					' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n' +
					' * Released under the <%= _.pluck(pkg.licenses, "type").join(", ") %> licenses\n' + 
					' * http://jquery.org/license\n' + 
					' *\n' + 
					' * Date: <%= grunt.template.today("ddd mmm d yyyy hh:MM Zo", true) %>\n' + 
					'@@BUILDPROPS */\n',

				uglify:'/* <%= pkg.name %> @@vVERSION @@PLUGINS | <%= pkg.homepage.replace("http://","") %> | '+
					'Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> | <%=grunt.template.today() %> */\n',

				cssmin:'/* <%= pkg.name %> @@vVERSION @@STYLES | <%= pkg.homepage.replace("http://","") %> | '+
					'Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> | <%=grunt.template.today() %> */'
			}
		},

		// Directories (dist changed in init())
		dirs: { src: 'src', dist: 'dist', libs: 'libs' },

		// Core files in order
		core: {
			js: [
				'<%=dirs.src%>/core/intro.js',
				'<%=dirs.src%>/core/constants.js',
				'<%=dirs.src%>/core/class.js',

				'<%=dirs.src%>/core/options.js',
				'<%=dirs.src%>/core/content.js',
				'<%=dirs.src%>/core/position.js',
				'<%=dirs.src%>/core/toggle.js',
				'<%=dirs.src%>/core/focus.js',
				'<%=dirs.src%>/core/disable.js',
				'<%=dirs.src%>/core/button.js',
				'<%=dirs.src%>/core/style.js',
				'<%=dirs.src%>/core/events.js',

				'<%=dirs.src%>/core/jquery_methods.js',
				'<%=dirs.src%>/core/jquery_overrides.js',

				'<%=dirs.src%>/core/defaults.js'
			],
			css: ['<%=dirs.src%>/core.css']
		},

		// Styles and plugins map
		styles: {
			basic: '<%=dirs.src%>/basic.css',
			css3: '<%=dirs.src%>/css3.css'
		},
		plugins: {
			tips: { js: '<%=dirs.src%>/tips/tips.js', css: '<%=dirs.src%>/tips/tips.css' },
			modal: { js: '<%=dirs.src%>/modal/modal.js', css: '<%=dirs.src%>/modal/modal.css' },
			viewport: { js: '<%=dirs.src%>/position/viewport.js' },
			svg: { js: [ '<%=dirs.src%>/position/polys.js', '<%=dirs.src%>/position/svg.js' ] },
			imagemap: { js: [ '<%=dirs.src%>/position/polys.js', '<%=dirs.src%>/position/imagemap.js' ] },
			ie6: { js: '<%=dirs.src%>/ie6/ie6.js', css: '<%=dirs.src%>/ie6/ie6.css' }
		},

		// Clean dist/ folder
		clean: ['<%=dirs.dist%>/*.*', '<%=dirs.dist%>/basic/*.*'],

		// Concatenation
		concat: {
			options: {
				stripBanners: true,
				separator: ';',
				banner: '<%=meta.banners.full%>'
			},
			dist: {
				// See "init" task for src
				dest: '<%=dirs.dist%>/jquery.qtip.js'
			},
			css: {
				// See "init" task for src
				options: { separator: '\n\n' },
				dest: '<%=dirs.dist%>/jquery.qtip.css'
			},
			libs: {
				options: {
					stripBanners: false,
					separator: '\n\n',
					banner: ''
				},
				files: {
					'<%=dirs.dist%>/jquery.qtip.js': [
						'<%=dirs.dist%>/jquery.qtip.js'
					],
					'<%=dirs.dist%>/jquery.qtip.min.js': [
						'<%=dirs.dist%>/jquery.qtip.min.js'
					]
				}
			}
		},

		// Minification
		uglify: {
			options: {
				preserveComments: 'some',
				banner: '<%=meta.banners.uglify%>',
				sourceMap: function(file) {
					return file.indexOf('imagesloaded') < 0 ? file.replace('.js', '.map') : null;
				},
				sourceMappingURL: function(file) {
					file = file.replace('dist/', '').replace('.js', '.map');

					return grunt.config('pkg.type') === 'stable' ? 
						grunt.config.process('http://cdnjs.cloudflare.com/ajax/libs/qtip2/<%=pkg.version%>/') + file : 
						'http://qtip2.com/v/nightly/' + file;
				}
			},
			dist: {
				files: {
					'<%=dirs.dist%>/jquery.qtip.min.js': ['<%=dirs.dist%>/jquery.qtip.js'],
					'<%=dirs.dist%>/imagesloaded.min.js': ['<%=dirs.libs%>/imagesloaded/imagesloaded.js']
				}
			}
		},
		cssmin: {
			options: {
				keepSpecialComments: 0,
				banner: '<%=meta.banners.cssmin%>'
			},
			dist: {
				files: {
					'<%=dirs.dist%>/jquery.qtip.min.css': '<%=dirs.dist%>/jquery.qtip.css'
				}
			}
		},

		replace: {
			dist: {
				files: [
					 { expand: true, flatten: true, src: ['<%=dirs.dist%>/**/*'], dest: '<%=dirs.dist%>/' }
				]
			}
		},

		// Linting
		csslint: {
			options: {
				'empty-rules': false,
				important: false,
				ids: false
			},
			strict: {
				src: ['<%=dirs.src%>/**/*.css']
			}
		},
		jshint: {
			options: {
				strict: false,
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
				undef: true,
				expr: true,
				globals: {
					console: true, jQuery: true, '$': true, QTip: true, TRUE: true, FALSE: true, NULL: true, 
					WIDTH: true, HEIGHT: true, TOP: true, LEFT: true, BOTTOM: true, RIGHT: true, X: true, Y: true,
					CENTER: true, FLIP: true, FLIPINVERT: true, SHIFT: true, QTIP: true,  PROTOTYPE: true, 
					CORNER: true,  CHECKS: true, PLUGINS: true, NAMESPACE: true, ATTR_HAS: true, ATTR_ID: true, 
					WIDGET: true, SELECTOR: true, INACTIVE_EVENTS: true, CLASS_FIXED: true, CLASS_DEFAULT: true, 
					CLASS_FOCUS: true, CLASS_HOVER: true, CLASS_DISABLED: true, replaceSuffix: true, oldtitle: true, 
					trackingBound: true, BROWSER: true, createWidgetClass: true, sanitizeOptions: true, cloneEvent: true,

				}
			},
			beforeconcat: [
				'grunt.js', '<%=dirs.src%>/*/*.js',
				'!<%=dirs.src%>/*/intro.js', '!<%=dirs.src%>/*/outro.js' // Ignore intro/outro files
			]
		}
	});

	// Parse command line options
	grunt.registerTask('init', 'Initialise build configuration.', function(basic) {
		// Grab command-line options, using valid defaults if not given
		var done = this.async(),
			stable = grunt.option('stable') === true,
			plugins = (grunt.option('plugins') || Object.keys( grunt.config('plugins')).join(' ')).replace(/ /g, ' ').split(' '),
			styles = (grunt.option('styles') || Object.keys( grunt.config('styles')).join(' ')).replace(/ /g, ' ').split(' '),
			valid, lib;

		// Ensure all git modules are checked out
		String(grunt.file.read('.gitmodules')).match(/\[submodule "libs\/[^\"]+"\]/g).forEach(function(lib) {
			if(!grunt.file.exists( lib.replace(/\[submodule "([^\"]+)"\]/g, '$1') ) ) {
				throw new Error('Can\'t locate all libs/ dependancies... please run "git module init" then "git module update"');
			}
		});

		// Setup JS/CSS arrays
		var js = grunt.config('core.js'),
			css = grunt.config('core.css'),
			dist = grunt.option('dist') || 'dist';

		// If basic... go into dist/basic
		if(basic) { dist += '/basic'; }

		// Parse 'dist' option (decides which directory to build into)
		grunt.config('dirs.dist', dist);

		// Parse 'styles' option (decides which stylesheets are included)
		if(!basic && grunt.option('styles') !== 0) {
			styles.forEach(function(style, i) {
				if( (valid = grunt.config('styles.'+style)) ) {
					css.push(valid);
				}
				else { styles[i] = style+('*'.red); }
			});
		}
		else { styles = ['None']; }

		// Parse 'plugins' option (decides which plugins are included)
		if(!basic && grunt.option('plugins') !== 0) {
			plugins.forEach(function(plugin, i) {
				if( (valid = grunt.config('plugins.'+plugin)) ) {
					if(valid.js) { js.push(valid.js); }
					if(valid.css) { css.push(valid.css); }
				}
				else { plugins[i] = plugin+('*'.red); }
			});
		}
		else { plugins = ['None']; }

		// Add outro
		js.push('<%=dirs.src%>/core/outro.js');

		// Update concatenation config
		grunt.config('concat.dist.src', js);
		grunt.config('concat.css.src', css);

		// Setup in-file text replacements (version, date etc)
		grunt.util.spawn({ cmd: 'git', args: ['describe'] }, function(err, data) {
			// Ensure it succeed
			if(data.code > 1) {
				grunt.log.write('Uhoh... couldn\'t grab Git repository description. Somethings up!');
				return done();
			}

			// Determine version
			var version = stable ?
				grunt.config('pkg.version') :
				grunt.config('pkg.version', data.stdout.substr(0,10) );

			// Set version type config
			grunt.config('pkg.type', stable ? 'stable' : 'nightly');
			
			// Setup styles and plugins replacements arrays
			var strStyles = styles.length ? styles.join(' ') : '';
				strPlugins = plugins.length ? plugins.join(' ') : '';

			// Setup build properties
			var buildprops = (plugins.length ? ' * Plugins: '+strPlugins+'\n' : '') +
				(styles.length ? ' * Styles: '+strStyles+'\n' : '');

			// Setup minification build properties
			var minbuildprops = plugins[0] !== 'None' || styles[0] !== 'None' ? 
				'(includes: ' + 
					(plugins[0] !== 'None' ? strPlugins : '') + 
					(styles[0] !== 'None' ? ' / ' + strStyles : '') + ') '
				: '';

			// Set replacement variables
			grunt.config('replace.dist.options.variables', {
				'BUILDPROPS': buildprops,
				'MINBUILDPROPS': minbuildprops,
				'VERSION': stable ? version : version.substr(1),
				'vVERSION': stable ? 'v'+version : version,
				'DATE': grunt.template.today("dd-mm-yyyy"),
				'STYLES': strStyles,
				'PLUGINS': strPlugins
			});

			// Output current build properties
			grunt.log.write("\nBuilding " + "qTip2".green + " "+version+" with " +
				"plugins " + plugins.join(' ').green + " and " +
				"styles "  +styles.join(' ').green + "\n"
			);

			// Async task done
			done(version);
		});
	});

	var defaultTasks = ['concat:dist', 'concat:css', 'uglify', 'cssmin', 'concat:libs', 'replace'];

	// Setup tasks
	grunt.registerTask('basic', ['init:basic', 'clean'].concat(defaultTasks));
	grunt.registerTask('default', ['init', 'clean'].concat(defaultTasks));
	grunt.registerTask('dev', ['init', 'clean', 'jshint', 'csslint'].concat(defaultTasks));
	grunt.registerTask('css', ['init', 'clean', 'csslint', 'concat:css', 'cssmin', 'replace']);
	grunt.registerTask('all', ['init', 'clean'].concat(defaultTasks).concat(['init:basic']).concat(defaultTasks));
};
