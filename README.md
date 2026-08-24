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
| `mode`                   | Push notification mode: `development` or `production`. Only affects local builds — production signing overrides this automatically. | ❌       | `"development"`                 |
| `devTeam`                | Apple Developer Team ID (e.g. `"91SW8A37CR"`)                                                                       | ❌       | —                               |
| `iPhoneDeploymentTarget` | Minimum iOS deployment target for the extensions (should match your Podfile)                                        | ❌       | `"15.1"`                        |
| `iosNSEFilePath`         | Local path to a custom Notification Service Extension Swift file                                                    | ❌       | Built-in default                |
| `iosCEFilePath`          | Local path to a custom Content Extension Swift file                                                                 | ❌       | Built-in default                |
| `iosNSETargetName`       | Custom target name for the Notification Service Extension                                                           | ❌       | `"NotificationService"`         |
| `iosCETargetName`        | Custom target name for the Content Extension                                                                        | ❌       | `"NotificationViewController"` |
| `disableNSE`             | Skip all NSE-related setup (no target, no files, no Podfile entry). Content Extension is still created.             | ❌       | `false`                         |
| `iosNSEExistingTarget`   | Set to `true` if another plugin already creates the NSE target. Skips target creation, injects app group + pod.     | ❌       | `false`                         |
| `appGroupName`           | Custom iOS App Group name for entitlements                                                                          | ❌       | `"group.{bundleId}.WEGNotificationGroup"` |
| `useSPM`                 | Use Swift Package Manager instead of CocoaPods for extension dependencies                                           | ❌       | `false`                         |


---

## 💡 When to use `iosNSETargetName`

If your default NSE App ID (e.g. `com.yourcompany.yourapp.NotificationService`) was previously deleted from the Apple Developer Portal and cannot be restored, you can set a custom target name:

```json
["webengage-expo-push", {
  "iosNSETargetName": "WENotificationService"
}]
```

This will register the extension under `com.yourcompany.yourapp.WENotificationService` instead.

---

## 🔀 Multiple Push Plugins (e.g., OneSignal + WebEngage)

If another plugin (e.g., OneSignal) already creates a Notification Service Extension, use `iosNSEExistingTarget` to avoid conflicts.

**Important:** `webengage-expo-push` must be listed **BEFORE** the other plugin in the `plugins` array.

### Configuration:

```json
"plugins": [
  ["webengage-expo-push", {
    "iosNSEExistingTarget": true,
    "iosNSETargetName": "OneSignalNotificationServiceExtension",
    "iosNSEFilePath": "./assets/NotificationService.swift"
  }],
  ["onesignal-expo-plugin", {
    "mode": "development"
  }]
]
```

### Merged Swift File:

Create a Swift file (e.g., `./assets/NotificationService.swift`) that handles both providers:

```swift
import UserNotifications
import WEServiceExtension

class NotificationService: UNNotificationServiceExtension {
    let wegService = WEXPushNotificationService()

    override func didReceive(_ request: UNNotificationRequest,
                             withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        // WebEngage push
        if let payload = request.content.userInfo as? [String: Any],
           payload["source"] as? String == "webengage" {
            wegService.didReceive(request, withContentHandler: contentHandler)
            return
        }
        // Other provider's push handling
        contentHandler(request.content)
    }
}
```

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
