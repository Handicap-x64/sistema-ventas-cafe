<?php
class ValidationException extends Exception {
    public function __construct(string $mensaje = "Error de validacion", ?Throwable $previo = null) {
        parent::__construct($mensaje, 400, $previo);
    }
}

class ConflictoException extends Exception {
    public function __construct(string $mensaje = "Error por conflicto", ?Throwable $previo = null) {
        parent::__construct($mensaje, 500, $previo);
    }
}