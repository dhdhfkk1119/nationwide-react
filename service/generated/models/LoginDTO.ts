/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type LoginDTO = {
    loginId?: string;
    password?: string;
    autoLogin?: boolean;
    provider?: LoginDTO.provider;
};
export namespace LoginDTO {
    export enum provider {
        LOCAL = 'LOCAL',
        GOOGLE = 'GOOGLE',
        NAVER = 'NAVER',
    }
}

