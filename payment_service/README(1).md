# cash_apps

A Flutter package that provides a simple interface to integrate **Mauritanian local payment APIs** for **transferring money to drivers' accounts**.

---

## Installation

Install the package directly from Git by adding it to your `pubspec.yaml`:

```yaml
dependencies:
  cash_apps:
    git:
        url: https://github.com/mohamedmv/cash_apps_package.git
```

Then run:

```bash
flutter pub get
```

---

## Import

```dart
import 'package:cash_apps/cash_apps.dart';
```

---

## Initialization

Create a `PaymentMethod` instance by providing:

* `baseUrl`: Your backend API base URL.
* `language`: Language of the payment flow (`"ar"`, `"fr"`, or `"en"`).
* `uid`: The user ID (required) to identify the connected user.

```dart
final payment = PaymentMethod(
  baseUrl: "http://10.0.2.2:3000",
  language: "fr", // ar | fr | en
  uid: 1,
);
```

---

## Configuration Parameters

| Parameter  | Type     | Description                                                         |
| ---------- | -------- | ------------------------------------------------------------------- |
| `baseUrl`  | `String` | Base URL of your backend that proxies the Mauritanian payment APIs. |
| `language` | `String` | Payment language: `ar`, `fr`, or `en`.                              |
| `uid`      | `int`    | Required user ID used for payment operations.                       |

---

## Example

```dart
final payment = PaymentMethod(
  baseUrl: "https://api.mybackend.com",
  language: "ar",
  uid: 42,
);
```

---

