# Prueba 9 variantes de consulta contra la capa de usos del suelo urbano de Medellín
# para saber cuál acepta el servidor. Son pedidos pequeños, con pausa entre cada uno.
$servicio = "https://www.medellin.gov.co/servidormapas/rest/services/ordenamiento_ter/VM_23_Uso_General_Suelo_Urbano/MapServer/2/query"

$variantes = @(
    @{ Nombre = "1 conteo";                         Consulta = "where=1%3D1&returnCountOnly=true&f=pjson" },
    @{ Nombre = "2 solo ids";                       Consulta = "where=1%3D1&returnIdsOnly=true&f=pjson" },
    @{ Nombre = "3 atributos sin geometria";        Consulta = "where=1%3D1&outFields=*&returnGeometry=false&resultRecordCount=3&f=pjson" },
    @{ Nombre = "4 geojson 1 registro, 2 campos";   Consulta = "where=1%3D1&outFields=areagraluso,subcategoria&returnGeometry=true&resultRecordCount=1&f=geojson" },
    @{ Nombre = "5 igual que 4 + outSR 4326";       Consulta = "where=1%3D1&outFields=areagraluso,subcategoria&returnGeometry=true&resultRecordCount=1&outSR=4326&f=geojson" },
    @{ Nombre = "6 todos los campos + outSR 4326";  Consulta = "where=1%3D1&outFields=*&returnGeometry=true&resultRecordCount=1&outSR=4326&f=geojson" },
    @{ Nombre = "7 pagina de 100 sin orden";        Consulta = "where=1%3D1&outFields=*&returnGeometry=true&resultRecordCount=100&resultOffset=0&outSR=4326&f=geojson" },
    @{ Nombre = "8 pagina de 100 con orden t_id";   Consulta = "where=1%3D1&outFields=*&returnGeometry=true&resultRecordCount=100&resultOffset=0&orderByFields=t_id&outSR=4326&f=geojson" },
    @{ Nombre = "9 pagina de 500 sin orden";        Consulta = "where=1%3D1&outFields=*&returnGeometry=true&resultRecordCount=500&resultOffset=0&outSR=4326&f=geojson" }
)

foreach ($v in $variantes) {
    $url = "${servicio}?" + $v.Consulta
    try {
        $respuesta = Invoke-WebRequest -Uri $url -UseBasicParsing
        $texto = $respuesta.Content
        $estado = if ($texto -match '"error"') { "ERROR" } else { "OK" }
        $inicio = if ($texto.Length -gt 200) { $texto.Substring(0, 200) } else { $texto }
        $inicio = $inicio -replace "\s+", " "
        Write-Host ("[{0}] {1} | {2} caracteres | {3}" -f $estado, $v.Nombre, $texto.Length, $inicio)
    }
    catch {
        Write-Host ("[EXCEPCION] {0} | {1}" -f $v.Nombre, $_.Exception.Message)
    }
    Start-Sleep -Seconds 2
}