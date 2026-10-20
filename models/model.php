<?php
interface Model {
    public function get(int $id);
    public function getAll();
    public function create(array $data);
    public function update(int $id, array $data);
    public function delete(int $id);
}