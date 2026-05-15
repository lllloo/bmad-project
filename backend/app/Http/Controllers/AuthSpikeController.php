<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

/**
 * W0 Spike — throwaway auth controller for verifying JWT bearer flow.
 *
 * 故意**不**放 app/Domain/Auth/，視覺信號這是 spike code，Story 1.2 重構搬入。
 * 故意**不**寫 FormRequest（spike 用 Request validate），Story 1.2 重構補 LoginRequest。
 * 故意**不**寫 service / action / repository（spike 直接 controller 跑），Story 1.2 重構分層。
 */
class AuthSpikeController extends Controller
{
    /**
     * POST /api/auth/login
     *
     * spike 流程：
     * 1. validate email + password
     * 2. Auth::guard('api')->attempt() 用 JWT guard 驗證
     * 3. 成功回 200 + access_token + token_type + expires_in
     * 4. 失敗回 401
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $token = Auth::guard('api')->attempt($credentials);

        if (! $token) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        return $this->tokenResponse($token);
    }

    /**
     * POST /api/auth/refresh-spike
     *
     * **SPIKE-ONLY STUB**：
     *  - 真的 refresh rotation + jti blacklist 在 Story 2.1 實作
     *  - 本 endpoint 在 Story 2.1 會被 `/api/auth/refresh` 取代並刪除
     *  - W0 只驗證「axios 401 interceptor 能正確流向 refresh 並 retry」這個概念
     *
     * 行為：拿目前的（過期）token，呼叫 JWTAuth::refresh() 換新 token 回傳。
     * 並未做 jti blacklist，所以舊 token 在 TTL 內仍可重用（這是 spike 容忍的不安全狀態）。
     */
    public function refreshSpike(Request $request): JsonResponse
    {
        try {
            $newToken = JWTAuth::parseToken()->refresh();
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'spike refresh failed',
                'error' => $e->getMessage(),
            ], 401);
        }

        return $this->tokenResponse($newToken);
    }

    private function tokenResponse(string $token): JsonResponse
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => Auth::guard('api')->factory()->getTTL() * 60,
        ]);
    }
}
