import db from '$lib/database/instance';
import { aql } from 'arangojs';
import njwt from 'njwt';
import HttpStatus from 'http-status-codes';
import { error } from '@sveltejs/kit';
import argon2 from 'argon2';
const {argon2id} = argon2;
import { key } from '$lib/server/secret';
import type { IUnsafeUser } from './shared';
import dayjs from 'dayjs';

export async function login(id: string, password: string): Promise<string> {
    const cursor = await db.query(aql`
    for user in users
        filter user.id == ${id}
            return user`);

    if (!cursor.hasNext) {
        throw error(HttpStatus.NOT_FOUND, 'User not found');
    }

    const user = await cursor.next() as IUnsafeUser;

    if (!await argon2.verify(user.password, password, {type: argon2id})) {
        throw error(HttpStatus.FORBIDDEN);
    }

    const jwt = njwt.create({
        iss: 'https://vrc.now.gd',
        sub: 'vrc',
        scope: 'login',
        id,
        uid: user._key,
        name: user.displayName,
        rank: user.rank,
    }, key);

    jwt.setExpiration(dayjs().add(1, 'year').toDate());

    return jwt.compact();
}

export function existsId(id: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
        // console.trace('user exists check:', this.id)
        db.query(aql`
          for user in users
            filter user.id == ${id}
              return user`)
          .then(async (r) => {
            // console.log(r)
            resolve(r.hasNext);
          })
          .catch(reject);
    });
}

export function exists(vrc: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      // console.trace('user exists check:', this.id)
      db.query(aql`
        for user in users
          filter user.vrc == ${vrc}
            return user`)
        .then(async (r) => {
          // console.log(r)
          resolve(r.hasNext);
        })
        .catch(reject);
    });
}

export function loadUserData(id: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
        if (!await exists(id)) {
          return reject('user not exists');
        }
  
        db.query(aql`
            for user in users
                filter user.id == ${id}
                return user`)
            .then(async (cursor) => {
                if (!cursor.hasNext) {
                    return reject('no user found');
                }
                resolve(await cursor.next());
            })
            .catch(reject);
    });
}

export async function verify(id: string, password: string): Promise<boolean> {
    try {
      const user = await loadUserData(id);
      return await argon2.verify(user.password, password);
    } catch (e) {
      console.error(e);
      return false;
    }
  }

const blacklist = [
    'admin',
    'api',
    'join',
    'login',
    'upload',
    'all',
    'settings',
]
export async function register(token: string, id: string, password: string) {
    const data = njwt.verify(token, key);

    if (!data) {
        throw error(HttpStatus.FORBIDDEN, 'Invalid token');
    }

    const regex = /^[a-zA-Z0-9ㄱ-ㅎ가-힣_]+$/;
    if (!regex.test(id)) {
      throw error(HttpStatus.BAD_REQUEST, 'Not allowed character found');
    }

    if (blacklist.includes(id)) {
        throw error(HttpStatus.FORBIDDEN, 'This account id is not allowed');
    }

    const {vrc, displayName} = data.body.toJSON() as {vrc: string, displayName: string};

    if (await exists(vrc)) {
        throw error(HttpStatus.CONFLICT, 'You signed up already');
    }

    if (await existsId(id)) {
        throw error(HttpStatus.CONFLICT, 'Account ID already exists');
    }

    const hashed = await argon2.hash(password, {type: argon2id});

    await db.query(aql`
        insert {
            id: ${id},
            password: ${hashed},
            createdAt: DATE_NOW(),
            vrc: ${vrc},
            name: ${displayName}
        } into users`);
}


export function newToken(uid: string, displayName: string) {
    const jwt = njwt.create({
        vrc: uid,
        displayName,
    }, key);


    jwt.setExpiration(dayjs().add(1, 'day').toDate());

    // console.log(jwt.compact())
    return jwt.compact();
}
