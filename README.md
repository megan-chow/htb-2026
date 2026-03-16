# C:/mahv: GitHub Analytics
A web-based analytics dashboard for exploring GitHub repository activity. Enter any public repo URL to instantly visualize contributor stats, commit history, pull request timelines, code diffs, and language breakdowns.

Built with vanilla JS, Vite, Chart.js, Octokit, and diff2html.

## Features:

- Per-contributor overviews with commit insights and latest activity, and open PRs
- Paginated commit browser with syntax-highlighted diffs
- Pull request explorer with review, comment, and merge-time details
- Repo-wide charts for commit frequency, language distribution, and PR status


## Useful Links

- [Live Site](https://htb-2026.fly.io/)

## Getting Started

### Install Dependencies
```powershell
npm install
```

### Running the Application

```powershell
npm run dev
```

**Requirements:**

- Set `VITE_GITHUB_TOKEN` environment variable with your GitHub token

### Building the Application

```powershell
npm run build
```