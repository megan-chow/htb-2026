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

document.getElementById("showPRsBtn").addEventListener("click", () => {
    const insights = JSON.parse(localStorage.getItem("insights"));
    const prs = insights.pullRequestStats;
    const statsDiv = document.getElementById("stats");

    statsDiv.innerHTML = prs.map((pr) => `
        <div>
            <strong>#${pr.number} ${pr.title}</strong> [${pr.state}]<br/>
            <img src="${pr.author.avatar}" width="20"/> ${pr.author.username}<br/>
            Opened: ${new Date(pr.created).toLocaleDateString()}
            ${pr.labels.length ? `| Labels: ${pr.labels.join(", ")}` : ""}
        </div>
        <hr/>
    `).join("");
});
