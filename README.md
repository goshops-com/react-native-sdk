How to import it

```
import SDK from 'gopersonal-react-native-sdk';

// Initialize the SDK
await SDK.init('BR-your-client-id', 'your-client-secret');

// Use the SDK methods
await SDK.login('customer-id');
const searchResults = await SDK.search('search query');
const content = await SDK.getContent('content-id');
await SDK.addInteraction('view', { someData: 'value' });
```
