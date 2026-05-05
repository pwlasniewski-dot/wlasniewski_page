$body = '{"items":[{"type":"booking","title":"Sesja - Zloty","price":50000,"metadata":{"service":"Sesja","package":"Zloty","price":50000,"date":"2026-06-20","start_time":"12:00","end_time":"14:00","hours":2,"originalPrice":50000,"photographer_name":"test","venue_city":null,"venue_place":null,"notes":null,"promo_code":null,"gift_card_code":null,"challenge_id":null,"photographer_id":null}}],"customer":{"name":"Test Klient","email":"test.checkout@example.com","phone":"+48600000001"},"totalAmount":50000,"payment_plan":"FULL"}'

try {
    $r = Invoke-WebRequest -Uri "https://wlasniewski.pl/api/basket/checkout" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
    Write-Host "HTTP $($r.StatusCode)"
    Write-Host $r.Content
} catch {
    Write-Host "HTTP $($_.Exception.Response.StatusCode.value__)"
    Write-Host $_.ErrorDetails.Message
}
