<?php
require_once __DIR__ . '/../Errors/exceptions.php';
require_once __DIR__ . '/../models/model.php';
require_once __DIR__ . '/../models/clientes.php';
require_once __DIR__ . '/../models/proveedores.php';

class Validate {
    public function __construct(private PDO $pdo) {}

    public function nueva_venta(array $venta, array $detalles) {
        if (empty($venta)) {
            throw new ValidationException("Faltan datos obligatorios para crear la venta");
        }

        if (!isset($venta['id_cli']) || empty($venta['id_cli'])) {
            throw new ValidationException("El cliente es obligatorio");
        }
        if (!isset($venta['fecha']) || empty($venta['fecha'])) {
            throw new ValidationException("La fecha es obligatoria");
        }
        if (!isset($venta['tasa_bcv']) || $venta['tasa_bcv'] === '' || $venta['tasa_bcv'] === null) {
            throw new ValidationException("La tasa BCV es obligatoria");
        }
        if (!array_key_exists('pagado', $venta)) {
            throw new ValidationException("El estado de pago es obligatorio");
        }

        if (!is_numeric($venta['id_cli'])) {
            throw new ValidationException("El id del cliente debe ser numérico");
        }

        $fecha = DateTime::createFromFormat('Y-m-d', $venta['fecha']);
        if (!$fecha || $fecha->format('Y-m-d') !== $venta['fecha']) {
            throw new ValidationException("Formato de fecha inválido (ej: Y-m-d)");
        }

        if (!is_numeric($venta['tasa_bcv']) || (float)$venta['tasa_bcv'] <= 0) {
            throw new ValidationException("La tasa BCV debe ser un valor numérico mayor a 0");
        }

        if (!is_bool($venta['pagado']) && $venta['pagado'] !== 0 && $venta['pagado'] !== 1 && $venta['pagado'] !== '0' && $venta['pagado'] !== '1') {
            throw new ValidationException("El campo pagado debe ser booleano");
        }

        $cli_model = new ClientesModel($this->pdo);
        $cliente = $cli_model->get((int)$venta['id_cli']);
        if (!$cliente) {
            throw new ValidationException("El cliente no existe");
        }
        if (isset($cliente['activo'])) {
            $activo = $cliente['activo'];
            if (is_string($activo)) {
                $activo = strtolower($activo) === 'true' || $activo === '1';
            } else {
                $activo = (bool)$activo;
            }
            if (!$activo) {
                throw new ValidationException("El cliente debe estar activo para realizar una venta");
            }
        }

        if (empty($detalles) || !is_array($detalles)) {
            throw new ValidationException("La venta debe tener al menos un detalle");
        }

        $productos_validos = ['SUAVE', 'NORMAL', 'FUERTE'];
        foreach ($detalles as $d) {
            if (!isset($d['producto']) || empty($d['producto'])) {
                throw new ValidationException("El producto es obligatorio en los detalles");
            }
            if (!in_array($d['producto'], $productos_validos, true)) {
                throw new ValidationException("Producto inválido. Debe ser SUAVE, NORMAL o FUERTE");
            }
            if (!isset($d['cantidad_kg']) || $d['cantidad_kg'] === '' || $d['cantidad_kg'] === null) {
                throw new ValidationException("La cantidad en kg es obligatoria");
            }
            if (!isset($d['precio_bs']) || $d['precio_bs'] === '' || $d['precio_bs'] === null) {
                throw new ValidationException("El precio en bs es obligatorio");
            }
            if (!is_numeric($d['cantidad_kg']) || (float)$d['cantidad_kg'] <= 0) {
                throw new ValidationException("La cantidad en kg debe ser mayor a 0");
            }
            if (!is_numeric($d['precio_bs']) || (float)$d['precio_bs'] <= 0) {
                throw new ValidationException("El precio en bs debe ser mayor a 0");
            }
        }
    }

    public function nueva_compra(array $compra, array $detalles) {
        if (empty($compra)) {
            throw new ValidationException("Faltan datos obligatorios para crear la compra");
        }

        if (!isset($compra['id_prov']) || empty($compra['id_prov'])) {
            throw new ValidationException("El proveedor es obligatorio");
        }
        if (!isset($compra['fecha']) || empty($compra['fecha'])) {
            throw new ValidationException("La fecha es obligatoria");
        }
        if (!array_key_exists('pagado', $compra)) {
            throw new ValidationException("El estado de pago es obligatorio");
        }

        if (!is_numeric($compra['id_prov'])) {
            throw new ValidationException("El id del proveedor debe ser numérico");
        }

        $fecha = DateTime::createFromFormat('Y-m-d', $compra['fecha']);
        if (!$fecha || $fecha->format('Y-m-d') !== $compra['fecha']) {
            throw new ValidationException("Formato de fecha inválido (ej: Y-m-d)");
        }

        if (!is_bool($compra['pagado']) && $compra['pagado'] !== 0 && $compra['pagado'] !== 1 && $compra['pagado'] !== '0' && $compra['pagado'] !== '1') {
            throw new ValidationException("El campo pagado debe ser booleano");
        }

        $prov_model = new ProvModel($this->pdo);
        $proveedor = $prov_model->get((int)$compra['id_prov']);
        if (!$proveedor) {
            throw new ValidationException("El proveedor no existe");
        }
        if (isset($proveedor['activo'])) {
            $activo = $proveedor['activo'];
            if (is_string($activo)) {
                $activo = strtolower($activo) === 'true' || $activo === '1';
            } else {
                $activo = (bool)$activo;
            }
            if (!$activo) {
                throw new ValidationException("El proveedor debe estar activo para realizar una compra");
            }
        }

        if (empty($detalles) || !is_array($detalles)) {
            throw new ValidationException("La compra debe tener al menos un detalle");
        }

        $productos_validos = ['SUAVE', 'NORMAL', 'FUERTE'];
        foreach ($detalles as $d) {
            if (!isset($d['producto']) || empty($d['producto'])) {
                throw new ValidationException("El producto es obligatorio en los detalles");
            }
            if (!in_array($d['producto'], $productos_validos, true)) {
                throw new ValidationException("Producto inválido. Debe ser SUAVE, NORMAL o FUERTE");
            }
            if (!isset($d['cantidad_kg']) || $d['cantidad_kg'] === '' || $d['cantidad_kg'] === null) {
                throw new ValidationException("La cantidad en kg es obligatoria");
            }
            if (!isset($d['precio']) || $d['precio'] === '' || $d['precio'] === null) {
                throw new ValidationException("El precio es obligatorio");
            }
            if (!is_numeric($d['cantidad_kg']) || (float)$d['cantidad_kg'] <= 0) {
                throw new ValidationException("La cantidad en kg debe ser mayor a 0");
            }
            if (!is_numeric($d['precio']) || (float)$d['precio'] <= 0) {
                throw new ValidationException("El precio debe ser mayor a 0");
            }
        }
    }

