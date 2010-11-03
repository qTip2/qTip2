load("build/jslint.js");

var src = readFile("dist/jquery.qtip.js");

JSLINT(src, { evil: true, forin: true, maxerr: 100 });

// All of the following are known issues that we think are 'ok'
// (in contradiction with JSLint) more information here:
// http://docs.jquery.com/JQuery_Core_Style_Guidelines
var ok = {
	"Expected an identifier and instead saw 'undefined' (a reserved word).": true,
	"Expected a conditional expression and instead saw an assignment.": true,
	"Insecure '.'.": true
};

var e = JSLINT.errors, found = 0, w;

for ( var i = 0; i < e.length; i++ ) {
	w = e[i];

	if ( !ok[ w.reason ] ) {
		found++;
		print( "\n" + w.evidence + "\n" );
		print( "    Problem at line " + w.line + " character " + w.character + ": " + w.reason );
	}
}

if ( found > 0 ) {
	print( "\n" + found + " Error(s) found." );

} else {
	print( "JSLint check passed." );
}

<script type="text/javascript">
//<![CDATA[
jQuery('a,area').each(function(i) {
	var href = $(this).attr('href'),
		match = /#LiveTooltip(.+)$/.exec(href);

	if (match.length > 1) {
		$(this).qtip(TooltipClientScripts[ match[1] ]);
	}
});//]]>
</script>