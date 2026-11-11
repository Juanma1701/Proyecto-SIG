# C:\Proyectos\Proyecto_SIG\docs\scripts\descargar-usos-medellin.ps1
# Descarga UNA vez la capa oficial de usos generales del suelo urbano de Medellin
# (POT, Acuerdo 48 de 2014). Paginas de 100 poligonos, con pausa, reintentos y reanudacion:
# si se interrumpe, vuelve a ejecutarlo y continua donde quedo.
# Si una pagina falla, la pide registro por registro y anota en registros_omitidos.txt
# los que el servidor no puede entregar (no los mezcla en otro sistema de coordenadas).

$servicio = "https://www.medellin.gov.co/servidormapas/rest/services/ordenamiento_ter/VM_23_Uso_General_Suelo_Urbano/MapServer/2/query"
$carpeta = "C:\Proyectos\Proyecto_SIG\data\usos_medellin"
$tamano = 100
$esperado = 25446
$maxMB = 250          # si lo descargado supera esto, el script se detiene
$maxOmitidos = 100    # si se omiten mas registros que esto, el script se detiene
$maxFallosPagina = 20 # si fallan tantos registros en una sola pagina, el script se detiene
$registro = Join-Path $carpeta "registros_omitidos.txt"
$temporal = Join-Path $carpeta "temporal_registro.geojson"
New-Item -ItemType Directory -Force -Path $carpeta | Out-Null

function Contar-Poligonos($ruta) {
    $texto = [System.IO.File]::ReadAllText($ruta)
    return ([regex]::Matches($texto, '"type"\s*:\s*"Feature"')).Count
}

# Pide $cuantos registros desde $desplazamiento (ordenados por t_id, igual que las paginas ya bajadas).
# Primero con 6 decimales (menos peso); si falla, sin ese parametro.
function Pedir-Registros($desplazamiento, $cuantos, $ruta, $intentos, $pausa) {
    $base = "where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=geojson&orderByFields=t_id&resultOffset=$desplazamiento&resultRecordCount=$cuantos"
    $variantes = @("$base&geometryPrecision=6", $base)
    foreach ($consulta in $variantes) {
        for ($intento = 1; $intento -le $intentos; $intento++) {
            try {
                Invoke-WebRequest -Uri "${servicio}?$consulta" -OutFile $ruta -UseBasicParsing
                $texto = [System.IO.File]::ReadAllText($ruta)
                if ($texto -notmatch '"error"') { return $true }
            }
            catch { }
            Start-Sleep -Seconds $pausa
        }
    }
    return $false
}

# Anota un registro que no se pudo descargar (sin geometria, para saber cual es)
function Registrar-Omitido($pos) {
    $detalle = "posicion $pos"
    try {
        $q = "where=1%3D1&outFields=objectid,t_id,areagraluso&returnGeometry=false&f=json&orderByFields=t_id&resultOffset=$pos&resultRecordCount=1"
        $r = Invoke-RestMethod -Uri "${servicio}?$q"
        $a = $r.features[0].attributes
        $detalle = "posicion $pos | objectid $($a.objectid) | t_id $($a.t_id) | categoria $($a.areagraluso)"
    }
    catch { }
    Add-Content -Path $registro -Value $detalle
    Write-Host ("  Registro omitido: {0}" -f $detalle)
}

