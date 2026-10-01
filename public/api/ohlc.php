<?php
/**
 * Yahoo Finance OHLC proxy for HRAM static site (Natro PHP).
 * GET /api/ohlc.php?yahoo=GOOGL&interval=1m&range=1d
 * GET /api/ohlc.php?symbol=BTCUSD&yahoo=BTC-USD&interval=5m&range=5d
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('Access-Control-Allow-Origin: *');

function yahoo_ticker_from_symbol(string $symbol): string {
  $s = strtoupper(trim($symbol));
  static $map = [
    'BTCUSD' => 'BTC-USD', 'ETHUSD' => 'ETH-USD', 'SOLUSD' => 'SOL-USD',
    'XRPUSD' => 'XRP-USD', 'BNBUSD' => 'BNB-USD', 'ADAUSD' => 'ADA-USD',
    'DOGEUSD' => 'DOGE-USD', 'AVAXUSD' => 'AVAX-USD', 'DOTUSD' => 'DOT-USD',
    'LINKUSD' => 'LINK-USD', 'MATICUSD' => 'MATIC-USD', 'LTCUSD' => 'LTC-USD',
    'TRXUSD' => 'TRX-USD', 'BCHUSD' => 'BCH-USD', 'XLMUSD' => 'XLM-USD',
    'ATOMUSD' => 'ATOM-USD', 'UNIUSD' => 'UNI-USD', 'NEARUSD' => 'NEAR-USD',
    'APTUSD' => 'APT-USD', 'ARBUSD' => 'ARB-USD', 'OPUSD' => 'OP-USD',
    'FILUSD' => 'FIL-USD', 'ETCUSD' => 'ETC-USD', 'ICPUSD' => 'ICP-USD',
    'SUIUSD' => 'SUI-USD', 'ALGOUSD' => 'ALGO-USD', 'EOSUSD' => 'EOS-USD',
    'PEPEUSD' => 'PEPE-USD', 'SHIBUSD' => 'SHIB-USD', 'INJUSD' => 'INJ-USD',
    'AAVEUSD' => 'AAVE-USD', 'XAUUSD' => 'GC=F', 'XAGUSD' => 'SI=F',
    'USOIL' => 'CL=F', 'UKOIL' => 'BZ=F', 'NATGAS' => 'NG=F',
    'EURUSD' => 'EURUSD=X', 'GBPUSD' => 'GBPUSD=X', 'USDJPY' => 'USDJPY=X',
    'AUDUSD' => 'AUDUSD=X', 'USDCAD' => 'USDCAD=X', 'USDCHF' => 'USDCHF=X',
    'NZDUSD' => 'NZDUSD=X', 'EURGBP' => 'EURGBP=X', 'EURJPY' => 'EURJPY=X',
    'USDTRY' => 'TRY=X', 'EURTRY' => 'EURTRY=X', 'GBPTRY' => 'GBPTRY=X',
  ];
  if (isset($map[$s])) return $map[$s];
  if (preg_match('/^[A-Z0-9]{2,10}USD$/', $s) && !preg_match('/^(USD|EUR|GBP|AUD|NZD|CAD|CHF|JPY)/', $s)) {
    $base = substr($s, 0, -3);
    if (strlen($base) >= 2 && strlen($base) <= 5) return $base . '-USD';
  }
  if (preg_match('/^[A-Z]{6}$/', $s)) return $s . '=X';
  return $s;
}

function map_interval(string $iv): array {
  switch ($iv) {
    case '1':
    case '1m': return ['1m', '1d', 60];
    case '5':
    case '5m': return ['5m', '5d', 300];
    case '15':
    case '15m': return ['15m', '5d', 900];
    case '60':
    case '1h': return ['60m', '1mo', 3600];
    case '240':
    case '4h': return ['60m', '3mo', 14400];
    case 'D':
    case '1d':
    case '1D': return ['1d', '1y', 86400];
    case 'W':
    case '1w': return ['1wk', '5y', 604800];
    default: return ['5m', '5d', 300];
  }
}

$yahooParam = isset($_GET['yahoo']) ? trim((string) $_GET['yahoo']) : '';
$symbol = isset($_GET['symbol']) ? strtoupper(trim((string) $_GET['symbol'])) : '';
$intervalIn = isset($_GET['interval']) ? trim((string) $_GET['interval']) : '5';
if ($symbol === '' && $yahooParam === '') {
  http_response_code(400);
  echo json_encode(['error' => 'symbol or yahoo required']);
  exit;
}
$yahoo = $yahooParam !== '' ? $yahooParam : yahoo_ticker_from_symbol($symbol);
list($yInterval, $range, $step) = map_interval($intervalIn);

$url = 'https://query1.finance.yahoo.com/v8/finance/chart/' . rawurlencode($yahoo)
  . '?interval=' . rawurlencode($yInterval)
  . '&range=' . rawurlencode($range)
  . '&includePrePost=false';

$ch = curl_init($url);
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_CONNECTTIMEOUT => 4,
  CURLOPT_TIMEOUT => 10,
  CURLOPT_HTTPHEADER => [
    'User-Agent: Mozilla/5.0 (compatible; HRAMOhlc/1.0)',
    'Accept: application/json',
  ],
]);
$body = curl_exec($ch);
$code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
if ($body === false || $code >= 400) {
  http_response_code(502);
  echo json_encode(['error' => 'ohlc unavailable', 'yahoo' => $yahoo, 'http' => $code]);
  exit;
}
$json = json_decode($body, true);
$result = $json['chart']['result'][0] ?? null;
if (!$result) {
  http_response_code(502);
  echo json_encode(['error' => 'no chart result', 'yahoo' => $yahoo]);
  exit;
}

$ts = $result['timestamp'] ?? [];
$q = $result['indicators']['quote'][0] ?? [];
$opens = $q['open'] ?? [];
$highs = $q['high'] ?? [];
$lows = $q['low'] ?? [];
$closes = $q['close'] ?? [];
$meta = $result['meta'] ?? [];
$livePrice = (float) ($meta['regularMarketPrice'] ?? 0);

$candles = [];
$bucket = [];
$is4h = ($intervalIn === '240' || $intervalIn === '4h');
$alignStep = $is4h ? 14400 : (($intervalIn === 'D' || $intervalIn === '1D' || $intervalIn === 'W') ? 0 : $step);

for ($i = 0; $i < count($ts); $i++) {
  $o = $opens[$i] ?? null;
  $h = $highs[$i] ?? null;
  $l = $lows[$i] ?? null;
  $c = $closes[$i] ?? null;
  if ($o === null || $h === null || $l === null || $c === null) continue;
  $o = (float) $o; $h = (float) $h; $l = (float) $l; $c = (float) $c;
  if (!is_finite($o) || !is_finite($h) || !is_finite($l) || !is_finite($c)) continue;
  $t = (int) $ts[$i];
  if ($alignStep > 0) $t = (int) (floor($t / $alignStep) * $alignStep);
  if ($is4h || $alignStep > 0) {
    if (!isset($bucket[$t])) {
      $bucket[$t] = ['time' => $t, 'open' => $o, 'high' => $h, 'low' => $l, 'close' => $c];
    } else {
      $bucket[$t]['high'] = max($bucket[$t]['high'], $h);
      $bucket[$t]['low'] = min($bucket[$t]['low'], $l);
      $bucket[$t]['close'] = $c;
    }
  } else {
    $candles[] = ['time' => $t, 'open' => $o, 'high' => $h, 'low' => $l, 'close' => $c];
  }
}
if ($bucket) {
  ksort($bucket);
  $candles = array_values($bucket);
}

echo json_encode([
  'symbol' => $symbol !== '' ? $symbol : $yahoo,
  'yahoo' => $yahoo,
  'interval' => $intervalIn,
  'candles' => $candles,
  'price' => $livePrice > 0 ? $livePrice : null,
  'ts' => (int) round(microtime(true) * 1000),
], JSON_UNESCAPED_UNICODE);
