# Spots

A responsive photo-sharing frontend built with HTML, CSS, JavaScript, and Vite. Browse photos, update your profile, and interact with an API-backed gallery.

Created by Cesar Chirino as a TripleTen project and refined with responsive layouts, accessible modals, and organized component styles.

## Features

- Edit your profile name, biography, and avatar.
- Use a bundled local avatar fallback when the profile image is missing or fails to load.
- Add photo posts using an image URL and caption.
- Like and unlike posts.
- Delete your own posts through a confirmation dialog.
- Open photos in an image-preview modal.
- Validate form inputs and display field-level errors.
- Show loading states during form submissions.

## Responsive Design and Accessibility

- Three-column desktop, two-column tablet, and single-column mobile gallery layouts.
- Responsive profile, form, and image-preview layouts.
- Keyboard focus indicators and keyboard-accessible photo previews.
- Modal closing through the close button, Escape, or overlay.
- Focus containment inside open modals and focus restoration when closed.
- Background scroll locking while a modal is open.
- Reduced-motion styles for users who request less animation.

## Technology

- HTML
- CSS with BEM-style component naming
- JavaScript ES modules
- Vite for development and production builds
- Fetch-based API client

## Local Development

Install a Node.js version compatible with the project's Vite dependency, together with npm.

```bash
git clone https://github.com/tito1718/spots-frontend.git
cd spots-frontend
npm ci
npm run dev
```

Use the local address printed by Vite. API-dependent features also require working API configuration and network access.

## Available Commands

| Command           | Purpose                                           |
| ----------------- | ------------------------------------------------- |
| `npm run dev`     | Start the development server and open the browser |
| `npm run build`   | Generate the production build in `dist/`          |
| `npm run preview` | Preview the production build locally              |

Run `npm run build` before starting a production preview. The preview server is for local verification, not production hosting.

## Project Organization

- `index.html` — page markup, templates, and modal forms.
- `src/pages/index.js` — page initialization and interaction wiring.
- `src/pages/index.css` — stylesheet imports.
- `src/blocks/` — component styles and shared interaction rules.
- `src/utils/Api.js` — API client.
- `src/utils/helpers.js` — modal and loading-state helpers.
- `src/scripts/validation.js` — form validation.
- `src/images/` — bundled images and icons.
- `src/vendor/` — font declarations, font files, and normalization styles.

Component styles live with their corresponding block. `refinements.css` contains shared transitions, focus indicators, hover effects, and reduced-motion rules. Meaningful section comments keep source files easy to navigate.

## API Integration

The frontend loads gallery and profile data through its API client. It does not currently use browser `localStorage` or `sessionStorage` for persistence.

The separate Spots backend is maintained in [spots-backend](https://github.com/tito1718/spots-backend). Its expanded capabilities should not be assumed to be available in this frontend until integration is completed and tested.

Do not commit private server credentials or secrets. Values shipped in frontend JavaScript are visible to users.

## Assets

Active icons have descriptive filenames. Unused sample photos and obsolete icon variants have been removed.

The current profile fallback is bundled with the application, so it does not depend on a third-party image URL. Gallery photos supplied through external URLs still depend on their respective hosts.

## Verification

Before committing changes:

```bash
npm run build
git diff --check
```

Also verify desktop and mobile layouts, long text, form validation, image previews, modal keyboard behavior, and loading states in the browser. A successful build alone does not verify visual behavior or API integration.

## Original Design

[View the original Spots design in Figma](https://www.figma.com/file/BBNm2bC3lj8QQMHlnqRsga/Sprint-3-Project-%E2%80%94-Spots?type=design&node-id=2%3A60&mode=design&t=afgNFybdorZO6cQo-1)

The current interface builds on the original design with additional visual and accessibility refinements.

## Historical Deployment

[Original GitHub Pages deployment](https://tito1718.github.io/se_project_spots/)

This historical deployment may not reflect the current repository.

## Project Pitch Videos

- [Stage 2 — February 16, 2026](https://drive.google.com/file/d/1BjCO97bqkg8_Ys9_1gIXQbi-gIEdz9Sl/view?usp=sharing)
- [Stage 9 — April 5, 2026](https://www.loom.com/share/5e626d7134af49cbb574b3efabe6e1f2)
- [Final Stage — May 5, 2026](https://www.loom.com/share/851da114a00748d28464fc934010df4f)

## Author

[Cesar Chirino](https://github.com/tito1718)

## License

ISC, as declared in `package.json`.
