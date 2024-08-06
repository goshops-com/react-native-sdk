# Gopersonal React Native SDK

The GoPersonal SDK for React Native allows you to capture user behavior and display personalized content based on their interactions.

## Installation

First, install the GoPersonal SDK for React Native:

```bash
npm install gopersonal-react-native-sdk
```

Importing and Initializing the SDK
To start using the SDK, import it into your project and initialize it with your client ID and client secret.

```javascript
import SDK from 'gopersonal-react-native-sdk';
// Initialize the SDK
await SDK.init('BR-your-client-id', 'your-client-secret');
```

## Usage

Once the SDK is initialized, you can use its methods to capture user behavior and fetch personalized content.

### User Login

Log in a user to the SDK:

```javascript
await SDK.login('customer-id');
```

### Search

Perform a search query and get results:

```javascript
const searchResults = await SDK.search('search query');
```

### Get Content

Retrieve personalized content by content ID:

```javascript
const content = await SDK.getContent('content-id');
```

### Add Interaction

Capture user interactions to enhance personalization:

```javascript
await SDK.addInteraction('view', { someData: 'value' });
```

## Example

Here is a complete example of how to use the GoPersonal SDK in a React Native application:

```javascript
import SDK from 'gopersonal-react-native-sdk';
import { useEffect } from 'react';

const App = () => {
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        // Initialize the SDK
        await SDK.init('BR-your-client-id', 'your-client-secret');

        // Log in the user
        await SDK.login('customer-id');

        // Perform a search query
        const searchResults = await SDK.search('search query');
        console.log('Search Results:', searchResults);

        // Retrieve personalized content
        const content = await SDK.getContent('content-id');
        console.log('Content:', content);

        // Capture a user interaction
        await SDK.addInteraction('view', { someData: 'value' });
      } catch (error) {
        console.error('Error initializing SDK:', error);
      }
    };

    initializeSDK();
  }, []);

  return (
    // Your React Native components go here
    <></>
  );
};

export default App;
```

This documentation provides a comprehensive guide to installing, importing, initializing, and using the GoPersonal SDK for React Native, along with a practical example to help you get started.
