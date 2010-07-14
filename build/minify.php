#!/usr/bin/php -q
<?php

// Grab file names
if ($argc >= 3) {
	$src = $argv[1];
	$out = $argv[2];
} else {
	echo 'you must specify  a source file and a result filename',"\n";
	echo 'example :', "\n", 'php example-file.php myScript-src.js myPackedScript.js',"\n";
	return;
}

require 'class.packer.php';

$script = file_get_contents($src);

$t1 = microtime(true);

$packer = new JavaScriptPacker($script, 'Normal', true, false);
$packed = $packer->pack();

$t2 = microtime(true);
$time = sprintf('%.4f', ($t2 - $t1) );
echo 'script ', $src, ' packed in ' , $out, ', in ', $time, ' s.', "\n";

file_put_contents($out, $packed, FILE_APPEND);
?>
