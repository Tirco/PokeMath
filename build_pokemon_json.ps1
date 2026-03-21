# Build pokemon_info.json from pokemon.csv

$csvPath = "pokemon.csv"
$jsonPath = "pokemon_info.json"

# Read all CSV rows
$rows = Import-Csv -Path $csvPath -Encoding UTF8

# Load alternate forms data using node
$nodeScript = @"
const fs = require('fs');
const content = fs.readFileSync('alternateforms.js', 'utf8');
eval(content);
console.log('ALTFORMS:' + JSON.stringify(alternateFormsData));
console.log('EVENT:' + JSON.stringify(eventData));
"@

$tempScript = "temp_extract.js"
$nodeScript | Out-File -FilePath $tempScript -Encoding UTF8
$nodeOutput = & node $tempScript
Remove-Item $tempScript

$alternateFormsData = @{}
$eventData = @{}

foreach ($line in $nodeOutput) {
    if ($line.StartsWith('ALTFORMS:')) {
        $json = $line.Substring(9)
        $alternateFormsData = $json | ConvertFrom-Json
    }
    if ($line.StartsWith('EVENT:')) {
        $json = $line.Substring(6)
        $eventData = $json | ConvertFrom-Json
    }
}

# Helper: convert string to bool
function ToBool($val) {
    if ($null -eq $val -or $val -eq "") { return $false }
    return ($val -eq "1" -or $val -eq "true" -or $val -eq "True")
}

# Helper: convert string to int or null
function ToIntOrNull($val) {
    if ($null -eq $val -or $val -eq "") { return $null }
    $n = 0
    if ([int]::TryParse($val, [ref]$n)) { return $n }
    return $null
}

# Helper: convert string to float or null
function ToFloatOrNull($val) {
    if ($null -eq $val -or $val -eq "") { return $null }
    $n = 0.0
    if ([double]::TryParse($val, [ref]$n)) { return $n }
    return $null
}

# Build lookup: species_id -> ordered list of rows
$speciesMap = @{}

foreach ($row in $rows) {
    $speciesId = $row.dex_number
    if ($null -eq $speciesId -or $speciesId -eq "") { continue }

    if (-not $speciesMap.ContainsKey($speciesId)) {
        $speciesMap[$speciesId] = [System.Collections.Generic.List[object]]::new()
    }
    $speciesMap[$speciesId].Add($row)
}

# Build the result object
$result = [ordered]@{}

# Sort species by dex_number numerically
$sortedSpeciesIds = $speciesMap.Keys | Sort-Object { [int]$_ }

