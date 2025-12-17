# Contributing to VibeSync

First off, thanks for taking the time to contribute! 🎉 

VibeSync is built and maintained by **GitMaster254**, **Hedmon0094**, and amazing community members like you.

## 🛠️ Tech Stack
* **Core:** React 18, TypeScript, Vite
* **Styling:** Tailwind CSS, shadcn/ui
* **Audio:** Howler.js (or native Audio API)
* **Backend:** Vercel Serverless Functions

## 🚀 Getting Started

1.  **Fork and Clone**
    ```bash
    git clone [https://github.com/GitMaster254/vibesync.git](https://github.com/GitMaster254/vibesync.git)
    cd vibesync
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:8080](http://localhost:8080) to see the app.

## 📂 Project Structure

* `src/components`: Reusable UI components.
* `src/pages`: Main application views.
* `src/lib`: Utility functions and helpers.
* `api/`: Serverless backend functions (Spotify proxy, Metadata).

## 📝 Pull Request Process

1.  **Branching:** Create a new branch for your feature or fix.
    * `feat/new-player-ui`
    * `fix/metadata-bug`
2.  **Commits:** We prefer [Conventional Commits](https://www.conventionalcommits.org/).
    * `feat: add visualization support`
    * `fix: resolve cors issue in proxy`
3.  **Linting:** Ensure your code passes linting.
    ```bash
    npm run lint
    ```
4.  **Submit:** Open a PR against the `main` branch. Provide a clear description and screenshots if UI changed.

## 🤝 Code of Conduct
Please note that this project is released with a [Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

Happy Coding! 🎧