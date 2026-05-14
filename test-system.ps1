Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SYSTEM TEST - Jasterka Hlohovec" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$BASE = "http://localhost:3000"

# TEST 1: Health Check
Write-Host "=== TEST 1: Health Check ===" -ForegroundColor Green
try {
    $r = Invoke-WebRequest -Uri "$BASE/api/health" -UseBasicParsing
    Write-Host "  Status: $($r.StatusCode)" -ForegroundColor Yellow
    Write-Host "  Response: $($r.Content)" -ForegroundColor White
} catch { Write-Host "  FAILED: $_" -ForegroundColor Red }
Write-Host ""

# TEST 2: Get Menu
Write-Host "=== TEST 2: Get Menu ===" -ForegroundColor Green
try {
    $r = Invoke-WebRequest -Uri "$BASE/api/menu" -UseBasicParsing
    $menu = $r.Content | ConvertFrom-Json
    Write-Host "  Categories: $($menu.Count)" -ForegroundColor Yellow
    if ($menu.Count -gt 0) {
        Write-Host "  First: $($menu[0].name) - Items: $($menu[0].items.Count)" -ForegroundColor White
    }
} catch { Write-Host "  FAILED: $_" -ForegroundColor Red }
Write-Host ""

# TEST 3: Get Settings
Write-Host "=== TEST 3: Get Settings ===" -ForegroundColor Green
try {
    $r = Invoke-WebRequest -Uri "$BASE/api/settings" -UseBasicParsing
    Write-Host "  Response: $($r.Content)" -ForegroundColor White
} catch { Write-Host "  FAILED: $_" -ForegroundColor Red }
Write-Host ""

# TEST 4: Get Daily Menu
Write-Host "=== TEST 4: Get Daily Menu ===" -ForegroundColor Green
try {
    $r = Invoke-WebRequest -Uri "$BASE/api/daily-menu" -UseBasicParsing
    Write-Host "  Response: $($r.Content)" -ForegroundColor White
} catch { Write-Host "  FAILED: $_" -ForegroundColor Red }
Write-Host ""

# TEST 5: Admin Login
Write-Host "=== TEST 5: Admin Login ===" -ForegroundColor Green
try {
    $body = @{password="jasterka2024"} | ConvertTo-Json
    $r = Invoke-WebRequest -Uri "$BASE/api/admin/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "  Status: $($r.StatusCode)" -ForegroundColor Yellow
    Write-Host "  Response: $($r.Content)" -ForegroundColor White
} catch { Write-Host "  FAILED: $_" -ForegroundColor Red }
Write-Host ""

# TEST 6: Create Order (Delivery)
Write-Host "=== TEST 6: Create Order (Delivery) ===" -ForegroundColor Green
try {
    $body = @{
        type="delivery"
        items=@(@{id="item-1.-margerita"; name="1. Margerita"; quantity=2; price=7.20})
        total=14.40
        deliveryFee=2.50
        customerName="Test Customer"
        customerPhone="0900123456"
        deliveryCity="Hlohovec"
        deliveryAddress="Námestie sv. Michala 1"
        customerEmail="test@example.com"
    } | ConvertTo-Json
    $r = Invoke-WebRequest -Uri "$BASE/api/orders" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "  Status: $($r.StatusCode)" -ForegroundColor Yellow
    $order = $r.Content | ConvertFrom-Json
    Write-Host "  Order ID: $($order.id)" -ForegroundColor White
    Write-Host "  Status: $($order.status)" -ForegroundColor White
    Write-Host "  Type: $($order.type)" -ForegroundColor White
    $global:testOrderId = $order.id
} catch { Write-Host "  FAILED: $_" -ForegroundColor Red }
Write-Host ""

