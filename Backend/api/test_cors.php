<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

$response = [
    "status" => "success",
    "message" => "CORS is working correctly!",
    "method" => $_SERVER['REQUEST_METHOD'],
    "origin" => $_SERVER['HTTP_ORIGIN'] ?? 'No origin set',
    "time" => date('Y-m-d H:i:s')
];

echo json_encode($response);
