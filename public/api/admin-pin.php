<?php
declare(strict_types=1);
error_reporting(0);
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/hram-secret.php';

$ALLOW = ['https://hram.tr','https://www.hram.tr','https://crm.hram.tr','http://localhost:3000','http://127.0.0.1:3000'];
$origin = isset($_SERVER['HTTP_ORIGIN']) ? (string)$_SERVER['HTTP_ORIGIN'] : '';
if ($origin !== '' && in_array($origin, $ALLOW, true)) {
  header('Access-Control-Allow-Origin: ' . $origin);
  header('Vary: Origin');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-HRAM-PIN');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok'=>false,'error'=>'POST only']);
  exit;
}
$raw = file_get_contents('php://input');
$body = json_decode($raw !== false ? $raw : '', true);
$pin = '';
if (isset($_SERVER['HTTP_X_HRAM_PIN'])) $pin = (string)$_SERVER['HTTP_X_HRAM_PIN'];
if ($pin === '' && is_array($body) && isset($body['pin'])) $pin = (string)$body['pin'];
if (!hram_pin_ok($pin)) {
  http_response_code(403);
  echo json_encode(['ok'=>false,'error'=>'PIN hatalı']);
  exit;
}
// Issue opaque unlock token (HMAC of day+pin) — client stores token, not PIN
$day = gmdate('Y-m-d');
$token = hash_hmac('sha256', 'hram-admin|' . $day, hram_admin_pin());
echo json_encode(['ok'=>true,'token'=>$token,'expiresAt'=>$day.'T23:59:59Z']);
