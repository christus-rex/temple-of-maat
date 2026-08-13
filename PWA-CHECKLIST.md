# PWA verification checklist

- [ ] GitHub Pages URL loads over HTTPS
- [ ] `manifest.webmanifest` returns successfully
- [ ] `sw.js` registers without console errors
- [ ] Install control appears when the app is not already installed
- [ ] App launches in standalone mode after installation
- [ ] Open the Temple online once, then switch device offline and reload
- [ ] Offline reload opens the cached Temple or offline fallback
- [ ] Console minimize / hide / restore behavior still works
- [ ] Chamber collection state persists
- [ ] Seal PNG and collectible downloads still work on the deployed origin
- [ ] Deep link such as `#chamber-01` opens the chamber artifact view
- [ ] After a future service-worker version bump, update prompt appears

- [ ] Footer displays **Site Administrator: Alberto Ramirez** and the clickable email **christus.kalki888@gmail.com**.

- [ ] Confirm the footer shows the copyright notice: © 2026 Alberto Ramirez. All rights reserved.
- [ ] Confirm `COPYRIGHT.md` is present in the published repository.
