# One-time download helper for Figma priority assets (Step 1 export)
$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::GetFullPath((Join-Path (Join-Path $PSScriptRoot '..') 'apps/web/public/assets'))

$downloads = @(
  @{ Url = 'https://www.figma.com/api/mcp/asset/612834f1-eaab-440e-9125-49dc0cd93c41'; Out = 'brand/shared-logo-mark@64x64.png' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/75c3aea3-5d6d-4acc-abfa-e209adaf8be6'; Out = 'brand/shared-logo-full@343x90.png' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/ba95a9bb-fef6-4641-a618-0de5a04678bb'; Out = 'brand/shared-logo-sidebar@133x32.png' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/be5363a3-bfbd-4a83-b9cd-b3d5572f98bf'; Out = 'brand/shared-logo-sidebar-icon@32x32.png' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/8f47fe9a-ceec-4aad-8561-0b517292a22f'; Out = 'backgrounds/landing-page-bg@1440x7000.png' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/2595f1f4-8fbb-4672-8442-003dcece4bd3'; Out = 'illustrations/landing-hero-ai-chat@644x517.png' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/e965b298-d8c0-4670-beb9-a32e7dbdf9d4'; Out = 'illustrations/landing-feature-card-a@544x362.png' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/6e974cb4-4e75-4f0c-9414-c5bf369da38b'; Out = 'illustrations/landing-testimonial-amara@40x40.png' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/48255a10-5b9f-4f11-b7b7-6ed81b6d8145'; Out = 'illustrations/landing-testimonial-kevin@40x40.png' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/5198c96d-4524-47b7-a62c-68dc653fd759'; Out = 'illustrations/landing-testimonial-grace@40x40.png' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/b2955acf-359c-45d3-86a0-769b0343d8f2'; Out = 'misc/landing-logo-strip@848x64.png' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/14a510a9-883b-4609-aed3-ee768051b11c'; Out = 'backgrounds/auth-split-panel@959x1112.png' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/20b533e6-fc58-42df-b09f-a0d7da25b301'; Out = 'social/shared-google@24x24.svg' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/97fe97f4-5172-4a2d-8576-5f2dd1ed0a15'; Out = 'social/shared-apple@24x24.svg' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/15bdd449-bd25-483b-bcd5-516782e84a60'; Out = 'social/shared-facebook@24x24.svg' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/fb54195d-3a41-4b82-8d92-2ad71083341c'; Out = 'payments/shared-mtn-momo@44x44.svg' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/b95a8b39-e62f-4a14-995a-173b5c657d4e'; Out = 'payments/shared-mtn-momo-wordmark@88x34.svg' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/7b2dfdb0-85a8-4682-a098-a213cda8de95'; Out = 'payments/shared-orange-money@44x44.svg' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/4fda19a0-86b5-4e7f-af66-c65fa1fb959a'; Out = 'payments/shared-orange-money-wordmark@99x34.svg' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/c7ba975a-fd71-4784-b173-8be9f918931a'; Out = 'payments/shared-visa@36x24.svg' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/43912c69-1c84-4fd7-bce1-0d8788dbbe39'; Out = 'payments/shared-mastercard@36x24.svg' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/eaa08d76-3707-4179-b56c-5d4d3bec8c45'; Out = 'platforms/shared-fiverr@25x25.svg' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/b5204cb8-f1e0-41da-b18a-a76c83c77676'; Out = 'platforms/shared-freelancer@39x29.svg' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/20c7f76e-deea-48af-9314-f789d009904b'; Out = 'platforms/shared-upwork@40x24.svg' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/aaedbde7-703f-40f7-b176-c5c9724121a7'; Out = 'platforms/shared-instagram@18x18.svg' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/a6df2543-dd13-41bc-b730-d9e78e6a2aa0'; Out = 'platforms/shared-twitter@21x21.svg' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/09f348cd-47dc-4934-9ceb-e0cbf5461aa3'; Out = 'platforms/shared-platform-logo@36x36.svg' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/7de12fc7-3de7-4220-b4a1-c7fd8cd2d046'; Out = 'illustrations/shared-upgrade-hero@280x221.png' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/805d2ad8-8338-4801-9e05-82e78a6a7a16'; Out = 'illustrations/shared-upgrade-illustration@248x165.png' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/a2da887b-1d7e-4966-9964-c4b196bcae52'; Out = 'placeholders/shared-user-avatar@40x40.png' },
  @{ Url = 'https://www.figma.com/api/mcp/asset/020a62a3-2747-401f-8b95-9d1eb273cdc0'; Out = 'placeholders/shared-user-avatar@72x72.png' }
)

foreach ($item in $downloads) {
  $dest = Join-Path $root $item.Out
  $dir = Split-Path $dest -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  curl.exe -sL -o $dest $item.Url
  if (-not (Test-Path $dest) -or (Get-Item $dest).Length -eq 0) {
    throw "Download failed: $($item.Out)"
  }
}

# auth-logo-stack is the same export as shared-logo-full
Copy-Item (Join-Path $root 'brand/shared-logo-full@343x90.png') (Join-Path $root 'brand/auth-logo-stack@343x90.png') -Force

Write-Output "Downloaded $($downloads.Count) assets + auth-logo-stack copy"
