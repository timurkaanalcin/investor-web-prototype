<?php
$zip = __DIR__ . '/crm-hram-root.zip';
if (!file_exists($zip)) { http_response_code(500); echo 'missing zip'; exit; }
$z = new ZipArchive();
if ($z->open($zip) !== true) { http_response_code(500); echo 'open fail'; exit; }
$z->extractTo(__DIR__);
$z->close();
@unlink($zip);
@unlink(__FILE__);
echo 'OK crm extracted';
