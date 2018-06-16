#!/usr/bin/env node
/*!
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
'use strict';

import * as http from 'http';
import * as path from 'path';

import * as debugBuilder from 'debug';
import * as httpError from 'http-errors';

import * as express from 'express';
import * as favicon from 'serve-favicon';
import * as logger from 'morgan';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as expressSession from 'express-session';

import * as passport from 'passport';
// import { Strategy as OAuth2Strategy, VerifyCallback } from 'passport-oauth2';
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy; // tslint:disable-line

import { Sequelize } from 'sequelize-typescript';

import { doConfig } from './lib/Config';

// Define Paths
const jsRoot = __dirname;
const modelsRoot = path.join(jsRoot, 'models');
const routesRoot = path.join(jsRoot, 'routes');
const publicJsRoot = path.join(jsRoot, 'public');
const serverRoot = path.join(jsRoot, '..');
const publicRoot = path.join(serverRoot, 'public');
const viewsRoot = path.join(serverRoot, 'views');

// Setup debug
const debugWeb = debugBuilder('web');
const debugDb = debugBuilder('db');

// Get the Config
const options = doConfig();

/**
 * Setup Passport
 */
passport.serializeUser((user: IUser, done) => {
    done(null, user.oid);
});
passport.deserializeUser(findByOid);

/** a user */
interface IUser {
    oid: string;
}

// Map to hold logged in users
// TODO: Replace with database
const users = new Map<string, IUser>();

/** finds a user by their id */
function findByOid(oid: string, fn: (err?: Error, user?: IUser) => void) {
    const user = users.get(oid);
    console.log(user);
    fn(void 0, user);
}

passport.use( new OIDCStrategy({ // tslint:disable-line
        identityMetadata: 'https://login.microsoftonline.com/common/.well-known/openid-configuration',
        clientID: options["azure-v2-openid"].clientID,
        responseType: "code id_token",
        responseMode: "form_post",
        redirectUrl: 'http://localhost:8080/auth/openid/return',
        passReqToCallback: false,
        allowHttpForRedirectUrl: true,
        clientSecret: options["azure-v2-openid"].clientSecret,
        // thumbprint: null,
        // privatePEMKey: null,
        // isB2C: false,
        validateIssuer: false, // Don't validate since we're allowing other organizations to connect to the app
        issuer: null,
        // jweKeyStore: null,
        // useCookieInsteadOfSession: false,
        scope: ['profile'],
        loggingLevel: 'info',
        loggingNoPII: true,
        nonceLifetime: null,
        nonceMaxAmount: 5,
        clockSkew: null
    },
    (iss: string, sub: string, profile: IUser, jwtClaims: {}, accessToken: string, refreshToken: string, params: {}, done: (err?: Error, user?: IUser) => void) => {

        // TODO: Figure out what to du with auth tokens/etc

        console.log("iis: ", iss);
        console.log("sub: ", sub);
        console.log("profile: ", profile);
        console.log("jwtClaims: ", jwtClaims);
        console.log("accessToken: ", accessToken);
        console.log("refreshToken: ", refreshToken);
        console.log("params: ", params);

        if (!profile.oid) {
            done(new Error("No oid found"), void 0);
        }
        else {
            findByOid(profile.oid, (err?: Error, user?: IUser) => {
                if(err) {
                    done(err);
                }
                else {
                    if (!user) {
                        users.set(profile.oid, profile);
                        done(void 0, profile);
                    }
                    else {
                        done(void 0, user);
                    }
                }
            });
        }
    }
));

/**
 * Setup Express
 */

const app = express();

/** Returns if the app is in development mode or not. */
function isDevelopment() {
    return app.get('env') === 'development';
}

// Pug View Rendering
app.set('views', viewsRoot);
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
app.use(express.static(publicJsRoot));
app.use(express.static(publicRoot));

// Setup express sessions
app.use(expressSession({
    secret: options.web.sessionSecret
}));

// Passport Auth
app.use(passport.initialize());
app.use(passport.session() as express.RequestHandler);

const authOptions = { successRedirect: '/', failureRedirect: '/', resourceURL: 'https://management.core.windows.net/' };
app.get('/login', passport.authenticate('azuread-openidconnect', authOptions as passport.AuthenticateOptions) as express.RequestHandler);
app.post('/auth/openid/return', passport.authenticate('azuread-openidconnect', { successRedirect: '/', failureRedirect: '/' }) as express.RequestHandler);
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

// Dynamic Content
const setupRoute = (route: string, location: string) => app.use(route, require(path.join(routesRoot, location)) as express.Router);

setupRoute('/', 'index');

// Everything else is a 404
app.use((req, res, next) => next(new httpError.NotFound()));

// Serve Error Page
app.use((err: Error | httpError.HttpError, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const errHttp = err instanceof httpError.HttpError ? err :  httpError(err);
    errHttp.expose = isDevelopment();
    res.status(errHttp.status);
    res.render('error', { error: errHttp });
});

/**
 * Setup Sequelize
 */

const sequelize = new Sequelize({
    // Basic Config
    logging: debugDb,
    modelPaths: [modelsRoot],
    operatorsAliases: false,

    // Default DB
    database: 'website',
    dialect: 'sqlite',
    username: 'root',
    password: '',
    storage: ':memory:',

    // User Config
    ...options.db
});

if(isDevelopment()) {
    sequelize.sync({ force: true });
}
else {
    sequelize.sync();
}

/**
 * Create HTTP server.
 */
const DEFAULT_WEB_PORT = 8080;
options.web.port = options.web.port || DEFAULT_WEB_PORT;
app.set('port', options.web.port);

http.createServer(app)
    .listen(options.web.port)
    .on('error', (error: NodeJS.ErrnoException) => {
        if(error.syscall !== 'listen') {
            throw error;
        }

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error(`Port ${options.web.port} requires elevated privileges`);
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(`Port ${options.web.port} is already in use`);
                process.exit(1);
                break;
            default:
                throw error;
        }
    })
    .on('listening', () => {
        debugWeb(`Listening on ${options.web.port}`);
    });
