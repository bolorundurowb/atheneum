# Atheneum

[![Play Store](https://github.com/bolorundurowb/atheneum-app/raw/master/google-play-badge.png)](https://play.google.com/store/apps/details?id=com.bolorundurowb.atheneum)

A cross-platform mobile app for managing your personal book collection. Track what you own, who you've lent books to, and what you want to read next — all from your phone.

## Features

### Book Library
- **Add books by ISBN** — scan a barcode with your device camera (using on-device ML Kit) and book details are fetched automatically from Google Books and Open Library.
- **Add books manually** — enter title, authors, publisher, ISBN, and cover art when a barcode isn't available.
- **Search and filter** your collection by title, author, publisher, year, ISBN, or availability.
- **Browse by author or publisher** — see all the authors and publishers represented in your library with quick-filtering.

### Borrowing Tracker
- Mark a book as lent out and **record who borrowed it**.
- Mark a book as returned — the app tracks **full borrowing history** including borrower names and dates.

### Wishlist
- Keep a list of **books you want to acquire**.
- When you add a wishlisted book to your library, it's **automatically removed** from your wishlist.

### Statistics
- Get an at-a-glance summary of your collection: **total books, authors, publishers, and wishlist items**.

### Account & Security
- Register with your email, verify your account, and sign in securely.
- **Forgot password** flow with email-based reset codes.
- Update your profile name and change your password.
- **Delete your account** and all associated data in one action.

### Cross-Platform
- Available on **Android** (Google Play) and **iOS**.
- Built with Ionic + Capacitor for a native-quality mobile experience.


## Architecture

| Layer       | Stack                           |
|-------------|---------------------------------|
| Frontend    | Angular + Ionic + Capacitor     |
| Backend     | NestJS (Node.js)                |
| Database    | MongoDB (Mongoose ODM)          |
| Auth        | JWT + Passport                  |
| Email       | Mailgun                         |
| ISBN Lookup | Google Books API + Open Library |


## Getting Started (Development)

### Prerequisites
- Node.js 24+
- MongoDB instance
- Mailgun account (for email features)

### API Setup

```bash
cd api
cp .env.example .env   # configure your DB_URL, SECRET, MAILGUN_API_KEY, MAILGUN_DOMAIN
npm install
npm run start:dev
```

### App Setup

```bash
cd app
npm install
npm start              # opens in browser at http://localhost:4200
```

To build for mobile:

```bash
npx cap sync
npx cap open android   # or npx cap open ios
```


## License

AGPL-3.0
