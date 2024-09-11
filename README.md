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


# Enabling Push Notifications

To enable push notifications in your React Native app using the GoPersonal SDK, follow these steps:

## 1. Firebase Project Setup

1. Create a new Firebase project or use an existing one at [Firebase Console](https://console.firebase.google.com/).
2. Add your Android and iOS apps to the Firebase project.

## 2. Configure Android

1. Download the `google-services.json` file from Firebase Console.
2. Place it in your project at `android/app/google-services.json`.
3. Modify `android/build.gradle`:

   ```gradle
   buildscript {
     dependencies {
       // ... other dependencies
       classpath 'com.google.gms:google-services:4.3.15'
     }
   }
   ```

4. Modify `android/app/build.gradle`:

   ```gradle
   apply plugin: 'com.android.application'
   apply plugin: 'com.google.gms.google-services'
   ```

## 3. Configure iOS

1. Download the `GoogleService-Info.plist` file from Firebase Console.
2. Place it in your project at `ios/GoogleService-Info.plist`.
3. In the `ios` directory, run:

   ```bash
   cd ios && pod install
   ```

## 4. Initialize Firebase in Your App

In your main app file (e.g., `App.js`), add the following:

```javascript
import SDK from 'gopersonal-react-native-sdk';
import { useEffect } from 'react';

const App = () => {
  useEffect(() => {
    const setupPushNotifications = async () => {
      try {
        // Initialize the SDK
        await SDK.init('BR-your-client-id', 'your-client-secret');

        // Initialize Firebase
        await SDK.initializeFirebase();

        // Request permission (iOS only)
        const permissionGranted = await SDK.requestNotificationPermission();
        if (!permissionGranted) {
          console.log('Notification permission not granted');
          return;
        }

        // Get the Firebase token
        const token = await SDK.getFirebaseToken();

        // Send the token to your backend
        await SDK.sendTokenToBackend(token);

        // Handle incoming messages when the app is in the foreground
        const unsubscribe = SDK.onMessage(async remoteMessage => {
          console.log('Received foreground message:', remoteMessage);
          // Handle the message (e.g., show a local notification)
        });

        // Handle notification opened app
        SDK.onNotificationOpenedApp(remoteMessage => {
          console.log('Notification caused app to open from background state:', remoteMessage);
          // Handle the notification (e.g., navigate to a specific screen)
        });

        // Check whether an initial notification is available
        const initialNotification = await SDK.getInitialNotification();
        if (initialNotification) {
          console.log('Notification caused app to open from quit state:', initialNotification);
          // Handle the initial notification (e.g., navigate to a specific screen)
        }

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up push notifications:', error);
      }
    };

    setupPushNotifications();
  }, []);

  return (
    // Your app components
  );
};

export default App;
```

## 5. Testing Push Notifications

To test push notifications:

1. Run your app on a physical device or emulator.
2. Use the Firebase Console to send a test message to your app.
3. Verify that the notification is received and handled correctly.

Remember to handle the received notifications appropriately in your app, such as displaying them to the user or updating the app's state.

For more advanced usage and customization options, refer to the [@react-native-firebase/messaging documentation](https://rnfirebase.io/messaging/usage).