# Pide la pagina registro por registro y arma un solo archivo con los que si llegan.
# Devuelve cuantos registros logro armar (0 si fallan demasiados o el servidor no responde).
function Armar-Pagina($desplazamiento, $cuantos, $ruta) {
    $piezas = New-Object System.Collections.Generic.List[string]
    $fallos = 0
    for ($i = 0; $i -lt $cuantos; $i++) {
        $pos = $desplazamiento + $i
        $llego = $false
        if (Pedir-Registros $pos 1 $temporal 1 3) {
            $texto = [System.IO.File]::ReadAllText($temporal)
            $ini = $texto.IndexOf('"features":[')
            $fin = $texto.LastIndexOf(']')
            if ($ini -ge 0 -and $fin -gt $ini) {
                $inicio = $ini + 12
                $contenido = $texto.Substring($inicio, $fin - $inicio).Trim()
                if ($contenido.Length -gt 0) {
                    $piezas.Add($contenido)
                    $llego = $true
                }
            }
        }
        if (-not $llego) {
            $fallos++
            Registrar-Omitido $pos
            if ($fallos -ge $maxFallosPagina) {
                if (Test-Path $temporal) { Remove-Item $temporal }
                return 0
            }
        }
        Start-Sleep -Milliseconds 500
    }
    if (Test-Path $temporal) { Remove-Item $temporal }
    if ($piezas.Count -eq 0) { return 0 }
    $json = '{"type":"FeatureCollection","features":[' + ($piezas -join ',') + ']}'
    [System.IO.File]::WriteAllText($ruta, $json, (New-Object System.Text.UTF8Encoding($false)))
    return $piezas.Count
}

$desplazamiento = 0
$pagina = 1
$total = 0
$omitidosTotal = 0
$bytes = 0

while ($desplazamiento -lt $esperado) {
    $restantes = [Math]::Min($tamano, $esperado - $desplazamiento)
    $archivo = Join-Path $carpeta ("pagina_{0:D4}.geojson" -f $pagina)
    $existe = (Test-Path $archivo) -and ((Get-Item $archivo).Length -gt 1000)

    if (-not $existe) {
        if (Test-Path $archivo) { Remove-Item $archivo }
        $entera = Pedir-Registros $desplazamiento $restantes $archivo 2 5
        if (-not $entera) {
            Write-Host ("Pagina {0}: el servidor no la entrega completa. La pido registro por registro..." -f $pagina)
            if (Test-Path $archivo) { Remove-Item $archivo }
            $recibidos = Armar-Pagina $desplazamiento $restantes $archivo
            if ($recibidos -eq 0) {
                Write-Host ("No se pudo armar la pagina {0}: el servidor no responde o fallan demasiados registros seguidos. Avisame (pega tambien registros_omitidos.txt)." -f $pagina)
                exit 1
            }
        }
        Start-Sleep -Seconds 2
    }

    $cantidad = Contar-Poligonos $archivo
    $omitidosPagina = $restantes - $cantidad
    if ($omitidosPagina -lt 0) { $omitidosPagina = 0 }
    $bytes += (Get-Item $archivo).Length
    $total += $cantidad
    $omitidosTotal += $omitidosPagina
    Write-Host ("Pagina {0}: {1} poligonos ({2} omitidos) | acumulado {3} ({4:N1} MB)" -f $pagina, $cantidad, $omitidosPagina, $total, ($bytes / 1MB))

    if (($bytes / 1MB) -gt $maxMB) {
        Write-Host ("Se supero el limite de {0} MB. Detengo la descarga: avisame antes de seguir." -f $maxMB)
        exit 1
    }
    if ($omitidosTotal -gt $maxOmitidos) {
        Write-Host ("Hay mas de {0} registros omitidos. Detengo la descarga: avisame antes de seguir." -f $maxOmitidos)
        exit 1
    }

    $desplazamiento += $tamano
    $pagina++
}

Write-Host ("Total: {0} poligonos descargados + {1} omitidos, en {2} MB (esperado: {3})" -f $total, $omitidosTotal, ([math]::Round($bytes / 1MB, 1)), $esperado)
if (($total + $omitidosTotal) -eq $esperado) { Write-Host "OK: descargados + omitidos coinciden con el conteo del servidor." }
else { Write-Host "OJO: no coincide con el conteo del servidor. Avisame antes de seguir." }
if ($omitidosTotal -gt 0) { Write-Host ("Los omitidos estan en: {0}" -f $registro) }