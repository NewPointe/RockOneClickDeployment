/*!
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
'use strict';

import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

/* GET home page. */
router.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.render('index', { user: req.user });
});

export = router;
