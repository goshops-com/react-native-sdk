import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

class ApiService {
	constructor() {
		this.axiosInstance = null;
	}

	async init(clientId, clientSecret) {
		const lastInitTime = await AsyncStorage.getItem("lastInitTime");
		const currentTime = new Date().getTime();
		const expirationTime = 24 * 60 * 60 * 1000; // 24 hours

		const [region, secondPart] = clientId.split("-");
		let baseURL;

		if (region === "BR") {
			baseURL = "https://discover.gopersonal.ai";
		} else {
			baseURL = "https://go-discover-dev.goshops.ai";
		}

		this.axiosInstance = axios.create({ baseURL });

		this.axiosInstance.interceptors.request.use(
			async (config) => {
				const token = await AsyncStorage.getItem("goPersonalToken");
				if (token) {
					config.headers.Authorization = `Bearer ${token}`;
				}

				return config;
			},
			(error) => Promise.reject(error),
		);

		this.axiosInstance.interceptors.response.use(
			(response) => response,
			async (error) => {
				if (error.response && error.response.status === 401) {
					await this.refreshToken(secondPart, clientSecret);

					return this.axiosInstance(error.config);
				}

				return Promise.reject(error);
			},
		);

		if (lastInitTime && currentTime - lastInitTime < expirationTime) {
			return;
		}

		try {
			await this.refreshToken(secondPart, clientSecret);

			await AsyncStorage.setItem("lastInitTime", currentTime.toString());
		} catch (error) {
			console.error("Failed to initialize API service:", error);
			throw new Error("Failed to initialize API service");
		}
	}

	async refreshToken(clientId, clientSecret) {
		try {
			let gsVUID = await AsyncStorage.getItem("gsVUID");
			if (!gsVUID) {
				gsVUID = uuidv4();
				await AsyncStorage.setItem("gsVUID", gsVUID);
			}

			const response = await this.axiosInstance.post("/channel/init", {
				clientId,
				clientSecret,
				gsVUID,
			});
			const token = response.data.token;
			await AsyncStorage.setItem("goPersonalToken", token);
		} catch (error) {
			console.error("Failed to refresh token:", error);
			throw error;
		}
	}

	async get(url, config = {}) {
		return this.axiosInstance.get(url, config);
	}

	async post(url, data = {}, config = {}) {
		return this.axiosInstance.post(url, data, config);
	}

	async put(url, data = {}, config = {}) {
		return this.axiosInstance.put(url, data, config);
	}

	async patch(url, data = {}, config = {}) {
		return this.axiosInstance.patch(url, data, config);
	}

	async delete(url, config = {}) {
		return this.axiosInstance.delete(url, config);
	}
	
}

export default new ApiService();
