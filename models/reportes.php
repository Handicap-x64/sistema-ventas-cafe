<?php

class ReportesModel {
    public function __construct(private PDO $pdo) {}

    public function getGanancias(): array {
        $statement = $this->pdo->query(
            "SELECT
                tipo_entidad,
                entidad_id,
                negocio,
                SUM(compras_usd) AS compras_usd,
                SUM(ventas_usd) AS ventas_usd,
                SUM(ventas_bs) AS ventas_bs,
                SUM(ventas_usd) - SUM(compras_usd) AS ganancia_usd
            FROM (
                SELECT
                    'proveedor' AS tipo_entidad,
                    p.id AS entidad_id,
                    p.nombre AS negocio,
                    COALESCE(SUM(dc.subtotal), 0) AS compras_usd,
                    0 AS ventas_usd,
                    0 AS ventas_bs
                FROM proveedores p
                LEFT JOIN compras c ON c.id_prov = p.id
                LEFT JOIN detalles_compras dc ON dc.id_compra = c.id
                GROUP BY p.id, p.nombre

                UNION ALL

                SELECT
                    'cliente' AS tipo_entidad,
                    cl.id AS entidad_id,
                    cl.nombre AS negocio,
                    0 AS compras_usd,
                    COALESCE(SUM(dv.subtotal / NULLIF(v.tasa_bcv, 0)), 0) AS ventas_usd,
                    COALESCE(SUM(dv.subtotal), 0) AS ventas_bs
                FROM clientes cl
                LEFT JOIN ventas v ON v.id_cli = cl.id
                LEFT JOIN detalles_ventas dv ON dv.id_venta = v.id
                GROUP BY cl.id, cl.nombre
            ) movimientos
            GROUP BY tipo_entidad, entidad_id, negocio
            ORDER BY tipo_entidad, negocio"
        );

        return $statement->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getGananacias(): array {
        return $this->getGanancias();
    }

    public function get_cta_x_cobrar(): array {
        $statement = $this->pdo->query(
            "SELECT
                v.id AS venta_id,
                v.fecha,
                v.pagado,
                v.tasa_bcv,
                cl.id AS cliente_id,
                cl.nombre AS cliente,
                COALESCE(SUM(d.subtotal), 0) AS total_bs,
                COALESCE(SUM(d.subtotal / NULLIF(v.tasa_bcv, 0)), 0) AS total_usd,
                COALESCE((
                    SELECT JSON_ARRAYAGG(JSON_OBJECT(
                        'id', d2.id,
                        'producto', d2.producto,
                        'cantidad_kg', d2.cantidad_kg,
                        'precio_bs', d2.precio_bs,
                        'subtotal', d2.subtotal
                    ))
                    FROM detalles_ventas d2
                    WHERE d2.id_venta = v.id
                ), JSON_ARRAY()) AS detalles
            FROM ventas v
            LEFT JOIN clientes cl ON cl.id = v.id_cli
            LEFT JOIN detalles_ventas d ON d.id_venta = v.id
            WHERE v.pagado = 0
            GROUP BY v.id, v.fecha, v.pagado, v.tasa_bcv, cl.id, cl.nombre
            ORDER BY v.fecha DESC, v.id DESC"
        );

        return $this->decodeDetails($statement->fetchAll(PDO::FETCH_ASSOC));
    }

    public function get_top_cafes(): array {
        $statement = $this->pdo->query(
            "SELECT
                productos.producto,
                COALESCE(movimientos.kg_comprados, 0) AS kg_comprados,
                COALESCE(movimientos.kg_vendidos, 0) AS kg_vendidos
            FROM (
                SELECT 'SUAVE' AS producto
                UNION ALL SELECT 'NORMAL'
                UNION ALL SELECT 'FUERTE'
            ) productos
            LEFT JOIN (
                SELECT
                    producto,
                    SUM(kg_comprados) AS kg_comprados,
                    SUM(kg_vendidos) AS kg_vendidos
                FROM (
                    SELECT producto, SUM(cantidad_kg) AS kg_comprados, 0 AS kg_vendidos
                    FROM detalles_compras
                    GROUP BY producto

                    UNION ALL

                    SELECT producto, 0 AS kg_comprados, SUM(cantidad_kg) AS kg_vendidos
                    FROM detalles_ventas
                    GROUP BY producto
                ) cantidades
                GROUP BY producto
            ) movimientos ON movimientos.producto = productos.producto
            ORDER BY
                (COALESCE(movimientos.kg_comprados, 0) + COALESCE(movimientos.kg_vendidos, 0)) DESC,
                productos.producto"
        );

        return $statement->fetchAll(PDO::FETCH_ASSOC);
    }

    public function get_last_movimientos(int $limite = 10): array {
        $limite = max(1, min($limite, 100));
        $statement = $this->pdo->query(
            "SELECT movimientos.*
            FROM (
                SELECT
                    c.id AS id,
                    'compra' AS tipo,
                    p.id AS entidad_id,
                    p.nombre AS negocio,
                    c.fecha,
                    COALESCE(SUM(dc.subtotal), 0) AS total,
                    NULL AS total_bs,
                    c.pagado
                FROM compras c
                LEFT JOIN proveedores p ON p.id = c.id_prov
                LEFT JOIN detalles_compras dc ON dc.id_compra = c.id
                GROUP BY c.id, p.id, p.nombre, c.fecha, c.pagado

                UNION ALL

                SELECT
                    v.id AS id,
                    'venta' AS tipo,
                    cl.id AS entidad_id,
                    cl.nombre AS negocio,
                    v.fecha,
                    COALESCE(SUM(dv.subtotal / NULLIF(v.tasa_bcv, 0)), 0) AS total,
                    COALESCE(SUM(dv.subtotal), 0) AS total_bs,
                    v.pagado
                FROM ventas v
                LEFT JOIN clientes cl ON cl.id = v.id_cli
                LEFT JOIN detalles_ventas dv ON dv.id_venta = v.id
                GROUP BY v.id, cl.id, cl.nombre, v.fecha, v.pagado, v.tasa_bcv
            ) movimientos
            ORDER BY movimientos.fecha DESC, movimientos.tipo, movimientos.id DESC
            LIMIT $limite"
        );

        return $statement->fetchAll(PDO::FETCH_ASSOC);
    }

    private function decodeDetails(array $rows): array {
        foreach ($rows as &$row) {
            if (is_string($row['detalles'])) {
                $row['detalles'] = json_decode($row['detalles'], true, 512, JSON_THROW_ON_ERROR);
            }
        }
        unset($row);

        return $rows;
    }
}
