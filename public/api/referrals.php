<?php
/**
 * HRAM referral codes — shared JSON store for admin + kayit across devices.
 * Data file: referral-codes.json beside this script. Mutations gated by PIN.
 */
declare(strict_types=1);

error_reporting(0);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');

$ALLOW_ORIGINS = [
    'https://hram.tr',
    'https://www.hram.tr',
    'http://crm.hram.tr',
    'https://crm.hram.tr',
    'http://localhost',
    'http://localhost:3000',
    'http://127.0.0.1',
    'http://127.0.0.1:3000',
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? (string) $_SERVER['HTTP_ORIGIN'] : '';
if ($origin !== '' && in_array($origin, $ALLOW_ORIGINS, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Credentials: true');
} elseif ($origin !== '' && (
    strpos($origin, 'http://localhost') === 0 ||
    strpos($origin, 'http://127.0.0.1') === 0
)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-HRAM-PIN');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/hram-secret.php';

const DATA_FILE = __DIR__ . '/referral-codes.json';

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function normalize_code(string $raw): string
{
    return strtoupper(trim($raw));
}

function default_seed(): array
{
    return [[
        'code' => 'HRAM2026',
        'label' => 'Varsayılan',
        'active' => true,
        'createdAt' => '2026-01-01T00:00:00.000Z',
        'useCount' => 0,
    ]];
}

function sanitize_codes($raw): array
{
    if (!is_array($raw)) {
        return [];
    }
    $out = [];
    foreach ($raw as $c) {
        if (!is_array($c) || !isset($c['code']) || !is_string($c['code'])) {
            continue;
        }
        $code = normalize_code($c['code']);
        if ($code === '') {
            continue;
        }
        $out[] = [
            'code' => $code,
            'label' => (isset($c['label']) && is_string($c['label']) && $c['label'] !== '')
                ? $c['label']
                : null,
            'active' => !empty($c['active']),
            'createdAt' => (isset($c['createdAt']) && is_string($c['createdAt']))
                ? $c['createdAt']
                : gmdate('c'),
            'useCount' => (isset($c['useCount']) && is_numeric($c['useCount']))
                ? (int) $c['useCount']
                : 0,
        ];
    }
    return $out;
}

function read_codes(): array
{
    if (!is_file(DATA_FILE)) {
        $seed = default_seed();
        write_codes($seed);
        return $seed;
    }
    $raw = @file_get_contents(DATA_FILE);
    if ($raw === false || $raw === '') {
        $seed = default_seed();
        write_codes($seed);
        return $seed;
    }
    $parsed = json_decode($raw, true);
    $codes = sanitize_codes($parsed);
    if (count($codes) === 0) {
        $seed = default_seed();
        write_codes($seed);
        return $seed;
    }
    return $codes;
}

function write_codes(array $codes): bool
{
    $json = json_encode(array_values($codes), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json === false) {
        return false;
    }
    $tmp = DATA_FILE . '.' . bin2hex(random_bytes(4)) . '.tmp';
    if (@file_put_contents($tmp, $json . "\n", LOCK_EX) === false) {
        @unlink($tmp);
        return false;
    }
    if (!@rename($tmp, DATA_FILE)) {
        @unlink($tmp);
        return false;
    }
    return true;
}

function require_pin(?array $body): void
{
    $headerPin = isset($_SERVER['HTTP_X_HRAM_PIN']) ? (string) $_SERVER['HTTP_X_HRAM_PIN'] : '';
    $bodyPin = (is_array($body) && isset($body['pin'])) ? (string) $body['pin'] : '';
    $pin = $headerPin !== '' ? $headerPin : $bodyPin;
    if (!hram_pin_ok($pin)) {
        respond(403, ['ok' => false, 'error' => 'PIN gerekli veya hatalı.']);
    }
}

/** Public: validate a single code without listing the store. */
function public_validate_code(string $raw): void
{
    $code = normalize_code($raw);
    if ($code === '') {
        respond(400, ['ok' => false, 'error' => 'Kod gerekli.']);
    }
    foreach (read_codes() as $c) {
        if ($c['code'] === $code && !empty($c['active'])) {
            respond(200, ['ok' => true, 'valid' => true, 'code' => $code]);
        }
    }
    respond(200, ['ok' => true, 'valid' => false, 'code' => $code]);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $action = isset($_GET['action']) ? (string) $_GET['action'] : '';
    if ($action === 'validate' && isset($_GET['code'])) {
        public_validate_code((string) $_GET['code']);
    }
    // Full list requires PIN (header or ?pin=)
    $pin = isset($_SERVER['HTTP_X_HRAM_PIN']) ? (string) $_SERVER['HTTP_X_HRAM_PIN'] : '';
    if ($pin === '' && isset($_GET['pin'])) $pin = (string) $_GET['pin'];
    if (!hram_pin_ok($pin)) {
        respond(403, ['ok' => false, 'error' => 'Liste için PIN gerekli.']);
    }
    respond(200, ['ok' => true, 'codes' => read_codes()]);
}

if ($method !== 'POST') {
    respond(405, ['ok' => false, 'error' => 'Method not allowed']);
}

$rawBody = file_get_contents('php://input');
$body = json_decode($rawBody !== false ? $rawBody : '', true);
if (!is_array($body)) {
    $body = [];
}

$action = isset($body['action']) && is_string($body['action']) ? $body['action'] : '';

// Public validate / soft-increment for registration (no PIN, no list dump)
if ($action === 'validate') {
    public_validate_code(isset($body['code']) ? (string)$body['code'] : '');
}
if ($action === 'increment') {
    // Allow increment without PIN only for active codes (anti-enum: same 404)
    $code = normalize_code(isset($body['code']) ? (string) $body['code'] : '');
    if ($code === '') {
        respond(400, ['ok' => false, 'error' => 'Kod gerekli.']);
    }
    $list = read_codes();
    $found = false;
    foreach ($list as &$c) {
        if ($c['code'] === $code && !empty($c['active'])) {
            $c['useCount'] = (int) $c['useCount'] + 1;
            $found = true;
            break;
        }
    }
    unset($c);
    if (!$found) {
        respond(404, ['ok' => false, 'error' => 'Kod bulunamadı veya pasif.']);
    }
    if (!write_codes($list)) {
        respond(500, ['ok' => false, 'error' => 'Yazılamadı.']);
    }
    respond(200, ['ok' => true]);
}

require_pin($body);

if ($action === 'list') {
    respond(200, ['ok' => true, 'codes' => read_codes()]);
}

if ($action === 'add') {
    $code = normalize_code(isset($body['code']) ? (string) $body['code'] : '');
    if ($code === '') {
        respond(400, ['ok' => false, 'error' => 'Kod gerekli.']);
    }
    if (!preg_match('/^[A-Z0-9_-]{3,32}$/', $code)) {
        respond(400, ['ok' => false, 'error' => 'Kod 3–32 karakter; harf, rakam, _ veya - olmalı.']);
    }
    $list = read_codes();
    foreach ($list as $c) {
        if ($c['code'] === $code) {
            respond(400, ['ok' => false, 'error' => 'Bu kod zaten var.']);
        }
    }
    $label = isset($body['label']) && is_string($body['label']) ? trim($body['label']) : '';
    $entry = [
        'code' => $code,
        'label' => $label !== '' ? $label : null,
        'active' => true,
        'createdAt' => gmdate('c'),
        'useCount' => 0,
    ];
    array_unshift($list, $entry);
    if (!write_codes($list)) {
        respond(500, ['ok' => false, 'error' => 'Yazılamadı.']);
    }
    respond(200, ['ok' => true, 'code' => $entry, 'codes' => $list]);
}

if ($action === 'setActive') {
    $code = normalize_code(isset($body['code']) ? (string) $body['code'] : '');
    if ($code === '') {
        respond(400, ['ok' => false, 'error' => 'Kod gerekli.']);
    }
    $active = !empty($body['active']);
    $list = read_codes();
    $found = false;
    foreach ($list as &$c) {
        if ($c['code'] === $code) {
            $c['active'] = $active;
            $found = true;
            break;
        }
    }
    unset($c);
    if (!$found) {
        respond(404, ['ok' => false, 'error' => 'Kod bulunamadı.']);
    }
    if (!write_codes($list)) {
        respond(500, ['ok' => false, 'error' => 'Yazılamadı.']);
    }
    respond(200, ['ok' => true, 'codes' => $list]);
}

if ($action === 'delete') {
    $code = normalize_code(isset($body['code']) ? (string) $body['code'] : '');
    if ($code === '') {
        respond(400, ['ok' => false, 'error' => 'Kod gerekli.']);
    }
    $list = read_codes();
    $next = [];
    $found = false;
    foreach ($list as $c) {
        if ($c['code'] === $code) {
            $found = true;
            continue;
        }
        $next[] = $c;
    }
    if (!$found) {
        respond(404, ['ok' => false, 'error' => 'Kod bulunamadı.']);
    }
    if (!write_codes($next)) {
        respond(500, ['ok' => false, 'error' => 'Yazılamadı.']);
    }
    respond(200, ['ok' => true, 'codes' => $next]);
}

if ($action === 'increment') {
    $code = normalize_code(isset($body['code']) ? (string) $body['code'] : '');
    if ($code === '') {
        respond(400, ['ok' => false, 'error' => 'Kod gerekli.']);
    }
    $list = read_codes();
    $found = false;
    foreach ($list as &$c) {
        if ($c['code'] === $code && !empty($c['active'])) {
            $c['useCount'] = (int) $c['useCount'] + 1;
            $found = true;
            break;
        }
    }
    unset($c);
    if (!$found) {
        respond(404, ['ok' => false, 'error' => 'Kod bulunamadı veya pasif.']);
    }
    if (!write_codes($list)) {
        respond(500, ['ok' => false, 'error' => 'Yazılamadı.']);
    }
    respond(200, ['ok' => true, 'codes' => $list]);
}

respond(400, ['ok' => false, 'error' => 'Geçersiz action.']);
