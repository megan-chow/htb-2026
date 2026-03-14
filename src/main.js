import './style.css'
import { Octokit } from "https://esm.sh/octokit";

const octokit = new Octokit({
  auth: import.meta.env.VITE_GITHUB_TOKEN // or use environment variables in Node
});

document.getElementById("generateBtn").addEventListener("click", async () => {
  const url = document.getElementById("repoInput").value.trim();
  const output = document.getElementById("output");

  try {
    const { owner, repo } = parseRepoUrl(url);

    const insights = await generateInsights(owner, repo);

    output.textContent = JSON.stringify(insights, null, 2);
  } catch (err) {
    output.textContent = "Error: " + err.message;
  }
});

function parseRepoUrl(url) {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(\/|$)/);

  if (!match) {
    throw new Error("Invalid GitHub repository URL");
  }

  return { owner: match[1], repo: match[2] };
}

async function generateInsights(owner, repo) {
  const [commits, pulls, issues] = await Promise.all([
    getCommitActivity(owner, repo),
    getPullRequests(owner, repo),
    getIssues(owner, repo)
  ]);

  return {
    commitFrequency: commits,
    pullRequestStats: pulls,
    issueStats: issues
  };
}

async function getCommitActivity(owner, repo) {
  const res = await octokit.request(
    "GET /repos/{owner}/{repo}/stats/commit_activity",
    { owner, repo }
  );
  return res.data;
}

async function getPullRequests(owner, repo) {
  const res = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls",
    { owner, repo, state: "closed", per_page: 50 }
  );

  return res.data.map(pr => ({
    number: pr.number,
    created: pr.created_at,
    merged: pr.merged_at,
    timeToMergeHours: pr.merged_at
      ? (new Date(pr.merged_at) - new Date(pr.created_at)) / 36e5
      : null
  }));
}

async function getIssues(owner, repo) {
  const res = await octokit.request(
    "GET /repos/{owner}/{repo}/issues",
    { owner, repo, state: "closed", per_page: 50 }
  );

  return res.data.map(issue => ({
    number: issue.number,
    created: issue.created_at,
    closed: issue.closed_at,
    resolutionHours:
      (new Date(issue.closed_at) - new Date(issue.created_at)) / 36e5
  }));
}