<?php

class VentasModel {
    public function __construct(private PDO $pdo) {}

    public function get(int $id) {
        $statement = $this->pdo->prepare(
            "SELECT
                v.id     AS venta_id,
                v.fecha,
                v.pagado,
                c.id     AS cliente_id,
                c.nombre AS cliente,
                COALESCE((
                    SELECT JSON_ARRAYAGG(JSON_OBJECT(
                        'id',          d.id,
                        'producto',    d.producto,
                        'cantidad_kg', d.cantidad_kg,
                        'precio_bs',      d.precio_bs,
                        'subtotal',    d.subtotal
                    ))
                        FROM detalles_ventas d
                        WHERE d.id_venta = v.id
                ), '[]') AS detalles
            FROM ventas v
            LEFT JOIN clientes c ON c.id = v.id_cli
            WHERE v.id = ?"
        );

        try {
            $statement->execute([$id]);
            $venta = $statement->fetch(PDO::FETCH_ASSOC);

            return $venta;
        } catch (PDOException $e) {
            error_log("Error al obtener el venta" . $e->getMessage());
        }
    }

    public function getAll() {
        $statement = $this->pdo->prepare(
            "SELECT
                v.id     AS venta_id,
                v.fecha,
                v.pagado,
                c.id     AS cliente_id,
                c.nombre AS cliente,
                COALESCE((
                    SELECT JSON_ARRAYAGG(JSON_OBJECT(
                        'id',          d.id,
                        'producto',    d.producto,
                        'cantidad_kg', d.cantidad_kg,
                        'precio_bs',      d.precio_bs,
                        'subtotal',    d.subtotal
                    ))
                        FROM detalles_ventas d
                        WHERE d.id_venta = v.id
                ), '[]') AS detalles
            FROM ventas v
            LEFT JOIN clientes c ON c.id = v.id_cli"
        );
                                        

        try {
            $statement->execute();
            $ventas = $statement->fetchAll(PDO::FETCH_ASSOC);
            return $ventas;
        } catch (PDOException $e) {
            error_log("Error al obtener las ventas" . $e->getMessage());
            return [];
        }

    }

    public function create(array $venta, array $detalles) {
        
        $stmt_venta = $this->pdo->prepare('INSERT INTO ventas(id_cli, fecha, tasa_bcv, pagado) VALUES (?, ?, ?, ?)');
        $stmt_detalles = $this->pdo->prepare('INSERT INTO detalles_ventas(id_venta, producto, cantidad_kg, precio_bs) VALUES (?, ?, ?, ?)');
        
        try {
            $this->pdo->beginTransaction();

            $stmt_venta->execute([
                $venta['id_cli'],
                $venta['fecha'],
                $venta['tasa_bcv'],
                $venta['pagado']
            ]);

            $lastId = $this->pdo->lastInsertId();
            foreach($detalles as $d) {
                $stmt_detalles->execute([
                    $lastId,
                    $d['producto'],
                    $d['cantidad_kg'],
                    $d['precio_bs']
                ]);
            } 
            $this->pdo->commit();
            return $lastId;
        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Error al crear el venta: " . $e->getMessage());
            throw $e;
        }
    }

    public function update(int $id, array $venta, array $detalles) {

        $stmt_venta = $this->pdo->prepare('UPDATE ventas SET 
            id_cli = ?, 
            fecha = ?, 
            tasa_bcv = ?,
            pagado = ?
            WHERE id = ?');

        $stmt_detalles = $this->pdo->prepare('UPDATE detalles_ventas SET
            id_venta = ?,
            producto = ?,
            cantidad_kg = ?,
            precio_bs = ?
            WHERE id = ?');

        try {
            $this->pdo->beginTransaction();

            $stmt_venta->execute([
                $venta['id_cli'],
                $venta['fecha'],
                $venta['tasa_bcv'],
                $venta['pagado'],
                $id
            ]);

            foreach($detalles as $d) {
                $stmt_detalles->execute([
                    $d['id_venta'],
                    $d['producto'],
                    $d['cantidad_kg'],
                    $d['precio_bs'],
                    $d['id']
                ]);
            }

            $this->pdo->commit();
            return $id;
        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Error al actualizar el venta: " . $e->getMessage());
            throw $e;
        }
    }

    public function delete(int $id) {
        $stmtDetalles = $this->pdo->prepare('DELETE FROM detalles_ventas WHERE id_venta = ?');
        $stmtventa = $this->pdo->prepare('DELETE FROM ventas WHERE id = ?');

        try {
            $this->pdo->beginTransaction();

            $stmtDetalles->execute([$id]);
            $stmtventa->execute([$id]);

            $this->pdo->commit();
            return $id;
        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Error al eliminar el venta: " . $e->getMessage());
            throw $e;
        }
    }
}
