param(
  [int]$Limit = 250,
  [int]$IterationsPerLeague = 20,
  [int]$StartOffset = 1450
)

$leagues = @("premierLeague", "laLiga", "serieA", "bundesliga", "ligue1")

foreach ($league in $leagues) {
  Write-Host "Starting $IterationsPerLeague batches for $league at offset $StartOffset."
  $succeeded = $false
  for ($attempt = 1; $attempt -le 3 -and -not $succeeded; $attempt += 1) {
    & npm.cmd run import:wikidata -- "--league=$league" "--limit=$Limit" "--offset=$StartOffset" "--iterations=$IterationsPerLeague" "--apply"
    if ($LASTEXITCODE -eq 0) {
      $succeeded = $true
    } else {
      Write-Warning "$league intake attempt $attempt failed. Retrying in 15 seconds."
      Start-Sleep -Seconds 15
    }
  }
  if (-not $succeeded) { throw "Unable to complete the $league intake after three attempts." }
}

Write-Host "Big Five intake complete."
