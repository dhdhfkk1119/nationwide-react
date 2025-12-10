/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LoginDTO } from '../models/LoginDTO';
import type { SaveDTO } from '../models/SaveDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MemberControllerService {
    /**
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static saveMember(
        requestBody: SaveDTO,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/member/save',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static loginMember(
        requestBody: LoginDTO,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/member/login',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param email
     * @returns any OK
     * @throws ApiError
     */
    public static checkEmail(
        email: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/member/check-email/{email}',
            path: {
                'email': email,
            },
        });
    }
}
