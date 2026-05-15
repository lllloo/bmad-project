<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        // W0 spike — 手動註冊 api routes（不走 install:api，避免帶 Sanctum）
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // W0 spike — API-only，無 web `login` route，需告訴 Authenticate middleware
        // 對 JSON / api/* 請求**不要**嘗試 redirect，讓 AuthenticationException 自然拋出
        // 然後由 withExceptions 的 render callback 統一回 JSON 401
        $middleware->redirectGuestsTo(function (Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return null;
            }
            return null; // spike 階段乾脆全部不 redirect；正式版若需要 web login 再加 route('login')
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // W0 spike — 把 unauthenticated 從 500 fallback 改回 JSON 401
        // （Laravel 12 預設假設有 web /login route 才會 redirect，API-only 場景需手動）
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
            return null;
        });
    })->create();
