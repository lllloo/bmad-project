<?php

/**
 * W0 Spike — API routes
 *
 * 注意：Laravel 12 不預設建立 routes/api.php（會透過 `php artisan install:api` 帶入，但會夾 Sanctum
 * 因此 spike 階段手動建立此檔並於 bootstrap/app.php 註冊，避免與 ADR 0002 衝突。
 *
 * 本檔的 endpoints 全部是 spike-only：
 *  - POST /api/auth/login           — 真的 endpoint，但 Domain/Auth 結構待 Story 1.2 重構
 *  - POST /api/auth/refresh-spike   — stub，Story 2.1 會替換為真 rotation 的 /api/auth/refresh
 *  - GET  /api/me-spike             — spike 用，Story 1.2 重構入 Member endpoints
 *
 * 命名後綴 `-spike` 故意製造視覺信號，Story 1.2 grep 即可找出並刪除。
 */

use App\Http\Controllers\AuthSpikeController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthSpikeController::class, 'login']);
Route::post('/auth/refresh-spike', [AuthSpikeController::class, 'refreshSpike']);

Route::middleware('auth:api')->group(function (): void {
    Route::get('/me-spike', fn (Request $request) => $request->user());
});
