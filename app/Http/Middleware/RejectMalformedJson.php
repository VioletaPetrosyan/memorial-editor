<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Laravel reads a JSON body it can't parse as empty input, which would come back as
 * misleading "field is required" errors. Answer 400 Bad Request instead.
 */
class RejectMalformedJson
{
    public function handle(Request $request, Closure $next): Response
    {
        $body = $request->getContent();

        if ($request->isJson() && $body !== '' && ! json_validate($body)) {
            throw new BadRequestHttpException('The request body is not valid JSON.');
        }

        return $next($request);
    }
}
