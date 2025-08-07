import ApiService from "./ApiService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import messaging from "@react-native-firebase/messaging";
import { Platform, PermissionsAndroid } from "react-native";
import { showSurveyModal } from "./ui/showSurveyModal";
import { isValidSearchTerm } from "./utils/searchUtils";
import { GPTOKEN_KEY, GS_VUID_KEY, PROJECT_KEY } from "./utils/constants";

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
        await AsyncStorage.setItem(GS_VUID_KEY, customerId);
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
        console.log(await AsyncStorage.getItem(GS_VUID_KEY));
      }
      await AsyncStorage.removeItem(GS_VUID_KEY);
      await AsyncStorage.removeItem(GPTOKEN_KEY);
      const newGsVUID = uuidv4();
      const anonId = `_gsVUUID_${newGsVUID}_${new Date().getTime()}`;
      await AsyncStorage.setItem(GS_VUID_KEY, anonId);
      if (options.debug) {
        console.log("New gsVUID:", await AsyncStorage.getItem(GS_VUID_KEY));
      }
    } catch (error) {
      console.error("Logout failed:", error);
      throw new Error("Failed to logout");
    }
  }

  async search(text, options = {}) {
    try {
      const params = { query: text };

      if (options.includeAllItemFields) {
        params.includeAllItemFields = true;
      }

      if (options.jsonFilter) {
        params.jsonFilter = JSON.stringify(options.jsonFilter);
      }

      const response = await ApiService.get("/item/search", { params });

      if (options.debug) {
        console.log("Search response:", response.data);
      }
      return response.data;
    } catch (error) {
      console.error("Search failed:", error);
      return [];
    }
  }

  async getNPS(options = {}) {
    try {
      const npsContent = await this.getContent("nps", options);

      let surveyOptions = { ...options };

      if (
        npsContent &&
        npsContent.contentValue &&
        npsContent.contentValue.json &&
        npsContent.contentValue.json.data
      ) {
        const fetchedConfig = npsContent.contentValue.json.data;
        surveyOptions = {
          ...surveyOptions,
          labels: { ...fetchedConfig.labels, ...options.labels },
          styles: { ...fetchedConfig.styles, ...options.styles },
          config: { ...fetchedConfig.config, ...options.config },
        };
      }

      return new Promise((resolve, reject) => {
        showSurveyModal({
          ...surveyOptions,
          onSubmit: (score, feedback) => {
            if (surveyOptions.onSubmit) {
              surveyOptions.onSubmit(score, feedback);
            }
            resolve({ score, feedback });
          },
          onClose: () => {
            if (surveyOptions.onClose) {
              surveyOptions.onClose();
            }
            resolve(null);
          },
        });
      });
    } catch (error) {
      console.error("Error in NPS process:", error);
      throw error;
    }
  }

  async getContentsByContext(pageType, options = {}) {
    try {
      const url = `personal/content?pageType=${pageType}&includeContentMetadata=true`;
      const response = await ApiService.get(url);
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

  async getContent(
    contentId,
    options = {
      itemAttributes: "*",
      impressionStatus: "opened",
      cache: 0,
      body: {},
      context: null,
    }
  ) {
    try {
      const { body, cache, debug, context, ...queryOptions } = options;
      const queryParams = new URLSearchParams(queryOptions).toString();
      let response;
      const project = await AsyncStorage.getItem(PROJECT_KEY);

      if (cache === 1) {
        if (debug) {
          console.log("Getting cached content");
        }
        const url = `/public/cached-content/${project}/${contentId}`;
        response = await ApiService.get(url);
      } else {
        const url = `/personal/content/${contentId}${
          queryParams ? `?${queryParams}` : ""
        }`;
        
        const requestBody = { ...body };
        if (context) {
          requestBody.context = context;
        }
        
        response = await ApiService.post(url, requestBody);
      }

      if (debug) {
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
      if (!options.transactionId) {
        options.transactionId = uuidv4();
      }
      const response = await ApiService.post(
        `/interaction/state/${state}`,
        options
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
        }
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
      if (Platform.OS === "android" && Platform.Version >= 33) {
        const postNotificationsAndroidStatus = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );

        if (options.debug) {
          console.log(
            "Android notification permission status:",
            postNotificationsAndroidStatus
          );
        }

        if (!postNotificationsAndroidStatus) {
          const requestStatus = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          return requestStatus === "granted";
        }

        return postNotificationsAndroidStatus;
      }

      const authStatus = await messaging().hasPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        const requestStatus = await messaging().requestPermission();
        return (
          requestStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          requestStatus === messaging.AuthorizationStatus.PROVISIONAL
        );
      }

      if (options.debug) {
        console.log("iOS notification permission status:", authStatus);
      }

      return enabled;
    } catch (error) {
      console.error("Failed to check/request notification permission:", error);
      throw new Error("Failed to check/request notification permission");
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

  async voiceSearch(file, options = {}) {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: Platform.OS === "ios" ? file.uri : "file://" + file.uri,
        name: Platform.OS === "ios" ? "audioIOS.m4a" : "audioAndroid.mp4",
        type: Platform.OS === "ios" ? "audio/m4a" : "audio/mp4",
      });

      const uploadResponse = await ApiService.post(
        "/item/audio-upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!uploadResponse?.data?.transcription?.text) {
        throw new Error("No transcription available");
      }

      const searchResponse = await ApiService.get(
        `/item/search?query=${uploadResponse.data.transcription.text.toLowerCase()}&typeOverride=voice`
      );

      if (options.debug) {
        console.log("Voice search response:", searchResponse.data);
      }

      return {
        hits: searchResponse.data.hits,
        query: uploadResponse.data.transcription.text,
      };
    } catch (error) {
      console.error("Voice search failed:", error);
      throw new Error("Failed to perform voice search");
    }
  }

  async getCustomerId() {
    return await AsyncStorage.getItem(GS_VUID_KEY);
  }

  isValidSearchTerm(searchTerm) {
    return isValidSearchTerm(searchTerm);
  }

  async imageSearch(file, options = {}) {
    try {
      const formData = new FormData();
      formData.append("image", {
        uri: file?.uri ?? file,
        name: file?.name ?? "photo.jpg", 
        type: file?.type ?? "image/jpeg",
      });

      const searchResponse = await ApiService.post("/item/image-search", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (options.debug) {
        console.log("Image search response:", searchResponse.data);
      }

      if (!searchResponse?.data?.hits) {
        throw new Error("No search results available");
      }

      return searchResponse.data;

    } catch (error) {
      console.error("Image search failed:", error);
      if (error.response) {
        console.error("Image search error:", error.response.data);
      }
      throw new Error("Failed to perform image search");
    }
  }

  async requestAddonData(endpoint, options = {}) {
    try {
      const method = options.method?.toLowerCase() || 'get';
      
      const baseUrl = `/addon/live/${endpoint}`;
      
      const config = {
        timeout: options.timeout || 8000,
        params: options.params
      };
      
      let response;
      
      switch (method) {
        case 'post':
          response = await ApiService.post(baseUrl, options.data || {}, config);
          break;
        case 'put':
          response = await ApiService.put(baseUrl, options.data || {}, config);
          break;
        case 'patch':
          response = await ApiService.patch(baseUrl, options.data || {}, config);
          break;
        case 'delete':
          response = await ApiService.delete(baseUrl, config);
          break;
        default:
          response = await ApiService.get(baseUrl, config);
          break;
      }

      if (options.debug) {
        console.log(`Addon ${method.toUpperCase()} ${endpoint} response:`, response.data);
      }

      return response?.data || [];

    } catch (error) {
      if (error.response) {
        console.error(`Addon data error (${options.method || 'GET'}):`, error.response.data);
      } else {
        console.error(`Addon data error (${options.method || 'GET'}):`, error.message);
      }
      throw new Error(`Failed to ${options.method || 'get'} addon data: ${error.message}`);
    }
  }

  async getGoPersonalToken() {
    try {
      return await AsyncStorage.getItem(GPTOKEN_KEY);
    } catch (error) {
      console.error("Failed to get GoPersonal token:", error);
      throw new Error("Failed to get GoPersonal token");
    }
  }
}

export default new SDK();
