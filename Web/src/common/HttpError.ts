'use strict';

/**
 * A basic Http Error class.
 * @export
 * @class HttpError
 * @extends {Error}
 */
export class HttpError extends Error {
    public status: number;
    constructor(message: string = "Not Found", code: number = 404) {
        super(message);
        this.status = code;
    }
}
