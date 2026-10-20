<?php
require_once __DIR__ . '/../models/compras.php';
require_once __DIR__ . '/../models/proveedores.php';
require_once __DIR__ . '/../middlewares/validacion.php';
require_once __DIR__ . '/../Errors/exceptions.php';

$pdo_instance = require_once __DIR__ . '/../db/conexion.php';
if (!($pdo_instance instanceof PDO)) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexion a base de datos']);
    exit;
}
$pdo = $pdo_instance;
$modelo = new ComprasModel($pdo);
$validacion = new Validate($pdo);

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (!empty($_GET['id'])) {
            try {
                $id = (int)$_GET['id'];
                $compra = $modelo->get($id);
                if (!$compra) {
                    http_response_code(404);
                    echo json_encode(['error' => 'No se ha encontrado la compra solicitada']);
                    return;
                }
                echo json_encode($compra);
                return;
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Error al obtener la compra']);
                return;
            }
        }
        try {
            $compras = $modelo->getAll();
            if (empty($compras)) {
                echo json_encode(['warning' => 'No hay ninguna compra registrada']);
                return;
            }
            echo json_encode($compras);
            return;
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al cargar las compras']);
            return;
        }
        break;

    case 'POST':
        $body = json_decode(file_get_contents('php://input'), true);
        try {
            if (!is_array($body)) {
                throw new ValidationException("Datos inválidos");
            }
            $compra = $body['compra'] ?? $body;
            $detalles = $body['detalles'] ?? ($compra['detalles'] ?? []);
            if (isset($compra['detalles'])) {
                unset($compra['detalles']);
            }
            $validacion->nueva_compra($compra, $detalles);
            $id = $modelo->create($compra, $detalles);
            echo json_encode(['success' => 'Compra creada con exito', 'id' => $id]);
        } catch (ValidationException $e) {
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al crear la compra']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Metodo no permitido']);
        break;
}
