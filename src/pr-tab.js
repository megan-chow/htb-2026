import "./style.css";
import { Octokit } from "https://esm.sh/octokit?bundle";
const octokit = new Octokit({
    auth: import.meta.env.VITE_GITHUB_TOKEN,
});
window.addEventListener("DOMContentLoaded", async () =>{
    // search URL
    const params = new URLSearchParams(window.location.search);
    // gets owner of repo
    const owner = params.get("owner");
    // get repo
    const repo = params.get("repo");
});

const insights = JSON.parse(localStorage.getItem("insights"));
const prs = insights.pullRequestStats;
console.log(prs);
