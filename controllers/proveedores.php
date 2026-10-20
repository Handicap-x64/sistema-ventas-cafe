<?php
require_once __DIR__ . '/../db/conexion.php'; // pdo (Conexion a la base de datos)
require_once __DIR__ . '/../models/proveedores.php'; // proveedores Model
require_once __DIR__ . '/../Errors/exceptions.php'; // Excepciones personalizadas
require_once __DIR__ . '/../middlewares/validacion.php'; // Validacion de datos

$modelo = new ProvModel($pdo);
$validacion = new Validate($pdo);

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // Si la peticion pasa el parametro id se le regresa un solo proveedor, el que tenga ese id
        if (!empty($_GET['id'])) {
            try {
                $id = $_GET['id'];
                $validacion->no_encontrado($id);
            } catch (ValidationException $e) {
                http_response_code(404);
                echo json_encode(['error' => $e->getMessage()]);  
                break;
            }
            $proveedor = $modelo->get($id);
            echo json_encode($proveedor, JSON_UNESCAPED_UNICODE);
            break;
        }
        try {
            $proveedors = $modelo->getAll();
            if (!$proveedors) echo json_encode(['warning' => 'No hay ningun proveedor registrado']);

            echo json_encode($proveedors, JSON_UNESCAPED_UNICODE);
        } catch (ValidationException $e) {
            http_response_code(404);
            echo json_encode(['error' => $e->getMessage()]);  
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al carga los proveedors']);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        try {
            $validacion->nuevo_cli_prov(...$data);

            $id = $modelo->create($data);
            echo json_encode(['success' => 'proveedor creado con exito', 'id' => $id]);
        } catch (ValidationException $e) {
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al crear el proveedor']);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta el parametro id']);
            break;
        }
        try {
            $validacion->actualizar_cli_prov((int) $id, 'proveedor', ...$data);

            $modelo->update($id, $data);
            echo json_encode(['success' => 'proveedor actualizado con exito']);
        } catch (ValidationException $e) {
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al actualizar el proveedor']);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta el parametro id']);
            break;
        }
        try {
            $validacion->no_encontrado($id);
            $modelo->delete($id);
            echo json_encode(['success' => 'proveedor eliminado con exito']);
        } catch (ConflictoException $e) {
            http_response_code(409); // Conflict
            echo json_encode(['error' => $e->getMessage()]);
        } catch (ValidationException $e) {
            http_response_code(404);
            echo json_encode(['error' => $e->getMessage()]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al eliminar el proveedor', 'details' => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405); // Method not allowed
        echo json_encode(['error' => 'Metodo no permitdo']);
}