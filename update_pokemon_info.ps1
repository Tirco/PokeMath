# update_pokemon_info.ps1
# Performs all 4 tasks on pokemon_info.json

$ErrorActionPreference = "Stop"

$AF_PATH = "C:\Users\mortel-nes\OneDrive - DGI Digirom\PokeMath\alternateforms_backup.js"
$PI_PATH = "C:\Users\mortel-nes\OneDrive - DGI Digirom\PokeMath\pokemon_info.json"

Write-Host "Reading files..."

# ── Parse alternateforms_backup.js ──────────────────────────────────────────
# The file has two JS vars: alternateFormsData (lines 1-1259) and eventData after.
# We only want alternateFormsData. Strategy: read all lines, find where
# 'var alternateFormsData = ' starts and take everything up to (but not including)
# the next 'var ' declaration, then strip the wrapper.

$afLines = [System.IO.File]::ReadAllLines($AF_PATH, [System.Text.Encoding]::UTF8)

# Find line indices of 'var ' declarations
$varLineIndices = @()
for ($i = 0; $i -lt $afLines.Length; $i++) {
    if ($afLines[$i] -match '^\s*var\s+') {
        $varLineIndices += $i
    }
}

Write-Host "Found $($varLineIndices.Count) var declarations at lines: $($varLineIndices -join ', ')"

# Extract alternateFormsData block (lines from first var up to second var)
$startIdx = $varLineIndices[0]
$endIdx = if ($varLineIndices.Count -gt 1) { $varLineIndices[1] - 1 } else { $afLines.Length - 1 }

$afBlock = ($afLines[$startIdx..$endIdx] -join "`n").Trim()

# Strip "var alternateFormsData = " from the front
$afBlock = [regex]::Replace($afBlock, '^\s*var\s+alternateFormsData\s*=\s*', '')
$afBlock = $afBlock.TrimEnd(';').Trim()

Write-Host "alternateFormsData JSON block length: $($afBlock.Length) chars"
Write-Host "First 50 chars: $($afBlock.Substring(0, [Math]::Min(50, $afBlock.Length)))"

$altData = $afBlock | ConvertFrom-Json
Write-Host "Parsed alternateFormsData successfully."

# ── Parse pokemon_info.json ──────────────────────────────────────────────────
$piRaw = [System.IO.File]::ReadAllText($PI_PATH, [System.Text.Encoding]::UTF8)
$piData = $piRaw | ConvertFrom-Json

Write-Host "Loaded alternateforms species count: $(($altData | Get-Member -MemberType NoteProperty).Count)"
Write-Host "Loaded pokemon_info species count: $(($piData | Get-Member -MemberType NoteProperty).Count)"

# Convert PSCustomObject to nested ordered hashtables for easier manipulation
function ConvertTo-Hashtable {
    param($obj)
    if ($obj -is [System.Management.Automation.PSCustomObject]) {
        $ht = [ordered]@{}
        foreach ($prop in $obj.PSObject.Properties) {
            $ht[$prop.Name] = ConvertTo-Hashtable $prop.Value
        }
        return $ht
    } elseif ($obj -is [System.Array]) {
        $result = @()
        foreach ($item in $obj) {
            $result += ConvertTo-Hashtable $item
        }
        return $result
    } else {
        return $obj
    }
}

Write-Host "Converting to hashtables..."
$pi = ConvertTo-Hashtable $piData
$alt = ConvertTo-Hashtable $altData

Write-Host "Done converting. Processing species..."

# ── TASK 1 & 2: Re-assign sub-IDs based on alternateforms imageid mapping ────

$altSpecies = @($alt.Keys)
Write-Host "alternateforms species: $($altSpecies.Count)"
$newSpeciesAdded = 0
$missingVariantsAdded = 0

