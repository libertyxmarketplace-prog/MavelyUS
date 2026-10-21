Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$src = [System.Drawing.Bitmap]::FromFile((Join-Path $root 'assets\erlcus_logo.png'))

# Find the bounding box of the green "M" mark (ignore the white wordmark below it).
$minX = $src.Width; $minY = $src.Height; $maxX = 0; $maxY = 0
for ($y = 0; $y -lt $src.Height; $y += 1) {
  for ($x = 0; $x -lt $src.Width; $x += 1) {
    $p = $src.GetPixel($x, $y)
    if ($p.A -gt 40 -and $p.G -gt 120 -and $p.G -gt ($p.R + 40) -and $p.G -gt ($p.B + 20)) {
      if ($x -lt $minX) { $minX = $x }; if ($x -gt $maxX) { $maxX = $x }
      if ($y -lt $minY) { $minY = $y }; if ($y -gt $maxY) { $maxY = $y }
    }
  }
}
$w = $maxX - $minX + 1; $h = $maxY - $minY + 1
Write-Output "Mark bounds: $minX,$minY ${w}x$h"

function Save-Mark([int]$size, [string]$out, [double]$padRatio, [bool]$background) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'HighQuality'; $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'
  if ($background) {
    $g.Clear([System.Drawing.Color]::FromArgb(255, 10, 10, 10))
  } else {
    $g.Clear([System.Drawing.Color]::Transparent)
  }
  $pad = [int]($size * $padRatio)
  $avail = $size - 2 * $pad
  $scale = [Math]::Min($avail / $w, $avail / $h)
  $dw = [int]($w * $scale); $dh = [int]($h * $scale)
  $dx = [int](($size - $dw) / 2); $dy = [int](($size - $dh) / 2)
  $g.DrawImage($src, (New-Object System.Drawing.Rectangle $dx, $dy, $dw, $dh), (New-Object System.Drawing.Rectangle $minX, $minY, $w, $h), 'Pixel')
  $g.Dispose()
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

$assets = Join-Path $root 'assets'
Save-Mark 512 (Join-Path $assets 'erlcus-mark.png') 0.04 $false
Save-Mark 32 (Join-Path $assets 'favicon-32.png') 0.04 $false
Save-Mark 180 (Join-Path $assets 'apple-touch-icon.png') 0.16 $true
Save-Mark 192 (Join-Path $assets 'icon-192.png') 0.14 $true
Save-Mark 512 (Join-Path $assets 'icon-512.png') 0.14 $true

# favicon.ico containing a 32px and 48px PNG frame
$tmp48 = Join-Path $assets 'favicon-48.tmp.png'
Save-Mark 48 $tmp48 0.04 $false
$frames = @(
  @{ size = 32; bytes = [System.IO.File]::ReadAllBytes((Join-Path $assets 'favicon-32.png')) },
  @{ size = 48; bytes = [System.IO.File]::ReadAllBytes($tmp48) }
)
$ms = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter $ms
$bw.Write([UInt16]0); $bw.Write([UInt16]1); $bw.Write([UInt16]$frames.Count)
$offset = 6 + 16 * $frames.Count
foreach ($f in $frames) {
  $bw.Write([byte]$f.size); $bw.Write([byte]$f.size); $bw.Write([byte]0); $bw.Write([byte]0)
  $bw.Write([UInt16]1); $bw.Write([UInt16]32)
  $bw.Write([UInt32]$f.bytes.Length); $bw.Write([UInt32]$offset)
  $offset += $f.bytes.Length
}
foreach ($f in $frames) { $bw.Write($f.bytes) }
[System.IO.File]::WriteAllBytes((Join-Path $assets 'favicon.ico'), $ms.ToArray())
$bw.Dispose(); Remove-Item $tmp48
$src.Dispose()
Write-Output 'Icons written.'
