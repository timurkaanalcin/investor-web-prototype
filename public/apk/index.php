<?php
$file = dirname(__DIR__) . '/downloads/HRAM.apk';
if (!is_file($file)) {
  http_response_code(404);
  header('Content-Type: text/plain; charset=utf-8');
  echo "APK not found";
  exit;
}
header('Content-Type: application/vnd.android.package-archive');
header('Content-Disposition: attachment; filename="HRAM.apk"');
header('Content-Length: ' . filesize($file));
header('X-Content-Type-Options: nosniff');
readfile($file);
exit;
