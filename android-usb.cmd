@echo off
setlocal

rem Use Android Studio's bundled JDK so Java does not have to be configured globally.
set "JAVA_HOME=%ProgramFiles%\Android\Android Studio\jbr"
set "PATH=%JAVA_HOME%\bin;%PATH%"

if not exist "%JAVA_HOME%\bin\java.exe" (
  echo Android Studio JDK was not found at:
  echo %JAVA_HOME%
  echo Install Android Studio, or set JAVA_HOME to a JDK 17+ installation.
  exit /b 1
)

rem This project has custom native modules, so it must run in an Expo development build.
call npx.cmd expo run:android --device
