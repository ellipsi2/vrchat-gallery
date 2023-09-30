import type { IArangoDocumentIdentifier } from '$lib/database';

export interface IUser extends IArangoDocumentIdentifier {
    id: string;
    displayName: string;
    vrc: string;
    rank: number;
}

export interface IUnsafeUser extends IUser {
    password: string;
}