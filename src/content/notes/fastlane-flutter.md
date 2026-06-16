---
title: 'fastlane in flutter'
description: 'setting up ci/cd for appstore and playstore deployment'
pubDate: 'May 27 2026'
tags: ["flutter", "ci-cd"]
# heroImage: '../../assets/blog-placeholder-1.jpg'
---
i had to recently set up fastlane using github actions for a flutter application to automatically trigger deployment to apple app store and google play store upon push (or merging of a pull request) to a particular branch - master in my case.

this is a summary of how i did it, and the issues i faced.

setting up fastlane using github actions for a flutter application to automatically trigger deployment to apple app store and google play store upon push (or merging of pull request or tag in a commit) to a particular branch.
### github secrets

add the following to github secrets to your repository on github.com
Settings > Secrets and Variables > New Repository Secret

|                             |                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ANDROID_KEYSTORE_BASE64`   | your release keystore file encoded as base64. Run `base64 -i release.keystore` on your machine to get the value.                                                                                                                                                                                                                                              |
| `ANDROID_KEYSTORE_PASSWORD` | the password you set when you created the keystore with keytool.<br>                                                                                                                                                                                                                                                                                          |
| `ANDROID_KEY_ALIAS`         | the alias you chose when creating the keystore, e.g. release.                                                                                                                                                                                                                                                                                                 |
| `ANDROID_KEY_PASSWORD`      | the individual key password. If you didn't set one separately, it's the same as the keystore password.                                                                                                                                                                                                                                                        |
| `APPLE_ID`                  | "your@email.com"                                                                                                                                                                                                                                                                                                                                              |
| `APPLE_TEAM_ID`             | your App Store Connect team ID                                                                                                                                                                                                                                                                                                                                |
| `APP_BUNDLE_ID`             | com.xxxxxxxx (app package name / application id - can be checked in AndroidManifest.xml or app/build.gradle)                                                                                                                                                                                                                                                  |
| `ASC_ISSUER_ID`             | identifies your App Store Connect account/team. Found on  App Store Connect > Users and Access > Integrations > App Store Connect API, at the top. One issuer ID per team, shared across all your keys.                                                                                                                                                       |
| `ASC_KEY_ID`                | the ID of the API key, e.g. `ABC123DEF4`. Found in App Store Connect > Users and Access > Integrations > App Store Connect API, listed next to your key.                                                                                                                                                                                                      |
| `ASC_PRIVATE_KEY`           | the actual `.p8` file content that Apple gives you when you create the API key. It looks like:<br><br>-----BEGIN EC PRIVATE KEY-----<br>  MHQCAQEEIOsomewhere...<br>  -----END EC PRIVATE KEY-----                                                                                                                                                            |
| `ASC_TEAM_ID`               | App Store Connect Team ID                                                                                                                                                                                                                                                                                                                                     |
| `GOOGLE_PLAY_JSON_KEY`      | the full contents of the JSON service account key file from Google Play Console.<br><br>(NOT google-services.json - that is used for firebase config)<br><br>1. Go to **Google Play Console > Setup > API access**.<br>2. Link to a Google Cloud project.<br>3. Create a service account with the **Release manager** role.<br>4. Download the JSON key file. |
| `IOS_CERT_BASE64`           | your distribution certificate exported as a .p12 file, then base64 encoded. Run base64 -i distribution.p12.                                                                                                                                                                                                                                                   |
| `IOS_CERT_PASSWORD`         | the password you set when exporting the .p12 from Keychain Access.                                                                                                                                                                                                                                                                                            |
| `IOS_PROFILE_BASE64`        | your distribution provisioning profile base64 encoded.<br><br>developer.apple.com > Account > Certificates, Identifiers & Profiles, Find your distribution profile and click on it, Click Download<br><br>your `.mobileprovision` file encoded as base64, Run `base64 -i distribution.mobileprovision`                                                        |
| `IOS_PROFILE_NAME`          | the exact name of the provisioning profile as it appears in the Apple Developer portal or Xcode.                                                                                                                                                                                                                                                              |
| `KEYCHAIN_PASSWORD`         | this one is not a real credential. It is just a random string you make up. Fastlane creates a temporary keychain on the CI runner to hold your certificate, and this is the password it uses for that keychain. It never leaves CI.                                                                                                                           |
  
your google play json key should look something like this

```json
{ 
"type": "service_account",
"project_id": "...",
"private_key_id": "...", 
"private_key": "-----BEGIN RSA PRIVATE KEY-----\n...", 
"client_email": "...", 
"client_id": "...", 
"auth_uri": "...", 
"token_uri": "..."
...
}
```
### create workflows

we use github actions to create a workflow that gets executed upon a particular action (like push, pull request, or merge) for a particular branch

- create a .github/workflows folder at repo root
- write any number of yml files here containing details about actions to be executed
- for our case we write 2 - deploy_android.yml and deploy_ios.yml

### setup fastlane

create fastlane/Appfile and fastlane/Fastfile at root of directory
create a Gemfile at root of directory

Appfile: imports variables from secrets or from .env
Fastfile: defines commands and actions to take when we run `bundle exec fastlane <command name>` 
Gemfile: sets up ruby, fastlane, cocoapods and whatever dependencies

### Gemfile

```
source "https://rubygems.org"

