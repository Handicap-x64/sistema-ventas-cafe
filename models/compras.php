<?php
class ComprasModel {
    public function __construct(private PDO $pdo) {}

    public function get(int $id) {
        $statement = $this->pdo->prepare(
            "SELECT
                c.id     AS compra_id,
                c.fecha,
                c.pagado,
                p.id     AS proveedor_id,
                p.nombre AS proveedor,
                COALESCE((
                    SELECT JSON_ARRAYAGG(JSON_OBJECT(
                        'id',          d.id,
                        'producto',    d.producto,
                        'cantidad_kg', d.cantidad_kg,
                        'precio',      d.precio,
                        'subtotal',    d.subtotal
                    ))
                        FROM detalles_compras d
                        WHERE d.id_compra = c.id
                ), '[]') AS detalles
            FROM compras c
            LEFT JOIN proveedores p ON p.id = c.id_prov
            WHERE c.id = ?"
        );

        try {
            $statement->execute([$id]);
            $compra = $statement->fetch(PDO::FETCH_ASSOC);

            return $compra;
        } catch (PDOException $e) {
            error_log("Error al obtener el compra" . $e->getMessage());
        }
    }

    public function getAll() {
        $statement = $this->pdo->prepare(
            "SELECT
                c.id     AS compra_id,
                c.fecha,
                c.pagado,
                p.id     AS proveedor_id,
                p.nombre AS proveedor,
                COALESCE((
                    SELECT JSON_ARRAYAGG(JSON_OBJECT(
                        'id',          d.id,
                        'producto',    d.producto,
                        'cantidad_kg', d.cantidad_kg,
                        'precio',      d.precio,
                        'subtotal',    d.subtotal
                    ))
                        FROM detalles_compras d
                        WHERE d.id_compra = c.id
                ), '[]') AS detalles
            FROM compras c
            LEFT JOIN proveedores p ON p.id = c.id_prov"
        );
                                        

        try {
            $statement->execute();
            $compras = $statement->fetchAll(PDO::FETCH_ASSOC);
            return $compras;
        } catch (PDOException $e) {
            error_log("Error al obtener los compras" . $e->getMessage());
            return [];
        }

    }

    public function create(array $compra, array $detalles) {
        
        $stmt_compra = $this->pdo->prepare('INSERT INTO compras(id_prov, fecha, pagado) VALUES (?, ?, ?)');
        $stmt_detalles = $this->pdo->prepare('INSERT INTO detalles_compras(id_compra, producto, cantidad_kg, precio) VALUES (?, ?, ?, ?)');
        
        try {
            $this->pdo->beginTransaction();

            $stmt_compra->execute([
                $compra['id_prov'],
                $compra['fecha'],
                $compra['pagado']
            ]);

            $lastId = $this->pdo->lastInsertId();
            foreach($detalles as $d) {
                $stmt_detalles->execute([
                    $lastId,
                    $d['producto'],
                    $d['cantidad_kg'],
                    $d['precio']
                ]);
            } 
            $this->pdo->commit();
            return $lastId;
        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Error al crear el compra: " . $e->getMessage());
            throw $e;
        }
    }

    public function update(int $id, array $compra, array $detalles) {

        $stmt_compra = $this->pdo->prepare('UPDATE compras SET 
            id_prov = ?, 
            fecha = ?, 
            pagado = ?
            WHERE id = ?');

        $stmt_detalles = $this->pdo->prepare('UPDATE detalles_compras SET
            id_compra = ?,
            producto = ?,
            cantidad_kg = ?,
            precio = ?
            WHERE id = ?');

        try {
            $this->pdo->beginTransaction();

            $stmt_compra->execute([
                $compra['id_prov'],
                $compra['fecha'],
                $compra['pagado'],
                $id
            ]);

            foreach($detalles as $d) {
                $stmt_detalles->execute([
                    $d['id_compra'],
                    $d['producto'],
                    $d['cantidad_kg'],
                    $d['precio'],
                    $d['id']
                ]);
            }

            $this->pdo->commit();
            return $id;
        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Error al actualizar el compra: " . $e->getMessage());
            throw $e;
        }
    }

    public function delete(int $id) {
        $stmtDetalles = $this->pdo->prepare('DELETE FROM detalles_compras WHERE id_compra = ?');
        $stmtCompra = $this->pdo->prepare('DELETE FROM compras WHERE id = ?');

        try {
            $this->pdo->beginTransaction();

            $stmtDetalles->execute([$id]);
            $stmtCompra->execute([$id]);

            $this->pdo->commit();
            return $id;
        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Error al eliminar el compra: " . $e->getMessage());
            throw $e;
        }
    }
}