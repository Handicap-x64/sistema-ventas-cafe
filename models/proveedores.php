<?php
require_once __DIR__ . '/model.php';

class ProvModel implements Model {
    public function __construct(private PDO $pdo) {}

    public function get(int $id) {
        $statement = $this->pdo->prepare('SELECT * FROM proveedores WHERE id = ?');

        try {
            $statement->execute([$id]);
            $proveedor = $statement->fetch(PDO::FETCH_ASSOC); // PDO::FETCH_ASSOC hace que la query regrese un array asociativo

            return $proveedor;
        } catch (PDOException $e) {
            error_log("Error al obtener el proveedor" . $e->getMessage());
        }
    }

    public function getAll() {
        $statement = $this->pdo->query('SELECT * FROM proveedores');

        try {
            $proveedores = $statement->fetchAll(PDO::FETCH_ASSOC);
            return $proveedores;
        } catch (PDOException $e) {
            error_log("Error al obtener los proveedores" . $e->getMessage());
        }
    }

    public function create(array $data) {
        
        $statement = $this->pdo->prepare('INSERT INTO proveedores(nombre, rif, nombre_con, cedula_con, telefono_con, email_con, activo) 
                                          VALUES (?, ?, ?, ?, ?, ?, ?)');
        
        try {
            $statement->execute([
                $data['nombre'],
                $data['rif'],
                $data['nombre_con'],
                $data['cedula_con'],
                $data['telefono_con'],
                $data['email_con'],
                $data['activo']
            ]);

            return $this->pdo->lastInsertId();
        } catch (PDOException $e) {
            error_log("Error al crear el proveedor: " . $e->getMessage());
        }
    }

    public function update(int $id, array $data) {

        $statement = $this->pdo->prepare('UPDATE proveedores SET 
            nombre = ?, 
            nombre_con = ?, 
            rif = ?, 
            cedula_con = ?, 
            telefono_con = ?, 
            email_con = ?, 
            activo = ?
            WHERE id = ?');

        try {
            $statement->execute([
                $data['nombre'],
                $data['nombre_con'],
                $data['rif'],
                $data['cedula_con'],
                $data['telefono_con'],
                $data['email_con'],
                $data['activo'],
                $id
            ]);

            return $id;
        } catch (PDOException $e) {
            error_log("Error al actualizar el proveedor: " . $e->getMessage());
        }
    }

    public function delete(int $id) {
        $statement = $this->pdo->prepare('DELETE FROM proveedores WHERE id = ?');

        try {
            if (($e->errorInfo[1] ?? null) === 1451) {
                throw new ConflictoException("No se puede eliminar: el proveedor tiene facturas asociadas");
            }            $statement->execute([$id]);
            return $id;
        } catch (PDOException $e) {
            error_log("Error al eliminar el proveedor: ");
        }
    }
}