<?php
require_once __DIR__ . '/../models/reportes.php';

header('Content-Type: application/json; charset=utf-8');

$pdo = require __DIR__ . '/../db/conexion.php';
if (!($pdo instanceof PDO)) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexion a base de datos']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['error' => 'Metodo no permitido']);
    exit;
}

$tipo = $_GET['tipo'] ?? 'todos';
if (!is_string($tipo)) {
    http_response_code(400);
    echo json_encode(['error' => 'El parametro tipo es invalido']);
    exit;
}

$limite = 10;
if (isset($_GET['limite'])) {
    $limite = filter_var($_GET['limite'], FILTER_VALIDATE_INT);
    if ($limite === false || $limite < 1 || $limite > 100) {
        http_response_code(400);
        echo json_encode(['error' => 'El parametro limite debe ser un entero entre 1 y 100']);
        exit;
    }
}

$modelo = new ReportesModel($pdo);

try {
    $respuesta = match ($tipo) {
        'todos' => [
            'cuentas_por_cobrar' => $modelo->get_cta_x_cobrar(),
            'top_cafes' => $modelo->get_top_cafes(),
            'ultimos_movimientos' => $modelo->get_last_movimientos($limite),
            'ganancias' => $modelo->getGanancias()
        ],
        'cuentas_por_cobrar' => $modelo->get_cta_x_cobrar(),
        'top_cafes' => $modelo->get_top_cafes(),
        'ultimos_movimientos' => $modelo->get_last_movimientos($limite),
        'ganancias' => $modelo->getGanancias(),
        default => null
    };

    if ($respuesta === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Tipo de reporte desconocido']);
        exit;
    }

    echo json_encode($respuesta, JSON_THROW_ON_ERROR);
} catch (PDOException | JsonException $e) {
    error_log('Error al generar el reporte: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'No se pudo generar el reporte']);
}
