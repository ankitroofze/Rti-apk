# Welcome to your Expo app 👋

## Run on a physical Android phone

This app includes custom native modules (for example, the RTMP broadcaster), so it **cannot run in Expo Go**. Build and install the Expo development client once, then scan the QR code from that installed RTI News development app.

1. On the phone, enable **Developer options → USB debugging** and accept the computer's RSA prompt after connecting the USB cable.
2. In PowerShell, run `adb devices`. The phone must appear as `device` (not blank or `unauthorized`).
3. Run `./android-usb.cmd`. It uses Android Studio's bundled JDK and installs/opens the development build.
4. For QR/LAN reloads after that, run `./android-qr.cmd`, keep phone and PC on the same Wi-Fi, and scan/open the QR code from the installed development build—not Expo Go.

PowerShell on this machine blocks `npx.ps1`, so use the included `.cmd` files (or `npx.cmd ...`) instead of `npx ...`.

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
