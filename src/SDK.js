// SDK.js
import ApiService from './ApiService';

class SDK {
    async init(clientId, clientSecret) {
        await ApiService.init(clientId, clientSecret);
    }

    async login(customerId) {
        return ApiService.post('/channel/login', { customerId });
    }

    async search(text) {
        return ApiService.get('/item/search', { params: { query: text } });
    }

    async getContent(contentId) {
        return ApiService.post(`/personal/content/${contentId}`);
    }

    async addInteraction(interactionName, data) {
        const interactionData = {
            event: interactionName,
            ...data
        };
        return ApiService.post('/interaction', interactionData);
    }
}

export default new SDK();