gem "fastlane", "~> 2.220"
gem "dotenv"
gem "cocoapods"
```

in the end you should have:

```
project-root/
├── fastlane
│   ├── Appfile
│   └── Fastfile
├── .github
│   └── workflows
│       ├── deploy_android.yml
│       └── deploy_ios.yml
└── Gemfile
```
### test locally

add all your secrets in fastlane/.env (fastlane uses this instead of github secrets locally)

```dotenv
# Android
ANDROID_KEYSTORE_BASE64=
ANDROID_KEYSTORE_PASSWORD=
ANDROID_KEY_PASSWORD=
ANDROID_KEY_ALIAS=
GOOGLE_PLAY_JSON_KEY=

# iOS signing
IOS_CERT_BASE64=
IOS_CERT_PASSWORD=
IOS_PROFILE_BASE64=
IOS_PROFILE_NAME=

# iOS App Store Connect API
ASC_KEY_ID=
ASC_ISSUER_ID=
ASC_PRIVATE_KEY=

# Shared
APP_BUNDLE_ID=
APPLE_ID=
ASC_TEAM_ID=
APPLE_TEAM_ID=
KEYCHAIN_PASSWORD=
```

check:
```sh
# Make sure Flutter is available
flutter --version

# Make sure gems are installed
bundle install

# Make sure your .env file exists and is filled in
cat fastlane/.env
```

***UBUNTU***
we'll need ruby and bundler and a bunch of packages -

```sh
sudo apt install ruby-bundler
sudo apt install ruby-dev build-essential
bundle install --path vendor/bundle
```

add /vendor file to .gitignore

if your google play json gets mangled in the .env, then save it in a file and fetch from there:

```
json_key_path = "#{__dir__}/google-play-key.json" 
unless File.exist?(json_key_path)
File.write(json_key_path, ENV["GOOGLE_PLAY_JSON_KEY"]) end
```

***MAC***
we get some issues with system ruby in mac idk how to solve it :)

***WINDOWS***
`¯\_(ツ)_/¯`

to actually test the deployment:

`bundle exec fastlane android <command name>` 
`bundle exec fastlane ios <command name>` (this you need to do in mac)

`<command name>` is deploy_internal in our case

A successful Android build produces a file at:
```
build/app/outputs/bundle/release/app-release.aab
```

A successful iOS build produces:
```
build/ios/ipa/Runner.ipa
```


### push to repository and test

push all files to the particular branch
github actions should automatically start executing your workflows (how many ever you wrote)
