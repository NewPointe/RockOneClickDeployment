#!/usr/bin/env node
'use strict';

/**
 * Imports
 */

// Built-ins
import * as path from 'path';

// Http Server
import { createServer } from 'http';
import * as express from 'express';

// Middleware
import * as favicon from 'serve-favicon';
import * as logger from 'morgan';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as debugBuilder from 'debug';
import { Sequelize } from 'sequelize-typescript';

// Custom Imports
import { HttpError } from './common/HttpError';
import { IServerConfig } from './common/IServerConfig';

/**
 * Begin Setup
 */

// Create Logging Functions
const debugServer = debugBuilder('ninja:server');
const debugDB = debugBuilder('ninja:db');

// Load Server Config
// tslint:disable-next-line:no-var-requires
const config = require('../config.json') as IServerConfig;

// Define Paths
const serverRoot = path.join(__dirname, '..');
const publicRoot = path.join(serverRoot, 'public');

/**
 * Setup Express
 */

// Create Express App
const app = express();

// Pug View Rendering
app.set('views', path.join(serverRoot, 'views'));
app.set('view engine', 'pug');

// Request Logging
app.use(logger('dev'));

// Favicon Caching
app.use(favicon(path.join(publicRoot, 'favicon.ico')));

// Request Body Parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Cookie Parsing
app.use(cookieParser());

// Static Content
app.use(express.static(publicRoot));

// Dynamic Content
// TODO: Set up routes

// Everything else is a 404
app.use((req, res, next: express.NextFunction) => next(new HttpError()));

// Serve Error Page
app.use((err: HttpError, req: express.Request, res: express.Response, next: express.NextFunction) => {
    // set locals, only providing error in development
    res.locals["message"] = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

/**
 * Setup Sequelize
 */

const sequelize = new Sequelize({
    // Basic Config
    logging: debugDB,
    modelPaths: [path.join(__dirname, 'models')],
    operatorsAliases: false,

    // Default DB
    database: 'theninja',
    dialect: 'sqlite',
    password: '',
    storage: ':memory:',
    username: 'root',

    // User Config
    ...config.db
});

if (app.get('env') === 'development') {
    sequelize.sync({ force: true });
}
else {
    sequelize.sync();
}

/**
 * Create HTTP server.
 */

const serverPort = config.server.port || 8080;

app.set('port', serverPort);

const server = createServer(app)
    .listen(serverPort)
    .on('error', (error: NodeJS.ErrnoException) => {
        if (error.syscall !== 'listen') {
            throw error;
        }

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error(`Port ${serverPort} requires elevated privileges`);
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(`Port ${serverPort} is already in use`);
                process.exit(1);
                break;
            default:
                throw error;
        }
    })
    .on('listening', () => {
        debugServer(`Listening on ${server.address().port}`);
    });
