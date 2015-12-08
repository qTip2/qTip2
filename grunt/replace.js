module.exports = {
	js: {
		options: {
			patterns: [] // Replacements are set up in `init` task
		},
		files: [{
			expand: true,
			flatten: true,
			src: ['<%=dirs.dist%>/**/*'], dest: '<%=dirs.dist%>/'
		}]
	}
};