# TEST 7: Get Admin Orders
Write-Host "=== TEST 7: Get Admin Orders ===" -ForegroundColor Green
try {
    $r = Invoke-WebRequest -Uri "$BASE/api/admin/orders" -UseBasicParsing
    $orders = $r.Content | ConvertFrom-Json
    Write-Host "  Total orders: $($orders.Count)" -ForegroundColor Yellow
    if ($orders.Count -gt 0) {
        Write-Host "  Latest: $($orders[0].id) - $($orders[0].status)" -ForegroundColor White
    }
} catch { Write-Host "  FAILED: $_" -ForegroundColor Red }
Write-Host ""

# TEST 8: Update Order Status
Write-Host "=== TEST 8: Update Order Status ===" -ForegroundColor Green
try {
    if ($global:testOrderId) {
        $body = @{status="ACCEPTED"} | ConvertTo-Json
        $r = Invoke-WebRequest -Uri "$BASE/api/admin/orders/$($global:testOrderId)/status" -Method PATCH -Body $body -ContentType "application/json" -UseBasicParsing
        Write-Host "  Status: $($r.StatusCode)" -ForegroundColor Yellow
        Write-Host "  Response: $($r.Content)" -ForegroundColor White
    } else {
        Write-Host "  SKIP: No test order ID" -ForegroundColor Gray
    }
} catch { Write-Host "  FAILED: $_" -ForegroundColor Red }
Write-Host ""

# TEST 9: Get Order Status (Client)
Write-Host "=== TEST 9: Get Order Status (Client) ===" -ForegroundColor Green
try {
    if ($global:testOrderId) {
        $r = Invoke-WebRequest -Uri "$BASE/api/orders/$($global:testOrderId)/status" -UseBasicParsing
        Write-Host "  Response: $($r.Content)" -ForegroundColor White
    } else {
        Write-Host "  SKIP: No test order ID" -ForegroundColor Gray
    }
} catch { Write-Host "  FAILED: $_" -ForegroundColor Red }
Write-Host ""

# TEST 10: Create Reservation
Write-Host "=== TEST 10: Create Reservation ===" -ForegroundColor Green
try {
    $body = @{
        name="Test Guest"
        email="guest@test.com"
        phone="0900987654"
        date="2026-05-20T18:00:00"
        guests=4
        note="Test reservation"
    } | ConvertTo-Json
    $r = Invoke-WebRequest -Uri "$BASE/api/reservations" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "  Status: $($r.StatusCode)" -ForegroundColor Yellow
    Write-Host "  Response: $($r.Content)" -ForegroundColor White
} catch { Write-Host "  FAILED: $_" -ForegroundColor Red }
Write-Host ""

# TEST 11: Get Admin Reservations
Write-Host "=== TEST 11: Get Admin Reservations ===" -ForegroundColor Green
try {
    $r = Invoke-WebRequest -Uri "$BASE/api/admin/reservations" -UseBasicParsing
    $reservations = $r.Content | ConvertFrom-Json
    Write-Host "  Total reservations: $($reservations.Count)" -ForegroundColor Yellow
} catch { Write-Host "  FAILED: $_" -ForegroundColor Red }
Write-Host ""

# TEST 12: Get Couriers
Write-Host "=== TEST 12: Get Couriers ===" -ForegroundColor Green
try {
    $r = Invoke-WebRequest -Uri "$BASE/api/admin/couriers" -UseBasicParsing
    $couriers = $r.Content | ConvertFrom-Json
    Write-Host "  Total couriers: $($couriers.Count)" -ForegroundColor Yellow
    if ($couriers.Count -gt 0) {
        Write-Host "  First: $($couriers[0].name) - $($couriers[0].vehicleType) - Online: $($couriers[0].isOnline)" -ForegroundColor White
    }
} catch { Write-Host "  FAILED: $_" -ForegroundColor Red }
Write-Host ""

