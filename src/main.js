import "./style.css";
import { Octokit } from "https://esm.sh/octokit";

const octokit = new Octokit({
  auth: import.meta.env.VITE_GITHUB_TOKEN, // or use environment variables in Node
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
  const [contributors, commits, commitDetails, pulls, issues, authors] = await Promise.all([
    getContributors(owner, repo),
    getCommitActivity(owner, repo),
    getContributorChanges(owner, repo),
    getPullRequests(owner, repo),
    getIssues(owner, repo),
    getAuthors(owner, repo),
  ]);

  return {
    contributors: contributors, 
    commitFrequency: commits,
    commitDetails: commitDetails,
    pullRequestStats: pulls,
    issueStats: issues,
    authors: authors,
  };
}

async function getContributors(owner, repo) {
  const res = await octokit.request(
    "GET /repos/{owner}/{repo}/contributors",
    { owner, repo }
  );

  return res.data.map(c => ({
    login: c.login,
    avatar: c.avatar_url,
    url: c.html_url,
    commits: c.contributions
  }));
}

async function getCommitActivity(owner, repo) {
  const res = await octokit.request(
    "GET /repos/{owner}/{repo}/stats/commit_activity",
    { owner, repo },
  );
  return res.data;
}

async function getRecentCommits(owner, repo, limit = 20) {
  const res = await octokit.request("GET /repos/{owner}/{repo}/commits", {
    owner,
    repo,
    per_page: limit
  });

  return res.data; // array of commits
}

async function getCommitDetails(owner, repo, sha) {
  const res = await octokit.request(
    "GET /repos/{owner}/{repo}/commits/{sha}",
    { owner, repo, sha }
  );

  return res.data; // includes files[], patch, additions, deletions
}

async function getContributorChanges(owner, repo) {
  const commits = await getRecentCommits(owner, repo);

  const contributors = {};

  for (const commit of commits) {
    const sha = commit.sha;
    const author = commit.author?.login || "Unknown";

    const details = await getCommitDetails(owner, repo, sha);

    if (!contributors[author]) {
      contributors[author] = [];
    }

    for (const file of details.files) {
      contributors[author].push({
        sha,
        filename: file.filename,
        additions: file.additions,
        deletions: file.deletions,
        patch: file.patch
      });
    }
  }

  return contributors;
}



async function getPullRequests(owner, repo) {
  const res = await octokit.request("GET /repos/{owner}/{repo}/pulls", {
    owner,
    repo,
    state: "closed",
    per_page: 50,
  });

  return res.data.map((pr) => ({
    number: pr.number,
    created: pr.created_at,
    merged: pr.merged_at,
    timeToMergeHours: pr.merged_at
      ? (new Date(pr.merged_at) - new Date(pr.created_at)) / 36e5
      : null,
  }));
}

async function getIssues(owner, repo) {
  const res = await octokit.request("GET /repos/{owner}/{repo}/issues", {
    owner,
    repo,
    state: "closed",
    per_page: 50,
  });

  return res.data.map((issue) => ({
    number: issue.number,
    created: issue.created_at,
    closed: issue.closed_at,
    resolutionHours:
      (new Date(issue.closed_at) - new Date(issue.created_at)) / 36e5,
  }));
}

async function getAuthors(owner, repo) {
  const res = await octokit.request("GET /repos/{owner}/{repo}/commits", {
    owner,
    repo,
  });

  let author = [];
  res.data.forEach((commit) => {
    author.push(commit.commit.author.name);
  });

  const uniqueAuthors = [...new Set(author)];

  // console.log(res.data);
  // console.log(author);
  // console.log(uniqueAuthors);

  return uniqueAuthors;
}
