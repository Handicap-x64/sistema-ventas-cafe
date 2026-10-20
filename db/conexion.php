<?php
require_once __DIR__ . "/../config.php";

$dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $user, $pass);
    return $pdo;
} catch (PDOException $e) {
    echo $e->getMessage();
    exit;
}


