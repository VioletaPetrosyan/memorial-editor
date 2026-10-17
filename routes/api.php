<?php

use App\Http\Controllers\Api\MemorialController;
use Illuminate\Support\Facades\Route;

Route::apiResource('memorials', MemorialController::class)
    ->only(['index', 'store', 'show', 'update', 'destroy']);
