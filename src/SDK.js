import ApiService from "./ApiService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import messaging from "@react-native-firebase/messaging";
import { Platform, PermissionsAndroid } from "react-native";

class SDK {
	async init(clientId, clientSecret, options = {}) {
		try {
			await ApiService.init(clientId, clientSecret);
			if (options.debug) {
				console.log("SDK initialized");
			}
		} catch (error) {
			console.error("Error during SDK initialization:", error);
		}
	}

	async login(customerId, data = {}, options = {}) {
		try {
			if (typeof customerId !== "undefined") {
				await ApiService.post("/channel/login", { customerId, ...data });
				await AsyncStorage.setItem("gsVUID", customerId);
			}
			if (options.debug) {
				console.log({ customerId, ...data });
			}
		} catch (error) {
			console.error("Login failed:", error);
			throw new Error("Failed to login");
		}
	}

	async logout(options = {}) {
		try {
			await ApiService.post("/channel/logout");
			if (options.debug) {
				console.log(await AsyncStorage.getItem("gsVUID"));
			}
			await AsyncStorage.removeItem("gsVUID");
			await AsyncStorage.removeItem("goPersonalToken");
			const newGsVUID = uuidv4();
			await AsyncStorage.setItem("gsVUID", newGsVUID);
			if (options.debug) {
				console.log("New gsVUID:", await AsyncStorage.getItem("gsVUID"));
			}
		} catch (error) {
			console.error("Logout failed:", error);
			throw new Error("Failed to logout");
		}
	}

	async search(text, options = {}) {
		try {
			const response = await ApiService.get("/item/search", {
				params: { query: text },
			});
			if (options.debug) {
				console.log("Search response:", response.data);
			}
			return response.data;
		} catch (error) {
			console.error("Search failed:", error);
			return [];
		}
	}

	async getContent(contentId, options = {}) {
		try {
			const response = await ApiService.post(`/personal/content/${contentId}`);
			if (options.debug) {
				console.log("Content response:", response.data);
			}
			return response.data;
		} catch (error) {
			if (error.response && error.response.status === 404) {
				return null;
			}
			console.error("Failed to get content:", error);
			return null;
		}
	}

	async addInteraction(interactionName, data, options = {}) {
		try {
			const interactionData = {
				event: interactionName,
				...data,
			};
			const response = await ApiService.post("/interaction", interactionData);
			if (options.debug) {
				console.log("Interaction response:", response);
			}
			return response;
		} catch (error) {
			console.error("Failed to add interaction:", error);
			throw new Error("Failed to add interaction");
		}
	}

	async addInteractionState(state, options = {}) {
		try {
			options.transactionId = uuidv4();
			const response = await ApiService.post(
				`/interaction/state/${state}`,
				options,
			);
			if (options.debug) {
				console.log("Interaction state response:", response);
			}
			return response;
		} catch (error) {
			console.error("Failed to add interaction state:", error);
			throw new Error("Failed to add interaction state");
		}
	}

	async openImpression(impressionId, options = {}) {
		try {
			const response = await ApiService.patch(
				`/personal/impression/${impressionId}`,
				{
					status: "opened",
				},
			);
			if (options.debug) {
				console.log("Open impression response:", response);
			}
		} catch (error) {
			console.error("Failed to open impression content:", error);
			throw new Error("Failed to open impression content");
		}
	}

	async initializeFirebase(options = {}) {
		try {
			await messaging().registerDeviceForRemoteMessages();
			if (options.debug) {
				console.log("Firebase messaging initialized");
			}
		} catch (error) {
			console.error("Failed to initialize Firebase messaging:", error);
			throw new Error("Failed to initialize Firebase messaging");
		}
	}

	async requestNotificationPermission(options = {}) {
		try {
			if (Platform.OS === "android" && Platform.Version >= 30) {
				const postNotificationsAndroidStatus = await PermissionsAndroid.request(
					PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
				);
				if (options.debug) {
					console.log(
						typeof Platform.Version,
						postNotificationsAndroidStatus,
						"androidStatus",
					);
				}
				if (postNotificationsAndroidStatus === "granted") {
					return true;
				}
				return false;
			}
			const authStatus = await messaging().requestPermission();
			const enabled =
				authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
				authStatus === messaging.AuthorizationStatus.PROVISIONAL;

			if (enabled) {
				if (options.debug) {
					console.log("Authorization status:", authStatus);
				}
				return true;
			}
			return false;
		} catch (error) {
			console.error("Failed to request notification permission:", error);
			throw new Error("Failed to request notification permission");
		}
	}

	async getFirebaseToken(options = {}) {
		try {
			const token = await messaging().getToken();
			if (options.debug) {
				console.log("Firebase token:", token);
			}
			return token;
		} catch (error) {
			console.error("Failed to get Firebase token:", error);
		}
	}

	onMessage(callback, options = {}) {
		if (options.debug) {
			console.log("onMessage callback set");
		}
		return messaging().onMessage(callback);
	}

	onNotificationOpenedApp(callback, options = {}) {
		if (options.debug) {
			console.log("onNotificationOpenedApp callback set");
		}
		return messaging().onNotificationOpenedApp(callback);
	}

	async getInitialNotification(options = {}) {
		const notification = await messaging().getInitialNotification();
		if (options.debug) {
			console.log("Initial notification:", notification);
		}
		return notification;
	}

	async sendTokenToBackend(token, options = {}) {
		try {
			const deviceType = Platform.OS;
			const response = await ApiService.post("/channel/notification-token", {
				token,
				deviceType,
			});
			if (options.debug) {
				console.log("Send token to backend response:", response);
			}
		} catch (error) {
			console.error("Failed to send token to backend:", error);
		}
	}
}

export default new SDK();
