<?php
require_once __DIR__ . '/../models/ventas.php';
require_once __DIR__ . '/../models/clientes.php';
require_once __DIR__ . '/../middlewares/validacion.php';
require_once __DIR__ . '/../Errors/exceptions.php';

$pdo_instance = require_once __DIR__ . '/../db/conexion.php';
if (!($pdo_instance instanceof PDO)) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexion a base de datos']);
    exit;
}
$pdo = $pdo_instance;
$modelo = new VentasModel($pdo);
$validacion = new Validate($pdo);

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (!empty($_GET['id'])) {
            try {
                $id = (int)$_GET['id'];
                $venta = $modelo->get($id);
                if (!$venta) {
                    http_response_code(404);
                    echo json_encode(['error' => 'No se ha encontrado la venta solicitada']);
                    return;
                }
                echo json_encode($venta);
                return;
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Error al obtener la venta']);
                return;
            }
        }
        try {
            $ventas = $modelo->getAll();
            if (empty($ventas)) {
                echo json_encode(['warning' => 'No hay ninguna venta registrada']);
                return;
            }
            echo json_encode($ventas);
            return;
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al cargar las ventas']);
            return;
        }

    case 'POST':
        $body = json_decode(file_get_contents('php://input'), true);
        try {
            if (!is_array($body)) {
                throw new ValidationException("Datos inválidos");
            }
            $venta = $body['venta'] ?? $body;
            $detalles = $body['detalles'] ?? ($venta['detalles'] ?? []);
            if (isset($venta['detalles'])) {
                unset($venta['detalles']);
            }
            $validacion->nueva_venta($venta, $detalles);
            $modelo->create($venta, $detalles);
            echo json_encode(['success' => 'Venta creada con exito']);
        } catch (ValidationException $e) {
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al crear la venta']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Metodo no permitido']);
        break;
}
