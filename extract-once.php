<?php
// One-shot unzip for Natro deploy. Preserves _hram_backup_* dirs. Deletes self + zip after.
$zip = __DIR__ . '/investor-hram-root.zip';
if (!file_exists($zip)) { http_response_code(500); echo 'missing zip'; exit; }
$z = new ZipArchive();
if ($z->open($zip) !== true) { http_response_code(500); echo 'open fail'; exit; }
$z->extractTo(__DIR__);
$z->close();
@unlink($zip);
@unlink(__FILE__);
echo 'OK extracted';
