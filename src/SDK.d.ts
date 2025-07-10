declare module 'gopersonal-react-native-sdk' {
  interface SDKOptions {
    debug?: boolean;
  }

  interface LoginOptions extends SDKOptions {
    debug?: boolean;
  }

  interface LogoutOptions extends SDKOptions {
    debug?: boolean;
  }

  interface SearchOptions extends SDKOptions {
    jsonFilter?: any;
  }

  interface NPSSurveyOptions extends SDKOptions {
    labels?: Record<string, string>;
    styles?: Record<string, any>;
    config?: Record<string, any>;
    onSubmit?: (score: number, feedback: string) => void;
    onClose?: () => void;
  }

  interface ContentOptions extends SDKOptions {
    itemAttributes?: string;
    impressionStatus?: string;
    cache?: number;
    body?: any;
    context?: any;
  }

  interface InteractionOptions extends SDKOptions {
    transactionId?: string;
  }

  interface FirebaseOptions extends SDKOptions {
    debug?: boolean;
  }

  interface VoiceSearchOptions extends SDKOptions {
    debug?: boolean;
  }

  interface ImageSearchOptions extends SDKOptions {
    debug?: boolean;
  }

  interface AddonDataOptions extends SDKOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    data?: any;
    params?: Record<string, any>;
    timeout?: number;
  }

  interface VoiceSearchResult {
    hits: any[];
    query: string;
  }

  interface ImageSearchResult {
    hits: any[];
  }

  interface NPSSurveyResult {
    score: number;
    feedback: string;
  }

  interface SDK {
    init(clientId: string, clientSecret: string, options?: SDKOptions): Promise<void>;
    login(customerId: string, data?: any, options?: LoginOptions): Promise<void>;
    logout(options?: LogoutOptions): Promise<void>;
    search(text: string, options?: SearchOptions): Promise<any[]>;
    getNPS(options?: NPSSurveyOptions): Promise<NPSSurveyResult | null>;
    getContentsByContext(pageType: string, options?: SDKOptions): Promise<any>;
    getContent(contentId: string, options?: ContentOptions): Promise<any>;
    addInteraction(interactionName: string, data: any, options?: SDKOptions): Promise<any>;
    addInteractionState(state: string, options?: InteractionOptions): Promise<any>;
    openImpression(impressionId: string, options?: SDKOptions): Promise<void>;
    initializeFirebase(options?: FirebaseOptions): Promise<void>;
    requestNotificationPermission(options?: FirebaseOptions): Promise<boolean>;
    getFirebaseToken(options?: FirebaseOptions): Promise<string | undefined>;
    onMessage(callback: (message: any) => void, options?: FirebaseOptions): any;
    onNotificationOpenedApp(callback: (notification: any) => void, options?: FirebaseOptions): any;
    getInitialNotification(options?: FirebaseOptions): Promise<any>;
    sendTokenToBackend(token: string, options?: FirebaseOptions): Promise<void>;
    voiceSearch(file: any, options?: VoiceSearchOptions): Promise<VoiceSearchResult>;
    getCustomerId(): Promise<string | null>;
    isValidSearchTerm(searchTerm: string): boolean;
    imageSearch(file: any, options?: ImageSearchOptions): Promise<ImageSearchResult>;
    requestAddonData(endpoint: string, options?: AddonDataOptions): Promise<any>;
    getGoPersonalToken(): Promise<string | null>;
  }

  const SDK: SDK;
  export default SDK;
} 