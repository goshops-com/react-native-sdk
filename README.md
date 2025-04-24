# Gopersonal React Native SDK

The GoPersonal SDK for React Native allows you to capture user behavior, display personalized content based on their interactions, and implement push notifications.

## Installation

First, install the GoPersonal SDK for React Native:

```bash
npm install gopersonal-react-native-sdk
```

## Importing and Initializing the SDK

To start using the SDK, import it into your project and initialize it with your client ID and client secret.

```javascript
import SDK from 'gopersonal-react-native-sdk';

// Initialize the SDK
await SDK.init('BR-your-client-id', 'your-client-secret', { debug: true });
```

## Core Functionality

### User Login

Log in a user to the SDK:

```javascript
await SDK.login('customer-id', { additionalData: 'value' });
```

### User Logout

Log out the current user:

```javascript
await SDK.logout();
```

### Search

Perform a search query and get results:

```javascript
const searchResults = await SDK.search('search query');
```

### Search by Image

Perform a search query using an image file:

```javascript
const imageSearchResults = await SDK.imageSearch(file);
```

### Get Content

Retrieve personalized content by content ID:

```javascript
const content = await SDK.getContent('content-id');
```

### Get NPS

Retrieve Net Promoter Score content:

```javascript
await SDK.addInteraction('view', { someData: 'value' });
```

### Get Addon

Retrieve data from a specific addon endpoint:

```javascript
const addonData = await SDK.getAddonData('endpoint');
```


### Add Interaction

Capture user interactions to enhance personalization:

```javascript
await SDK.addInteraction('view', { someData: 'value' });
```

### Add Interaction State

Add a state to the interaction flow:

```javascript
await SDK.addInteractionState('stateKey', { transactionId: 'uniqueId' });
```

### Open Impression

Mark an impression as opened:

```javascript
await SDK.openImpression('impressionId');
```

## Push Notifications

### Initialize Firebase

Set up Firebase for push notifications:

```javascript
await SDK.initializeFirebase();
```

### Request Notification Permission

Request permission to send notifications (required for iOS):

```javascript
const permissionGranted = await SDK.requestNotificationPermission();
```

### Get Firebase Token

Retrieve the Firebase token for the device:

```javascript
const token = await SDK.getFirebaseToken();
```

### Send Token to Backend

Send the Firebase token to your backend:

```javascript
await SDK.sendTokenToBackend(token);
```

### Handle Incoming Messages

Set up a listener for incoming messages when the app is in the foreground:

```javascript
const unsubscribe = SDK.onMessage(async remoteMessage => {
  console.log('Received foreground message:', remoteMessage);
  // Handle the message
});
```

### Handle Notification Opened App

Set up a listener for when a notification opens the app from the background:

```javascript
SDK.onNotificationOpenedApp(remoteMessage => {
  console.log('Notification opened app from background state:', remoteMessage);
  // Handle the notification
});
```

### Check Initial Notification

Check if the app was opened from a notification when it was in a quit state:

```javascript
const initialNotification = await SDK.getInitialNotification();
if (initialNotification) {
  console.log('App opened from quit state by notification:', initialNotification);
  // Handle the initial notification
}
```

## Complete Example

Here's a comprehensive example of how to use the GoPersonal SDK in a React Native application:

```javascript
import SDK from 'gopersonal-react-native-sdk';
import { useEffect } from 'react';

const App = () => {
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        // Initialize the SDK
        await SDK.init('BR-your-client-id', 'your-client-secret', { debug: true });

        // Log in the user
        await SDK.login('customer-id', { additionalData: 'value' });

        // Perform a search query
        const searchResults = await SDK.search('search query');
        console.log('Search Results:', searchResults);

        // Retrieve personalized content
        const content = await SDK.getContent('content-id');
        console.log('Content:', content);

        // Capture a user interaction
        await SDK.addInteraction('view', { someData: 'value' });

        // Set up push notifications
        await SDK.initializeFirebase();
        const permissionGranted = await SDK.requestNotificationPermission();
        if (permissionGranted) {
          const token = await SDK.getFirebaseToken();
          await SDK.sendTokenToBackend(token);

          SDK.onMessage(async remoteMessage => {
            console.log('Received foreground message:', remoteMessage);
          });

          SDK.onNotificationOpenedApp(remoteMessage => {
            console.log('Notification opened app from background state:', remoteMessage);
          });

          const initialNotification = await SDK.getInitialNotification();
          if (initialNotification) {
            console.log('App opened from quit state by notification:', initialNotification);
          }
        }
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