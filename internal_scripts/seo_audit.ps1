$urls = @('https://wlasniewski.pl/', 'https://wlasniewski.pl/fotograf-torun', 'https://wlasniewski.pl/sesja-rodzinna')
$ua = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'

foreach ($url in $urls) {
    Write-Host ""
    Write-Host "================================================================"
    Write-Host "URL: $url"
    Write-Host "================================================================"
    try {
        $h = Invoke-WebRequest -Uri $url -UseBasicParsing -UserAgent $ua
        $content = $h.Content

        Write-Host "STATUS: $($h.StatusCode)  |  HTML size: $($content.Length) chars"

        if ($content -match '<title>(.*?)</title>') {
            Write-Host "TITLE: $($matches[1])"
        } else { Write-Host "TITLE: <BRAK>" }

        if ($content -match '<meta name="description" content="(.*?)"') {
            Write-Host "DESCRIPTION: $($matches[1])"
        } else { Write-Host "DESCRIPTION: <BRAK>" }

        $h1s = [regex]::Matches($content, '<h1[^>]*>([\s\S]*?)</h1>')
        Write-Host "H1 count: $($h1s.Count)"
        foreach ($m in $h1s) {
            $txt = $m.Groups[1].Value -replace '<[^>]+>','' -replace '\s+',' '
            Write-Host "  H1: $($txt.Trim())"
        }

        $h2s = [regex]::Matches($content, '<h2[^>]*>([\s\S]*?)</h2>')
        Write-Host "H2 count: $($h2s.Count)"
        $i = 0
        foreach ($m in $h2s) {
            if ($i -ge 5) { break }
            $txt = $m.Groups[1].Value -replace '<[^>]+>','' -replace '\s+',' '
            Write-Host "  H2: $($txt.Trim())"
            $i++
        }

        $imgsAll = [regex]::Matches($content, '<img[^>]*>').Count
        $imgsNoAlt = [regex]::Matches($content, '<img(?![^>]*\salt=)[^>]*>').Count
        $imgsEmptyAlt = [regex]::Matches($content, '<img[^>]*\salt=""[^>]*>').Count
        Write-Host "IMG: total=$imgsAll  no-alt=$imgsNoAlt  empty-alt=$imgsEmptyAlt"

        # Kanoniczny
        if ($content -match '<link rel="canonical" href="(.*?)"') {
            Write-Host "CANONICAL: $($matches[1])"
        }

        # JSON-LD
        $ld = [regex]::Matches($content, '<script type="application/ld\+json">').Count
        Write-Host "JSON-LD scripts: $ld"

    } catch {
        Write-Host "ERROR: $($_.Exception.Message)"
    }
}
