# MyTasks — installable mobile To-Do app

A mobile-first, offline-capable Progressive Web App (PWA).

## Features
- Add tasks
- Mark tasks complete/pending
- Delete tasks
- All / Pending / Done filters
- Clear completed tasks
- Dark mode
- Local storage: tasks stay on the device
- Offline support after first load
- Installable on Android/iPhone as a home-screen app

## Quick test on a PC
Run a local web server from this folder:

Python 3:
`python -m http.server 8080`

Then open `http://localhost:8080`.

## Install on Android
For a direct install, host the folder on HTTPS (GitHub Pages, Netlify, Vercel, etc.), open the HTTPS address in Chrome on the phone, then use Chrome's **Install app** / **Add to Home screen** option.

## Important
The app stores tasks in browser localStorage. It does not use a server or account, so tasks do not automatically sync between devices.
