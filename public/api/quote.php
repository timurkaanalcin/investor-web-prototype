<?php
/**
 * Live market quote proxy for HRAM static site (Natro PHP).
 * Fetches Yahoo Finance chart meta — no API key.
 * GET /api/quote.php?symbol=TRXUSD&yahoo=TRX-USD
 * GET /api/quote.php?symbols=TRXUSD,BTCUSD,EURUSD  (batch, max 24)
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
  // Crypto PATTERN: XXXUSD → XXX-USD
  if (preg_match('/^[A-Z0-9]{2,10}USD$/', $s) && !preg_match('/^(USD|EUR|GBP|AUD|NZD|CAD|CHF|JPY)/', $s)) {
    $base = substr($s, 0, -3);
    if (strlen($base) >= 2 && strlen($base) <= 5) return $base . '-USD';
  }
  // FX 6-letter pairs
  if (preg_match('/^[A-Z]{6}$/', $s)) return $s . '=X';
  // BIST / default equities — caller should pass yahoo= when known
  return $s;
}

function fetch_yahoo_quote(string $yahoo): ?array {
  $url = 'https://query1.finance.yahoo.com/v8/finance/chart/' . rawurlencode($yahoo)
    . '?interval=1d&range=5d&includePrePost=false';
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_CONNECTTIMEOUT => 4,
    CURLOPT_TIMEOUT => 8,
    CURLOPT_HTTPHEADER => [
      'User-Agent: Mozilla/5.0 (compatible; HRAMQuote/1.0)',
      'Accept: application/json',
    ],
  ]);
  $body = curl_exec($ch);
  $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  if ($body === false || $code >= 400) return null;
  $json = json_decode($body, true);
  $result = $json['chart']['result'][0] ?? null;
  if (!$result) return null;
  $meta = $result['meta'] ?? [];
  $price = (float) ($meta['regularMarketPrice'] ?? $meta['chartPreviousClose'] ?? 0);
  $metaPrev = (float) ($meta['chartPreviousClose'] ?? $meta['previousClose'] ?? 0);
  // Prefer previous completed daily bar close (fixes XAUUSD/GC=F meta quirks)
  $qBars = $result['indicators']['quote'][0] ?? [];
  $closes = $qBars['close'] ?? [];
  $priorFromBars = 0.0;
  $sawLast = false;
  for ($i = count($closes) - 1; $i >= 0; $i--) {
    if (!isset($closes[$i]) || $closes[$i] === null) continue;
    $c = (float) $closes[$i];
    if (!is_finite($c) || $c <= 0) continue;
    if (!$sawLast) { $sawLast = true; continue; }
    $priorFromBars = $c;
    break;
  }
  $prev = $priorFromBars > 0 ? $priorFromBars : ($metaPrev > 0 ? $metaPrev : $price);
  if ($priorFromBars > 0 && $metaPrev > 0 && $price > 0) {
    $pctMeta = abs(($price - $metaPrev) / $metaPrev) * 100;
    $pctBar = abs(($price - $priorFromBars) / $priorFromBars) * 100;
    if ($pctMeta > 25 && $pctBar < $pctMeta) $prev = $priorFromBars;
  }
  if (!is_finite($price) || $price <= 0) return null;
  $change = $price - $prev;
  $changePct = $prev ? ($change / $prev) * 100 : 0;
  $dayHigh = isset($meta['regularMarketDayHigh']) ? (float) $meta['regularMarketDayHigh'] : null;
  $dayLow = isset($meta['regularMarketDayLow']) ? (float) $meta['regularMarketDayLow'] : null;
  $dayOpen = isset($meta['regularMarketOpen']) ? (float) $meta['regularMarketOpen'] : null;
  // Fallback O/H/L from last daily bars
  $ts = $result['timestamp'] ?? [];
  $q = $result['indicators']['quote'][0] ?? [];
  if (($dayOpen === null || $dayHigh === null || $dayLow === null) && $ts) {
    $i = count($ts) - 1;
    $dayOpen = $dayOpen ?? (isset($q['open'][$i]) ? (float) $q['open'][$i] : $price);
    $dayHigh = $dayHigh ?? (isset($q['high'][$i]) ? (float) $q['high'][$i] : $price);
    $dayLow = $dayLow ?? (isset($q['low'][$i]) ? (float) $q['low'][$i] : $price);
  }
  return [
    'yahoo' => $yahoo,
    'price' => $price,
    'previousClose' => $prev,
    'change' => $change,
    'changePct' => $changePct,
    'open' => $dayOpen ?? $price,
    'high' => $dayHigh ?? $price,
    'low' => $dayLow ?? $price,
    'close' => $price,
    'ts' => (int) round(microtime(true) * 1000),
  ];
}

$yahooParam = isset($_GET['yahoo']) ? trim((string) $_GET['yahoo']) : '';
$symbol = isset($_GET['symbol']) ? strtoupper(trim((string) $_GET['symbol'])) : '';
$symbolsRaw = isset($_GET['symbols']) ? trim((string) $_GET['symbols']) : '';
$pairsRaw = isset($_GET['pairs']) ? trim((string) $_GET['pairs']) : '';

if ($pairsRaw !== '' || $symbolsRaw !== '') {
  $out = [];
  if ($pairsRaw !== '') {
    $chunks = array_slice(explode(',', $pairsRaw), 0, 24);
    foreach ($chunks as $chunk) {
      $chunk = trim($chunk);
      if ($chunk === '') continue;
      $bits = explode('|', $chunk, 2);
      $sym = strtoupper(trim($bits[0]));
      $y = isset($bits[1]) && trim($bits[1]) !== '' ? trim($bits[1]) : yahoo_ticker_from_symbol($sym);
      $q = fetch_yahoo_quote($y);
      if ($q) {
        $q['symbol'] = $sym;
        $out[] = $q;
      }
    }
  } else {
    $parts = array_values(array_unique(array_filter(array_map(function ($s) {
      return strtoupper(trim($s));
    }, explode(',', $symbolsRaw)))));
    $parts = array_slice($parts, 0, 24);
    foreach ($parts as $sym) {
      $y = yahoo_ticker_from_symbol($sym);
      $q = fetch_yahoo_quote($y);
      if ($q) {
        $q['symbol'] = $sym;
        $out[] = $q;
      }
    }
  }
  echo json_encode(['quotes' => $out, 'ts' => (int) round(microtime(true) * 1000)], JSON_UNESCAPED_UNICODE);
  exit;
}

if ($symbol === '' && $yahooParam === '') {
  http_response_code(400);
  echo json_encode(['error' => 'symbol or yahoo required']);
  exit;
}

$yahoo = $yahooParam !== '' ? $yahooParam : yahoo_ticker_from_symbol($symbol);
$q = fetch_yahoo_quote($yahoo);
if (!$q) {
  http_response_code(502);
  echo json_encode(['error' => 'quote unavailable', 'symbol' => $symbol, 'yahoo' => $yahoo]);
  exit;
}
$q['symbol'] = $symbol !== '' ? $symbol : $yahoo;
echo json_encode($q, JSON_UNESCAPED_UNICODE);
