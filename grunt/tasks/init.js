module.exports = function(grunt) {
	grunt.registerTask('init', 'Initialise build configuration.', function(basic) {
		// Grab command - line options, using valid defaults if not given
		var done = this.async(),
			stable = grunt.option('stable') === true,
			plugins = (grunt.option('plugins') || Object.keys( grunt.config('plugins')).join(' ')).replace(/ /g, ' ').split(' '),
			styles = (grunt.option('styles') || Object.keys( grunt.config('styles')).join(' ')).replace(/ /g, ' ').split(' '),
			valid;

		// Setup JS/CSS arrays
		var js = grunt.config('core.js'),
			css = grunt.config('core.css'),
			dist = grunt.option('dist') || 'dist';

		// Add intro file
		js.unshift(grunt.config('wrappers.js.intro'));

		// If basic... go into dist/basic
		if(basic) { dist += '/basic'; }

		// Parse 'dist' option (decides which directory to build into)
		grunt.config('dirs.dist', dist);

		// Parse 'styles' option (decides which stylesheets are included)
		if(!basic && grunt.option('styles') !== 0) {
			styles.forEach(function(style, i) {
				if(valid = grunt.config('styles.' + style)) {
					css.push(valid);
				}
				else { styles[i] = style + '*'.red; }
			});
			styles.unshift('core');
		}
		else { styles = ['core']; }

		// Parse 'plugins' option (decides which plugins are included)
		if(!basic && grunt.option('plugins') !== 0) {
			plugins.forEach(function(plugin, i) {
				if(valid = grunt.config('plugins.' + plugin)) {
					if(valid.js) { js.push(valid.js); }
					if(valid.css) { css.push(valid.css); }
				}
				else { plugins[i] = plugin + '*'.red; }
			});
		}
		else { plugins = ['None']; }

		// Add outro file
		js.push(grunt.config('wrappers.js.outro'));

		// Update concatenation config
		grunt.config('concat.js.src', js);
		grunt.config('concat.css.src', css);

		// Setup in - file text replacements (version, date etc)
		grunt.util.spawn({ cmd: 'git', args: ['describe', '--tags'] }, function(err, data) {
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
			var strPlugins = plugins.length ? plugins.join(' ') : '';

			// Setup build properties
			var buildprops = (plugins.length ? ' * Plugins: ' + strPlugins + '\n' : '') +
				(styles.length ? ' * Styles: ' + strStyles + '\n' : '');

			// Setup minification build properties
			var minbuildprops = plugins[0] !== 'None' || styles[0] !== 'None' ?
				'(includes: ' +
					(plugins[0] !== 'None' ? strPlugins : '') +
					(styles[0] !== 'None' ? ' / ' + strStyles : '') + ') '
				: '';

			// Set replacement variables
			grunt.config('replace.js.options.patterns', [{
				json: {
					'BUILDPROPS': buildprops,
					'MINBUILDPROPS': minbuildprops,
					'VERSION': stable ? version : version.substr(1),
					'vVERSION': stable ? 'v' + version : version,
					'DATE': grunt.template.today('dd - mm - yyyy'),
					'STYLES': strStyles,
					'PLUGINS': strPlugins
				}
			}]);

			// Output current build properties
			grunt.log.write('\nBuilding ' + 'qTip2'.green + ' ' + version + ' with ' +
				'plugins ' + plugins.join(' ').green + ' and ' +
				'styles '  +styles.join(' ').green + '\n'
			);

			// Async task done
			done(version);
		});
	});
};