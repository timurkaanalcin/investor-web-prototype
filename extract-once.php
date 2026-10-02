<?php
// One-shot: join part-* → zip, backup key live files, extract to docroot.
// Preserves existing _hram_backup_* dirs. Self-deletes zip + this script.
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

// Backup current landing + htaccess before overwrite
$stamp = date('Ymd_His');
$bak = $dir . '/_hram_backup_' . $stamp;
@mkdir($bak, 0755, true);
$toBak = ['index.html', 'index.txt', '.htaccess', '404.html'];
foreach ($toBak as $f) {
  $src = $dir . '/' . $f;
  if (is_file($src)) {
    @copy($src, $bak . '/' . $f);
  }
}
// Also snapshot a few landing-related next data files if present
foreach (glob($dir . '/__next.*') ?: [] as $g) {
  @copy($g, $bak . '/' . basename($g));
}

$z = new ZipArchive();
if ($z->open($zipPath) !== true) { http_response_code(500); echo 'open fail'; exit; }
$z->extractTo($dir);
$z->close();
@unlink($zipPath);
@unlink(__FILE__);
echo 'OK extracted backup=' . basename($bak);
