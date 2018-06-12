'use strict';

import { ISequelizeConfig } from 'sequelize-typescript';

/**
 * The interface for the server's config.json file
 * @export
 * @interface IServerConfig
 */
export interface IServerConfig {
    server: {
        port: number
    },
    db: ISequelizeConfig
}
