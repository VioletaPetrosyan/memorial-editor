<?php

use Illuminate\Support\Facades\Route;

// The Vue SPA owns these paths; Vue Router resolves the rest client-side.
Route::view('/', 'app');
Route::view('/memorials/{path?}', 'app')->where('path', '.*');