    public function nuevo_cli_prov(string $nombre, string $rif, string  $nombre_con, string $cedula_con, string $telefono_con, string $email_con,  bool $activo) {
        if (empty($nombre) || empty($rif) || empty($nombre_con) || empty($cedula_con) || empty($telefono_con) || empty($email_con)) {
            throw new ValidationException("Faltan datos obligatorios para crear el cliente o proveedor");
        }

        if (!preg_match('/^[J]-\d{8,9}$/', $rif)) throw new ValidationException("Formato de RIF inválido (ej: J-123456789)");

        if (!preg_match('/^[VE]-\d{7,8}$/', $cedula_con)) throw new ValidationException("Formato de cedula inválido (ej: V-12345678)");

        if (!filter_var($email_con, FILTER_VALIDATE_EMAIL)) throw new ValidationException("Formato de orreo electronico invalido (ej: correo@ejemplo.com)");


        $cli_model = new ClientesModel($this->pdo);
        $prov_model = new ProvModel($this->pdo);
            $clientes = $cli_model->getAll();
            $proveedores = $prov_model->getAll();
            $data = array_merge($clientes, $proveedores);
        
        if ($data) {
            foreach ($data as $d) {
                if ($d['rif'] === $rif) throw new ValidationException("Ya existe un cliente o proveedor con el mismo RIF");
                if ($d['cedula_con'] === $cedula_con) throw new ValidationException("Ya existe un cliente o proveedor con la misma cédula del contacto");
                if ($d['email_con'] === $email_con) throw new ValidationException("Ya existe un cliente o proveedor con el mismo correo electronico del contacto");
            }
        }
    }

    public function actualizar_cli_prov(int $id, string $entidad, string $nombre, string $rif, string  $nombre_con, string $cedula_con, string $telefono_con, string $email_con,  bool $activo) {
        if (empty($nombre) || empty($rif) || empty($nombre_con) || empty($cedula_con) || empty($telefono_con) || empty($email_con)) {
            throw new ValidationException("Faltan datos obligatorios para actualizar el cliente o proveedor");
        }

        if (!in_array($entidad, ['cliente', 'proveedor'], true)) {
            throw new ValidationException("Tipo de entidad inválido");
        }

        if (!preg_match('/^[J]-\d{8,9}$/', $rif)) throw new ValidationException("Formato de RIF inválido (ej: J-123456789)");

        if (!preg_match('/^[VE]-\d{7,8}$/', $cedula_con)) throw new ValidationException("Formato de cedula inválido (ej: V-12345678)");

        if (!filter_var($email_con, FILTER_VALIDATE_EMAIL)) throw new ValidationException("Formato de orreo electronico invalido (ej: correo@ejemplo.com)");
        
        $cli_model = new ClientesModel($this->pdo);
        $prov_model = new ProvModel($this->pdo);
        $clientes = $cli_model->getAll();
        $proveedores = $prov_model->getAll();

        foreach ([
            ['cliente', $clientes],
            ['proveedor', $proveedores]
        ] as [$tipo, $registros]) {
            foreach ($registros ?? [] as $registro) {
                if ($tipo === $entidad && (int) $registro['id'] === $id) {
                    continue;
                }

                if ($registro['rif'] === $rif) {
                    throw new ValidationException("Ya existe un cliente o proveedor con el mismo RIF");
                }
                if ($registro['cedula_con'] === $cedula_con) {
                    throw new ValidationException("Ya existe un cliente o proveedor con la misma cédula del contacto");
                }
                if ($registro['email_con'] === $email_con) {
                    throw new ValidationException("Ya existe un cliente o proveedor con el mismo correo electronico del contacto");
                }
            }
        }
    }

    public function no_encontrado(int $id) {
        $cli_model = new ClientesModel($this->pdo);
        $prov_model = new ProvModel($this->pdo);
        $d = $cli_model->get($id) ?: $prov_model->get($id);
        if (!$d) throw new ValidationException("No se ha encontrado al cliente o proveedor solicitado");
    }
}