foreach ($speciesId in $altSpecies) {
    $altVariants = $alt[$speciesId]  # hashtable: subId -> {name, imageid, types}

    if (-not $pi.Contains($speciesId)) {
        # Species not in pokemon_info at all — create it with just sub-"0" placeholder
        Write-Host "Creating new species: $speciesId"
        $pi[$speciesId] = [ordered]@{}
        $newSpeciesAdded++
    }

    $piSpecies = $pi[$speciesId]

    # Build imageid -> current_sub_id map from pokemon_info (non-"0" variants)
    $imageIdToCurrentSubId = @{}
    $currentSubIdToEntry = [ordered]@{}
    foreach ($subId in @($piSpecies.Keys)) {
        if ($subId -eq "0") { continue }
        $entry = $piSpecies[$subId]
        $imgId = $entry["imageid"]
        $imageIdToCurrentSubId["$imgId"] = $subId
        $currentSubIdToEntry[$subId] = $entry
    }

    # Build new variant hashtable starting fresh (keep "0")
    $newVariants = [ordered]@{}
    if ($piSpecies.Contains("0")) {
        $newVariants["0"] = $piSpecies["0"]
    }

    # Collect all altform sub-IDs (numeric sort)
    $altSubIds = @($altVariants.Keys | Sort-Object { [int]$_ })

    # Track which pi imageids have been assigned
    $assignedImageIds = @{}

    # Step 1: Assign alt-form sub-IDs first
    foreach ($altSubId in $altSubIds) {
        $altEntry = $altVariants[$altSubId]
        $targetImageId = $altEntry["imageid"]
        $imgKey = "$targetImageId"

        if ($imageIdToCurrentSubId.ContainsKey($imgKey)) {
            # This imageid exists in pi — use its existing entry but reassign to altSubId
            $existingSubId = $imageIdToCurrentSubId[$imgKey]
            $newVariants[$altSubId] = $currentSubIdToEntry[$existingSubId]
            $assignedImageIds[$imgKey] = $true
        } else {
            # Not in pi — create from alternateforms data (TASK 2)
            $missingVariantsAdded++
            Write-Host "  Adding missing variant: species=$speciesId sub=$altSubId name=$($altEntry['name'])"
            $types = @($altEntry["types"])

            # Try to inherit some fields from the base form "0" if available
            $slug = ($altEntry["name"] -replace ' ', '-').ToLower()
            $dexNum = [int]$speciesId
            $baseForm = $null
            if ($piSpecies.Contains("0")) { $baseForm = $piSpecies["0"] }

            $newEntry = [ordered]@{
                "name"           = $altEntry["name"]
                "imageid"        = [int]$altEntry["imageid"]
                "slug"           = $slug
                "dex_number"     = $dexNum
                "region"         = if ($baseForm) { $baseForm["region"] } else { "unknown" }
                "types"          = $types
                "enabled"        = $true
                "catchable"      = $false
                "is_legendary"   = $false
                "is_mythical"    = $false
                "is_ultra_beast" = $false
                "is_event"       = $false
                "is_form"        = $true
                "generation"     = if ($baseForm) { $baseForm["generation"] } else { "unknown" }
                "height"         = $null
                "weight"         = $null
                "abundance"      = 0
                "gender_rate"    = $null
                "hatch_counter"  = $null
                "form_item"      = ""
                "spawn_time"     = ""
                "spawn_season"   = ""
                "base_hp"        = $null
                "base_atk"       = $null
                "base_def"       = $null
                "base_satk"      = $null
                "base_sdef"      = $null
                "base_spd"       = $null
                "evo_to"         = $null
                "evo_from"       = $null
                "evo_mega"       = $null
                "evo_mega_x"     = $null
                "evo_mega_y"     = $null
                "name_ja"        = ""
                "name_de"        = ""
                "name_fr"        = ""
                "description"    = ""
            }
            $newVariants[$altSubId] = $newEntry
            $assignedImageIds[$imgKey] = $true
        }
    }

    # Step 2: Assign remaining pi variants (not in alt) to next available sub-IDs
    $maxAltSubId = if ($altSubIds.Count -gt 0) {
        ($altSubIds | ForEach-Object { [int]$_ } | Measure-Object -Maximum).Maximum
    } else { 0 }
    $nextSubId = $maxAltSubId + 1

    foreach ($oldSubId in @($currentSubIdToEntry.Keys | Sort-Object { [int]$_ })) {
        $entry = $currentSubIdToEntry[$oldSubId]
        $imgId = $entry["imageid"]
        $imgKey = "$imgId"
        if (-not $assignedImageIds.ContainsKey($imgKey)) {
            # Not yet assigned — give it the next available sub-id
            $newSubId = "$nextSubId"
            while ($newVariants.Contains($newSubId)) {
                $nextSubId++
                $newSubId = "$nextSubId"
            }
            $newVariants[$newSubId] = $entry
            $assignedImageIds[$imgKey] = $true
            $nextSubId++
        }
    }

    $pi[$speciesId] = $newVariants
}

Write-Host "TASK 1 & 2 complete. New species added: $newSpeciesAdded. Missing variants added: $missingVariantsAdded"

# ── TASK 3: Add `event` field to every entry ─────────────────────────────────
Write-Host "Adding event field to all entries..."
$eventCount = 0

foreach ($speciesId in @($pi.Keys)) {
    $speciesVariants = $pi[$speciesId]
    foreach ($subId in @($speciesVariants.Keys)) {
        $entry = $speciesVariants[$subId]
        $isEvent = $entry["is_event"]

        if ($isEvent -eq $true) {
            # Check name and slug for event keywords (case-insensitive)
            $nameStr = if ($entry["name"]) { $entry["name"].ToLower() } else { "" }
            $slugStr = if ($entry["slug"]) { $entry["slug"].ToLower() } else { "" }
            $combined = "$nameStr $slugStr"

            if ($combined -match "halloween") {
                $entry["event"] = "Halloween"
            } elseif ($combined -match "christmas|xmas|winter") {
                $entry["event"] = "Christmas"
            } elseif ($combined -match "summer") {
                $entry["event"] = "Summer"
            } elseif ($combined -match "easter") {
                $entry["event"] = "Easter"
            } else {
                $entry["event"] = "Unique"
            }
            $eventCount++
        } else {
            $entry["event"] = "none"
        }
    }
}

Write-Host "TASK 3 complete. Event entries tagged: $eventCount"

# ── TASK 4: Serialize back to JSON ───────────────────────────────────────────
Write-Host "Serializing to JSON..."

# PowerShell's ConvertTo-Json with -Depth 10 handles nested hashtables well
$jsonOut = $pi | ConvertTo-Json -Depth 10

# Write with UTF-8 BOM-less encoding
Write-Host "Writing output file..."
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($PI_PATH, $jsonOut, $utf8NoBom)

Write-Host "Done! File written to: $PI_PATH"
Write-Host "Output size: $((Get-Item $PI_PATH).Length) bytes"
Write-Host "Total species in output: $(($pi.Keys).Count)"
