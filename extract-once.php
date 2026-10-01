<?php
// One-shot: join part-* → zip, extract to docroot, preserve _hram_backup_* dirs. Self-deletes.
$dir = __DIR__;
$zipPath = $dir . '/investor-hram-root.zip';
$parts = glob($dir . '/part-*');
if ($parts && count($parts) > 0) {
  natcasesort($parts);
  $out = fopen($zipPath, 'wb');
  if (!$out) { http_response_code(500); echo 'cannot write zip'; exit; }
  foreach ($parts as $p) {
    $in = fopen($p, 'rb');
    if (!$in) { fclose($out); http_response_code(500); echo 'part open fail'; exit; }
    stream_copy_to_stream($in, $out);
    fclose($in);
  }
  fclose($out);
  foreach ($parts as $p) { @unlink($p); }
}
if (!file_exists($zipPath)) { http_response_code(500); echo 'missing zip'; exit; }
$z = new ZipArchive();
if ($z->open($zipPath) !== true) { http_response_code(500); echo 'open fail'; exit; }
$z->extractTo($dir);
$z->close();
@unlink($zipPath);
@unlink(__FILE__);
echo 'OK extracted';
