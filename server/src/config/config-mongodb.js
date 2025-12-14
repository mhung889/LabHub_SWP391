'use strict'

require('dotenv').config();

const dev = {
    atlas: process.env.DEV_ATLAS || `LOI`,
    app: {
        port: process.env.DEV_APP_PORT || 9999
    },
    db: {
        host: process.env.DEV_DB_HOST || '127.0.0.1',
        port: process.env.DEV_DB_PORT || 27017,
        name: process.env.DEV_DB_NAME || 'StudentMana'
    }
}

const pro = {
    atlas: process.env.PRO_ATLAS || `LOI`,
    app: {
        port: process.env.PRO_APP_PORT || 9999
    },
    db: {
        host: process.env.PRO_DB_HOST || 'localhost',
        port: process.env.PRO_DB_PORT || 27017,
        name: process.env.PRO_DB_NAME || 'StudentMana'
    }
}

const configs = {dev, pro};

const env = process.env.NODE_ENV || 'dev';

module.exports = configs[env];