<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('memorials', function (Blueprint $table) {
            $table->id();
            $table->string('first_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('last_name', 100);
            $table->string('website_url', 2048)->nullable();
            // Enums are stored as strings and enforced in PHP (App\Enums), so adding
            // an option doesn't need a schema change and works the same on every driver.
            $table->string('gender', 32)->nullable();
            $table->string('relationship', 32)->nullable();
            $table->string('designation', 100)->nullable();
            $table->string('country', 100)->nullable();
            $table->date('birth_date')->nullable();
            $table->date('passing_date')->nullable();
            $table->boolean('published')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('memorials');
    }
};
