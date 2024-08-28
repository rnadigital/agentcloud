'use strict';

export enum OAUTH_PROVIDER {
	GOOGLE = 'google',
	GITHUB = 'github'
}

export type OAuthStrategy = {
	strategy: any;
	callback: Function;
	secretKeys: {
		clientId: string;
		secret: string;
	};
	path: string;
	extra?: any; // Stuff like scope (this object is a different shape depending on provider hence any)
};

/**
 * @openapi
 *  components:
 *   schemas:
 *    OAUTH_PROVIDER:
 *     type: string
 *     description: Enum representing the supported OAuth providers.
 *     enum:
 *      - google
 *      - github
 *
 *    OAuthStrategy:
 *     type: object
 *     description: Configuration for an OAuth strategy, including the strategy itself, callback function, secret keys, and additional provider-specific options.
 *     required:
 *      - strategy
 *      - callback
 *      - secretKeys
 *      - path
 *     properties:
 *      strategy:
 *       description: The OAuth strategy object.
 *       type: object
 *       additionalProperties: true
 *      callback:
 *       description: The callback function to handle OAuth responses.
 *       type: string
 *       format: function
 *      secretKeys:
 *       type: object
 *       description: The client ID and secret key for the OAuth provider.
 *       required:
 *        - clientId
 *        - secret
 *       properties:
 *        clientId:
 *         description: The client ID for the OAuth provider.
 *         type: string
 *        secret:
 *         description: The secret key for the OAuth provider.
 *         type: string
 *      path:
 *       description: The path at which the OAuth strategy is available.
 *       type: string
 *      extra:
 *       description: Additional provider-specific options, such as scope. The shape of this object varies by provider.
 *       type: object
 *       additionalProperties: true
 */