# TEST 13: Get Courier Analytics
Write-Host "=== TEST 13: Get Courier Analytics ===" -ForegroundColor Green
try {
    $r = Invoke-WebRequest -Uri "$BASE/api/admin/couriers/analytics" -UseBasicParsing
    Write-Host "  Response: $($r.Content)" -ForegroundColor White
} catch { Write-Host "  FAILED: $_" -ForegroundColor Red }
Write-Host ""

# TEST 14: Get Delivery Stats
Write-Host "=== TEST 14: Get Delivery Stats ===" -ForegroundColor Green
try {
    $r = Invoke-WebRequest -Uri "$BASE/api/admin/analytics/delivery-stats" -UseBasicParsing
    Write-Host "  Response: $($r.Content)" -ForegroundColor White
} catch { Write-Host "  FAILED: $_" -ForegroundColor Red }
Write-Host ""

# TEST 15: Get Peak Hours Analytics
Write-Host "=== TEST 15: Get Peak Hours Analytics ===" -ForegroundColor Green
try {
    $r = Invoke-WebRequest -Uri "$BASE/api/admin/analytics/peak-hours" -UseBasicParsing
    Write-Host "  Response: $($r.Content)" -ForegroundColor White
} catch { Write-Host "  FAILED: $_" -ForegroundColor Red }
Write-Host ""

# TEST 16: Get Profitability Metrics
Write-Host "=== TEST 16: Get Profitability Metrics ===" -ForegroundColor Green
try {
    $r = Invoke-WebRequest -Uri "$BASE/api/admin/analytics/profitability" -UseBasicParsing
    Write-Host "  Response: $($r.Content)" -ForegroundColor White
} catch { Write-Host "  FAILED: $_" -ForegroundColor Red }
Write-Host ""

# TEST 17: Validate Coupon
Write-Host "=== TEST 17: Validate Coupon ===" -ForegroundColor Green
try {
    $body = @{code="WELCOME10"; total=20} | ConvertTo-Json
    $r = Invoke-WebRequest -Uri "$BASE/api/coupons/validate" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "  Response: $($r.Content)" -ForegroundColor White
} catch { Write-Host "  FAILED: $_" -ForegroundColor Red }
Write-Host ""

# TEST 18: Get Loyalty Points
Write-Host "=== TEST 18: Get Loyalty Points ===" -ForegroundColor Green
try {
    $r = Invoke-WebRequest -Uri "$BASE/api/loyalty/test@example.com" -UseBasicParsing
    Write-Host "  Response: $($r.Content)" -ForegroundColor White
} catch { Write-Host "  FAILED: $_" -ForegroundColor Red }
Write-Host ""

# TEST 19: Dispatch Suggestions
Write-Host "=== TEST 19: Dispatch Suggestions ===" -ForegroundColor Green
try {
    $body = @{orderCity="Hlohovec"} | ConvertTo-Json
    $r = Invoke-WebRequest -Uri "$BASE/api/admin/dispatch/suggestions" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "  Response: $($r.Content)" -ForegroundColor White
} catch { Write-Host "  FAILED: $_" -ForegroundColor Red }
Write-Host ""

# TEST 20: Smart Batching
Write-Host "=== TEST 20: Smart Batching ===" -ForegroundColor Green
try {
    $r = Invoke-WebRequest -Uri "$BASE/api/admin/dispatch/smart-batch" -Method POST -ContentType "application/json" -UseBasicParsing
    Write-Host "  Response: $($r.Content)" -ForegroundColor White
} catch { Write-Host "  FAILED: $_" -ForegroundColor Red }
Write-Host ""

# TEST 21: Get ETA
Write-Host "=== TEST 21: Get ETA ===" -ForegroundColor Green
try {
    $body = @{orderId=$global:testOrderId} | ConvertTo-Json
    $r = Invoke-WebRequest -Uri "$BASE/api/admin/dispatch/eta" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "  Response: $($r.Content)" -ForegroundColor White
} catch { Write-Host "  FAILED: $_" -ForegroundColor Red }
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ALL TESTS COMPLETED" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
