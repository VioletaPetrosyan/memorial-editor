<?php

namespace App\Services;

use App\DTO\MemorialData;
use App\Models\Memorial;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Memorial operations used by the API. Business rules that go beyond validation
 * (notifications, audit log, ownership, etc.) belong here, not in the controller.
 */
class MemorialService
{
    /**
     * Oldest first, so the first memorial is the one that has existed longest.
     *
     * @return LengthAwarePaginator<int, Memorial>
     */
    public function paginate(int $perPage): LengthAwarePaginator
    {
        return Memorial::query()->oldest('id')->paginate($perPage);
    }

    public function create(MemorialData $data): Memorial
    {
        return Memorial::query()->create($data->toArray());
    }

    public function update(Memorial $memorial, MemorialData $data): Memorial
    {
        $memorial->update($data->toArray());

        return $memorial;
    }

    public function delete(Memorial $memorial): void
    {
        $memorial->delete();
    }
}
