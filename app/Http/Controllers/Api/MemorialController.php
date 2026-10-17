<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ListMemorialsRequest;
use App\Http\Requests\StoreMemorialRequest;
use App\Http\Requests\UpdateMemorialRequest;
use App\Http\Resources\MemorialResource;
use App\Models\Memorial;
use App\Services\MemorialService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/**
 * HTTP only: validation happens in the form requests, the work in MemorialService,
 * and the JSON shape in MemorialResource.
 */
class MemorialController extends Controller
{
    public function __construct(
        private readonly MemorialService $memorials,
    ) {}

    public function index(ListMemorialsRequest $request): AnonymousResourceCollection
    {
        return MemorialResource::collection($this->memorials->paginate($request->perPage()));
    }

    public function show(Memorial $memorial): MemorialResource
    {
        return MemorialResource::make($memorial);
    }

    public function store(StoreMemorialRequest $request): JsonResponse
    {
        $memorial = $this->memorials->create($request->toData());

        return MemorialResource::make($memorial)
            ->response()
            ->setStatusCode(Response::HTTP_CREATED)
            ->header('Location', route('memorials.show', $memorial));
    }

    public function update(UpdateMemorialRequest $request, Memorial $memorial): MemorialResource
    {
        $memorial = $this->memorials->update($memorial, $request->toData());

        return MemorialResource::make($memorial);
    }

    public function destroy(Memorial $memorial): Response
    {
        $this->memorials->delete($memorial);

        return response()->noContent();
    }
}
