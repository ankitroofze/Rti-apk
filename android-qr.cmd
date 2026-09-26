@echo off
setlocal

rem Start Metro for the development build installed by android-usb.cmd.
rem Do not scan this QR in Expo Go: the app uses custom native modules.
call npx.cmd expo start --dev-client --lan --clear
