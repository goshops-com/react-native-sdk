import ApiService from "./ApiService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';


class SDK {
	async init(clientId, clientSecret) {
		try {
			await ApiService.init(clientId, clientSecret);
		} catch (error) {
			console.error("Error during SDK initialization:", error);
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
			return []
		}
	}

	async getContent(contentId) {
		try {
			const response = await ApiService.post(`/personal/content/${contentId}`);
			return response.data;
		} catch (error) {
			if (error.response && error.response.status === 404) {
				return null;
			} else {
				console.error("Failed to get content:", error);
				return null;
			}
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

	async addInteractionState(state, options = {}) {
		try {
			options.transactionId = uuidv4();
			return await ApiService.post(`/interaction/state/${state}`, options);
		} catch (error) {
			console.error("Failed to add interaction state:", error);
			throw new Error("Failed to add interaction state");
		}
	}

	async openImpression(impressionId) {
		try {
			await ApiService.patch(`/personal/impression/${impressionId}`, {
				status: "opened",
			});
		} catch (error) {
			console.error("Failed to open impression content:", error);
			throw new Error("Failed to open impression content");
		}
	}

	async initializeFirebase() {
        try {
            await messaging().registerDeviceForRemoteMessages();
            console.log('Firebase messaging initialized');
        } catch (error) {
            console.error('Failed to initialize Firebase messaging:', error);
            throw new Error('Failed to initialize Firebase messaging');
        }
    }

    async requestNotificationPermission() {
        try {
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                console.log('Authorization status:', authStatus);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to request notification permission:', error);
            throw new Error('Failed to request notification permission');
        }
    }

    async getFirebaseToken() {
        try {
            const token = await messaging().getToken();
            console.log('Firebase token:', token);
            return token;
        } catch (error) {
            console.error('Failed to get Firebase token:', error);
        }
    }

    onMessage(callback) {
        return messaging().onMessage(callback);
    }

    onNotificationOpenedApp(callback) {
        return messaging().onNotificationOpenedApp(callback);
    }

    async getInitialNotification() {
        return await messaging().getInitialNotification();
    }

	async sendTokenToBackend(token) {
        try {
			const deviceType = Platform.OS;
            await ApiService.post('/channel/notification-token', { token, deviceType });
        } catch (error) {
            console.error('Failed to send token to backend:', error);
        }
    }
}

export default new SDK();
