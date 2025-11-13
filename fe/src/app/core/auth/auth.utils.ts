// -----------------------------------------------------------------------------------------------------
// @ AUTH UTILITIES
//
// Methods are derivations of the Auth0 Angular-JWT helper service methods
// https://github.com/auth0/angular2-jwt
// -----------------------------------------------------------------------------------------------------

import { AbstractControl, ValidationErrors } from '@angular/forms';

export class AuthUtils {
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Is token expired?
     *
     * @param token
     * @param offsetSeconds
     */
    static isTokenExpired(token: string, offsetSeconds?: number): boolean {
        // Return if there is no token
        if (!token || token === '') {
            return true;
        }

        // Get the expiration date
        const date = this._getTokenExpirationDate(token);

        offsetSeconds = offsetSeconds || 0;
        console.log("Thoi gian exp token: ", date)
        if (date === null) {
            return true;
        }

        // Check if the token is expired
        return !(date.valueOf() > new Date().valueOf() + offsetSeconds * 1000);
    }

    static decodeTokenTimestamp(token: string): any {
        if (!token) return null;

        const ts_b36 = token.split('-')[0];
        const ts_seconds = parseInt(ts_b36, 36);
        const djangoEpoch = new Date(Date.UTC(2001, 0, 1));
        const tokenDateUTC = new Date(
            djangoEpoch.getTime() + ts_seconds * 1000
        );

        const tokenDate = new Date(tokenDateUTC.getTime() + 1800 * 1000);

        return tokenDate;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Base64 decoder
     * Credits: https://github.com/atk
     *
     * @param str
     * @private
     */
    private static _b64decode(str: string): string {
        const chars =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let output = '';

        str = String(str).replace(/=+$/, '');

        if (str.length % 4 === 1) {
            throw new Error(
                "'atob' failed: The string to be decoded is not correctly encoded."
            );
        }

        /* eslint-disable */
        for (
            // initialize result and counters
            let bc = 0, bs: any, buffer: any, idx = 0;
            // get next character
            (buffer = str.charAt(idx++));
            // character found in table? initialize bit storage and add its ascii value;
            ~buffer &&
            ((bs = bc % 4 ? bs * 64 + buffer : buffer),
            // and if not first of each 4 characters,
            // convert the first 8 bits to one ascii character
            bc++ % 4)
                ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
                : 0
        ) {
            // try to find character in table (0-63, not found => -1)
            buffer = chars.indexOf(buffer);
        }
        /* eslint-enable */

        return output;
    }

    /**
     * Base64 unicode decoder
     *
     * @param str
     * @private
     */
    private static _b64DecodeUnicode(str: any): string {
        return decodeURIComponent(
            Array.prototype.map
                .call(
                    this._b64decode(str),
                    (c: any) =>
                        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
                )
                .join('')
        );
    }

    /**
     * URL Base 64 decoder
     *
     * @param str
     * @private
     */
    private static _urlBase64Decode(str: string): string {
        let output = str.replace(/-/g, '+').replace(/_/g, '/');
        switch (output.length % 4) {
            case 0: {
                break;
            }
            case 2: {
                output += '==';
                break;
            }
            case 3: {
                output += '=';
                break;
            }
            default: {
                throw Error('Illegal base64url string!');
            }
        }
        return this._b64DecodeUnicode(output);
    }

    /**
     * Decode token
     *
     * @param token
     * @private
     */
    private static _decodeToken(token: string): any {
        // Return if there is no token
        if (!token) {
            return null;
        }

        // Split the token
        const parts = token.split('.');

        if (parts.length !== 3) {
            throw new Error(
                "The inspected token doesn't appear to be a JWT. Check to make sure it has three parts and see https://jwt.io for more."
            );
        }

        // Decode the token using the Base64 decoder
        const decoded = this._urlBase64Decode(parts[1]);

        if (!decoded) {
            throw new Error('Cannot decode the token.');
        }

        return JSON.parse(decoded);
    }

    /**
     * Get token expiration date
     *
     * @param token
     * @private
     */
    private static _getTokenExpirationDate(token: string): Date | null {
        // Get the decoded token
        const decodedToken = this._decodeToken(token);

        // Return if the decodedToken doesn't have an 'exp' field
        if (!decodedToken.hasOwnProperty('exp')) {
            return null;
        }

        // Convert the expiration date
        const date = new Date(0);
        date.setUTCSeconds(decodedToken.exp);

        return date;
    }
    /**
     * email validate
     *
     * @param token
     * @private
     */
    static emailValidator(control: AbstractControl): ValidationErrors | null {
        const value = control.value;
        if (!value) return null;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,4}$/;
        return emailRegex.test(value) ? null : { email: true };
    }

    // Custom validator
    static phoneValidator(): ValidationErrors | null {
        return (control: AbstractControl): ValidationErrors | null => {
            const phone = control.value;
            if (!phone) return null;

            // Regex: Bắt đầu bằng 0, tiếp theo là 2|3|5|7|8|9 và 8 số còn lại (chỉ số, không ký tự)
            const validPhoneRegex = /^(0(2|3|5|7|8|9)[0-9]{8})$/;

            return validPhoneRegex.test(phone) ? null : { invalidPhone: true };
        };
    }

    /**
     * Validate birthdate
     */
    static birthDateValidator(): (
        control: AbstractControl
    ) => ValidationErrors | null {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = control.value;

            if (!value) return null;

            const birthDate = new Date(value);
            const today = new Date();

            if (birthDate >= today) {
                return { invalidBirthDate: true };
            }

            return null;
        };
    }
}
