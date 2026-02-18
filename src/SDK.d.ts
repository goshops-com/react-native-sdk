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

  // ==================== Search API V2 Types ====================

  interface SearchV2Options extends SDKOptions {
    projectId?: string;
    limit?: number;
    embedding_mode?: string;
    reranker?: string;
    customer_id?: string;
    filters?: Record<string, string[]>;
  }

  interface AutocompleteV2Options extends SDKOptions {
    projectId?: string;
  }

  interface FacetsV2Options extends SDKOptions {
    projectId?: string;
  }

  interface SearchPageV2Options extends SDKOptions {
    page_size?: number;
    filters?: Record<string, string[]>;
    sort_by?: string;
  }

  interface SimilarProductsV2Options extends SDKOptions {
    projectId?: string;
  }

  interface GetProductByIdV2Options extends SDKOptions {
    projectId?: string;
  }

  interface ProductPayloadV2 {
    id: string;
    sku: string;
    name: string;
    description: string;
    price: string;
    regular_price: string;
    category: string;
    brand?: string;
    color?: string;
    url: string;
    imgs: Array<{ url: string }>;
    badges?: string;
  }

  interface SearchHitV2 {
    id: string;
    score: number;
    payload: ProductPayloadV2;
  }

  interface SearchV2Result {
    hits: SearchHitV2[];
    hits_count: number;
    filters: Record<string, string[]>;
    facets: Record<string, { display_name: string; values: string[] }>;
    search_id: string;
    total_results: number;
    is_occasion_search: boolean;
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
    // Search API V2
    searchV2(query: string, options?: SearchV2Options): Promise<SearchV2Result>;
    autocompleteV2(query: string, options?: AutocompleteV2Options): Promise<any>;
    getFacetsV2(options?: FacetsV2Options): Promise<any>;
    searchPageV2(searchId: string, page: number, options?: SearchPageV2Options): Promise<SearchV2Result>;
    getSimilarProductsV2(productId: string, options?: SimilarProductsV2Options): Promise<any>;
    getProductByIdV2(productId: string, options?: GetProductByIdV2Options): Promise<ProductPayloadV2>;
  }

  const SDK: SDK;
  export default SDK;
} 