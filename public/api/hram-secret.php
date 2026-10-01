<?php
/**
 * Server-only secrets. Do not expose via HTTP (deny below).
 * Override with environment: HRAM_ADMIN_PIN
 */
declare(strict_types=1);

function hram_admin_pin(): string {
  $fromEnv = getenv('HRAM_ADMIN_PIN');
  if (is_string($fromEnv) && $fromEnv !== '') {
    return $fromEnv;
  }
  // Local/ops override file (not committed): api/hram-pin.local.php returning string
  $local = __DIR__ . '/hram-pin.local.php';
  if (is_file($local)) {
    $v = include $local;
    if (is_string($v) && $v !== '') return $v;
  }
  // Fallback — change via env/local file in production
  return '1234';
}

function hram_pin_ok(?string $pin): bool {
  if ($pin === null || $pin === '') return false;
  return hash_equals(hram_admin_pin(), $pin);
}