foreach ($speciesId in $sortedSpeciesIds) {
    $rows_for_species = $speciesMap[$speciesId]

    # Sort rows: base form first (id == dex_number), then by id ascending
    $sorted = $rows_for_species | Sort-Object {
        $id = [int]($_.id)
        $dex = [int]($_.dex_number)
        if ($id -eq $dex) { return 0 }
        else { return $id }
    }

    $speciesEntry = [ordered]@{}
    $formIndex = 0

    foreach ($row in $sorted) {
        # Build types array
        $types = @()
        $t0 = $row."type.0"
        $t1 = $row."type.1"
        if ($t0 -ne $null -and $t0 -ne "") { $types += $t0.ToLower() }
        if ($t1 -ne $null -and $t1 -ne "") { $types += $t1.ToLower() }

        # Build entry object
        $entry = [ordered]@{
            "name"              = $row."name.en"
            "imageid"           = ToIntOrNull($row.id)
            "slug"              = $row.slug
            "dex_number"        = ToIntOrNull($row.dex_number)
            "region"            = $row.region
            "types"             = $types
            "enabled"           = ToBool($row.enabled)
            "catchable"         = ToBool($row.catchable)
            "is_legendary"      = ToBool($row.legendary)
            "is_mythical"       = ToBool($row.mythical)
            "is_ultra_beast"    = ToBool($row.ultra_beast)
            "is_event"          = ToBool($row.event)
            "is_form"           = ToBool($row.is_form)
            "generation"        = $row.region
            "height"            = ToIntOrNull($row.height)
            "weight"            = ToIntOrNull($row.weight)
            "abundance"         = ToIntOrNull($row.abundance)
            "gender_rate"       = ToIntOrNull($row.gender_rate)
            "hatch_counter"     = ToIntOrNull($row.hatch_counter)
            "form_item"         = $row.form_item
            "spawn_time"        = $row.spawn_time
            "spawn_season"      = $row.spawn_season
            "base_hp"           = ToIntOrNull($row."base.hp")
            "base_atk"          = ToIntOrNull($row."base.atk")
            "base_def"          = ToIntOrNull($row."base.def")
            "base_satk"         = ToIntOrNull($row."base.satk")
            "base_sdef"         = ToIntOrNull($row."base.sdef")
            "base_spd"          = ToIntOrNull($row."base.spd")
            "evo_to"            = ToIntOrNull($row."evo.to")
            "evo_from"          = ToIntOrNull($row."evo.from")
            "evo_mega"          = ToIntOrNull($row."evo.mega")
            "evo_mega_x"        = ToIntOrNull($row."evo.mega_x")
            "evo_mega_y"        = ToIntOrNull($row."evo.mega_y")
            "name_ja"           = $row."name.ja"
            "name_ja_romanji"  = $row."name.ja_r"
            "name_de"           = $row."name.de"
            "name_fr"           = $row."name.fr"
            "description"       = $row.description
        }

        $speciesEntry["$formIndex"] = $entry
        $formIndex++
    }

    # Merge alternate forms data
    if ($alternateFormsData.ContainsKey($speciesId)) {
        foreach ($formKey in $alternateFormsData[$speciesId].Keys) {
            $altData = $alternateFormsData[$speciesId][$formKey]
            if ($speciesEntry.ContainsKey($formKey)) {
                # Update existing entry
                $speciesEntry[$formKey]["name"] = $altData.name
                $speciesEntry[$formKey]["types"] = $altData.types
                $speciesEntry[$formKey]["imageid"] = $altData.imageid
            }
        }
    }

    # Merge event data
    $eventTypes = @("halloween", "christmas", "unique")
    foreach ($eventType in $eventTypes) {
        if ($eventData.ContainsKey($eventType) -and $eventData[$eventType].ContainsKey($speciesId)) {
            foreach ($formKey in $eventData[$eventType][$speciesId].Keys) {
                $eventForm = $eventData[$eventType][$speciesId][$formKey]
                $eventKey = $eventForm.specialId
                $speciesEntry[$eventKey] = [ordered]@{
                    "name"              = $eventForm.name
                    "imageid"           = $eventForm.imageid
                    "slug"              = "$speciesId-$eventKey"
                    "dex_number"        = [int]$speciesId
                    "region"            = "event"
                    "types"             = $eventForm.types
                    "enabled"           = $true
                    "catchable"         = $false
                    "is_legendary"      = $false
                    "is_mythical"       = $false
                    "is_ultra_beast"    = $false
                    "is_event"          = $true
                    "is_form"           = $true
                    "generation"        = "event"
                    "height"            = 0
                    "weight"            = 0
                    "abundance"         = $null
                    "gender_rate"       = -1
                    "hatch_counter"     = $null
                    "form_item"         = ""
                    "spawn_time"        = ""
                    "spawn_season"      = ""
                    "base_hp"           = 0
                    "base_atk"          = 0
                    "base_def"          = 0
                    "base_satk"         = 0
                    "base_sdef"         = 0
                    "base_spd"          = 0
                    "evo_to"            = $null
                    "evo_from"          = $null
                    "evo_mega"          = $null
                    "evo_mega_x"        = $null
                    "evo_mega_y"        = $null
                    "name_ja"           = ""
                    "name_ja_romanji"   = ""
                    "name_de"           = ""
                    "name_fr"           = ""
                    "description"       = ""
                }
            }
        }
    }

    $result[$speciesId] = $speciesEntry
}

# Serialize to JSON with depth sufficient for nested objects
$json = $result | ConvertTo-Json -Depth 10 -Compress:$false

# Write to file
[System.IO.File]::WriteAllText($jsonPath, $json, [System.Text.Encoding]::UTF8)

Write-Host "Done. Written to: $jsonPath"
Write-Host "Species count: $($result.Count)"
