/*!
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
'use strict';

import { Table, Column, Model, AllowNull, Unique } from 'sequelize-typescript';

/**
 * A User
 * @export
 * @class User
 * @extends {Model<User>}
 */
@Table({
    timestamps: true
})
export class User extends Model<User> {

    /**
     * The user's unique identifier
     */
    @AllowNull(false)
    @Unique
    @Column
    public identifier!: string;

    /**
     * The user's displayName
     */
    @AllowNull(false)
    @Column
    public displayName!: string;

    /**
     * The user's first name
     */
    @AllowNull(false)
    @Column
    public firstName!: string;

    /**
     * The user's last name
     */
    @AllowNull(false)
    @Column
    public lastName!: string;

    /**
     * The user's azure management auth token
     */
    @AllowNull(false)
    @Column
    public azureAuthToken!: string;

    /**
     * The user's azure management refresh token
     */
    @AllowNull(false)
    @Column
    public azureRefreshToken!: string;

}
