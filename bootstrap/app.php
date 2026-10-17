<?php

use App\Http\Middleware\RejectMalformedJson;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Rate limit the API (the "api" limiter is defined in AppServiceProvider).
        $middleware->throttleApi();
        $middleware->api(append: [RejectMalformedJson::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // API errors are always JSON: { "message": "...", "errors"?: { field: [...] } }.
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // The default 404 message leaks the model class ("No query results for model [App\Models\Memorial] 1").
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            $previous = $e->getPrevious();
            $message = $previous instanceof ModelNotFoundException
                ? class_basename($previous->getModel()).' not found.'
                : 'Not found.';

            return response()->json(['message' => $message], 404);
        });
    })->create();
