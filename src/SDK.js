import ApiService from "./ApiService";
import AsyncStorage from "@react-native-async-storage/async-storage";

class SDK {
	async init(clientId, clientSecret) {
		try {
			await ApiService.init(clientId, clientSecret);
		} catch (error) {
			console.error("Error during SDK initialization:", error);
			throw new Error("Failed to initialize SDK");
		}
	}

	async login(customerId) {
		try {
			await ApiService.post("/channel/login", { customerId });
			await AsyncStorage.setItem("gsVUID", customerId);
		} catch (error) {
			console.error("Login failed:", error);
			throw new Error("Failed to login");
		}
	}

	async search(text) {
		try {
			const response = await ApiService.get("/item/search", {
				params: { query: text },
			});

			return response.data;
		} catch (error) {
			console.error("Search failed:", error);
			throw new Error("Failed to search");
		}
	}

	async getContent(contentId) {
		try {
			const response = await ApiService.post(`/personal/content/${contentId}`);

			return response.data;
		} catch (error) {
			console.error("Failed to get content:", error);
			throw new Error("Failed to get content");
		}
	}

	async addInteraction(interactionName, data) {
		try {
			const interactionData = {
				event: interactionName,
				...data,
			};

			return ApiService.post("/interaction", interactionData);
		} catch (error) {
			console.error("Failed to add interaction:", error);
			throw new Error("Failed to add interaction");
		}
	}
}

export default new SDK();
