const pinoLogger = require('./logger');

const CACHE_EXPIRY_TIME = 60 * 60 * 1000; // 1 hour in milliseconds
const CACHE_SWEEP_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds

class UserLastChannelMapCache {
    constructor() {
        if (!UserLastChannelMapCache.instance) {
            this.cache = new Map();
            this.startCacheSweep();
            UserLastChannelMapCache.instance = this;
        }
        return UserLastChannelMapCache.instance;
    }

    _isValidString(value) {
        return typeof value === 'string' && value.trim() !== '';
    }

    _validateInput(userId, channelId, originChannelType, originGuildId, originalQuery) {
        if (![userId, channelId, originChannelType, originalQuery].every(this._isValidString) ||
            (originGuildId && !this._isValidString(originGuildId))) {
            throw new Error('Invalid parameters provided.');
        }
    }

    set(userId, channelId, originChannelType, originalQuery, originGuildId = null) {
        try {
            this._validateInput(userId, channelId, originChannelType, originGuildId, originalQuery);

            const expiryTime = Date.now() + CACHE_EXPIRY_TIME;
            this.cache.set(userId, {
                channelId,
                originChannelType,
                originalQuery,
                originGuildId,
                expiryTime
            });
            pinoLogger.info(`Cache set for user ${userId}.`);
        } catch (error) {
            pinoLogger.error(`Error setting user details in cache: ${error.message}`);
            throw error;
        }
    }

    setIfAbsent(userId, channelId, originChannelType, originalQuery, originGuildId = null) {
        if (!this.cache.has(userId)) {
            this.set(userId, channelId, originChannelType, originalQuery, originGuildId);
        }
    }

    get(userId) {
        if (!this._isValidString(userId)) {
            pinoLogger.error('Invalid userId provided for cache retrieval.');
            return null;
        }

        const userData = this.cache.get(userId);
        if (!userData || userData.expiryTime <= Date.now()) {
            this.cache.delete(userId);
            pinoLogger.info(`Cache entry for user ${userId} expired and deleted.`);
            return null;
        }
        return userData;
    }

    getLastCommandChannelId(userId) {
        const userData = this.get(userId);
        return userData ? userData.channelId : null;
    }

    getOriginalQuery(userId) {
        const userData = this.get(userId);
        return userData ? userData.originalQuery : null;
    }

    clearUserCache(userId) {
        this.cache.delete(userId);
        pinoLogger.info(`Cache cleared for user ${userId}.`);
    }

    startCacheSweep() {
        setInterval(() => {
            this.sweepCache();
        }, CACHE_SWEEP_INTERVAL);
    }

    sweepCache() {
        const currentTime = Date.now();
        this.cache.forEach((userData, userId) => {
            if (userData.expiryTime <= currentTime) {
                this.cache.delete(userId);
                pinoLogger.info(`Cache for user ${userId} invalidated.`);
            }
        });
    }
}

module.exports = new UserLastChannelMapCache();