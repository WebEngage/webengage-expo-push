# 📲 webengage-expo-push

**An Expo Config Plugin to integrate WebEngage into your Expo app.**

This plugin makes it easy to add WebEngage SDK configuration to your Expo app during the build process.

---

## 🚀 Installation

1️⃣ Install the plugin in your project:

```bash
npm install webengage-expo-push
# or
yarn add webengage-expo-push
```

## 🛠️ Configuration

In your `app.json` or `app.config.js`, add the plugin under the `plugins` key and configure it as needed:

```json
{
  "expo": {
    "name": "YourApp",
    "slug": "your-app",
    "plugins": [
      [
        "webengage-expo-push",
        {
          "mode": "development",
          "devTeam": "YOUR_APPLE_TEAM_ID",
          "iPhoneDeploymentTarget": "15.1",
          "nseTargetName": "NotificationService",
          "ceTargetName": "NotificationViewController"
        }
      ]
    ]
  }
}
```

### Options (iOS):

| Key                      | Description                                                                                                         | Required | Default                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------- |
| `mode`                   | Push notification mode: `development` or `production`                                                               | ❌       | `"development"`                 |
| `devTeam`                | Apple Developer Team ID (e.g. `"91SW8A37CR"`)                                                                       | ❌       | —                               |
| `iPhoneDeploymentTarget` | Minimum iOS deployment target for the extensions (should match your Podfile)                                        | ❌       | `"15.1"`                        |
| `iosNSEFilePath`         | Local path to a custom Notification Service Extension Swift file                                                    | ❌       | Built-in default                |
| `iosCEFilePath`          | Local path to a custom Content Extension Swift file                                                                 | ❌       | Built-in default                |
| `nseTargetName`          | Custom target name for the Notification Service Extension. Use if the default App ID is unavailable on Apple portal | ❌       | `"NotificationService"`         |
| `ceTargetName`           | Custom target name for the Content Extension                                                                        | ❌       | `"NotificationViewController"` |


---

## 💡 When to use `nseTargetName`

If your default NSE App ID (e.g. `com.yourcompany.yourapp.NotificationService`) was previously deleted from the Apple Developer Portal and cannot be restored, you can set a custom target name:

```json
["webengage-expo-push", {
  "mode": "production",
  "devTeam": "YOUR_TEAM_ID",
  "nseTargetName": "WENotificationService"
}]
```

This will register the extension under `com.yourcompany.yourapp.WENotificationService` instead.

---

## Usage

After completing the configuration step above, you can start using WebEngage in your Expo project.

✅ Since this plugin is designed for Expo, you do not need to follow the native Android/iOS integration steps from the official React Native guide.
🚀 Just use the JavaScript API in your app code.

JavaScript APIs you can use, see the [WebEngage React Native Documentation](https://docs.webengage.com/docs/react-native).

### ⚠️ Note on Updates

If you make changes to the plugin configuration (e.g., app.json or native plugin settings), you will need to create a new build of your app and upload it to the Play Store / App Store.

If you only update the JavaScript code in your project (e.g., tracking events, setting user attributes, etc.), you can simply publish an OTA (Over The Air) update without rebuilding the app.

## 🧪 Development & Testing

If you want to test your integration:

✅ Run on iOS Simulator or Android Emulator after building locally:

```bash
# Build and run your native iOS project
npx expo run:ios

# Build and run your native Android project
npx expo run:android
```

## 📄 License

[MIT](https://github.com/WebEngage/webengage-expo-push/blob/main/LICENSE)
