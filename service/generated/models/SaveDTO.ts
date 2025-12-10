/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SaveDTO = {
    name?: string;
    nickName?: string;
    loginId?: string;
    password?: string;
    rePassword?: string;
    phoneNumber?: string;
    gender?: SaveDTO.gender;
    birth?: string;
    date?: string;
    addressNumber?: string;
    address?: string;
    addressDetail?: string;
    agreedTermsIds?: Array<number>;
    birthDate?: string;
};
export namespace SaveDTO {
    export enum gender {
        MALE = 'MALE',
        FEMALE = 'FEMALE',
    }
}

