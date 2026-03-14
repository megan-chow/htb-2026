import "./style.css";
import { Octokit } from "https://esm.sh/octokit?bundle";

const octokit = new Octokit({
  auth: import.meta.env.VITE_GITHUB_TOKEN, // or use environment variables in Node
});

window.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const output = document.getElementById("output");

  const owner = params.get("owner");
  const repo = params.get("repo");

  if (owner && repo) {
    try {
      // Pre-fill the search bar
      document.getElementById("repoInput").value =
        `https://github.com/${owner}/${repo}`;

      const insights = await generateInsights(owner, repo);
      // output.textContent = JSON.stringify(insights, null, 2);
      localStorage.setItem("insights", JSON.stringify(insights));
    } catch (err) {
      output.textContent = "Error: " + err.message;
    }
  }
});

document.getElementById("generateBtn").addEventListener("click", async () => {
  const url = document.getElementById("repoInput").value.trim();
  const output = document.getElementById("output");

  try {
    const { owner, repo } = parseRepoUrl(url);

    // Redirect to analytics page with query param
    window.location.href = `analytics.html?owner=${owner}&repo=${repo}`;
  } catch (err) {
    output.textContent = "Error: " + err.message;
  }
});

// document.getElementById("generateBtn").addEventListener("click", async () => {
//   const url = document.getElementById("repoInput").value.trim();
//   const output = document.getElementById("output");

//   try {
//     const { owner, repo } = parseRepoUrl(url);

//     const insights = await generateInsights(owner, repo);

//     output.textContent = JSON.stringify(insights, null, 2);
//   } catch (err) {
//     output.textContent = "Error: " + err.message;
//   }
// });

function parseRepoUrl(url) {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(\/|$)/);

  if (!match) {
    throw new Error("Invalid GitHub repository URL");
  }

  return { owner: match[1], repo: match[2] };
}

async function generateInsights(owner, repo) {
  const [contributors, commits, commitDetails, pulls, issues, authors] =
    await Promise.all([
      getContributors(owner, repo),
      getCommitActivity(owner, repo),
      getContributorChanges(owner, repo),
      getPullRequests(owner, repo),
      getIssues(owner, repo),
      getAuthors(owner, repo),
    ]);

  renderContributors(contributors);

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
  const res = await octokit.request("GET /repos/{owner}/{repo}/contributors", {
    owner,
    repo,
  });

  return res.data.map((c) => ({
    username: c.login,
    avatar: c.avatar_url,
    url: c.html_url,
    commits: c.contributions,
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
    per_page: limit,
  });

  return res.data; // array of commits
}

async function getCommitDetails(owner, repo, sha) {
  const res = await octokit.request("GET /repos/{owner}/{repo}/commits/{sha}", {
    owner,
    repo,
    sha,
  });

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
        patch: file.patch,
      });
    }
  }

  return contributors;
}

async function getPullRequests(owner, repo) {
  const res = await octokit.request("GET /repos/{owner}/{repo}/pulls", {
    owner,
    repo,
    state: "all",
    per_page: 50,
  });

  return res.data.map((pr) => ({
    number: pr.number,
    title: pr.title,
    state: pr.state,
    author: {
      username: pr.user.login,
      avatar: pr.user.avatar_url,
    },
    labels: pr.labels.map((l) => l.name),
    sourceBranch: pr.head.ref,
    targetBranch: pr.base.ref,
    created: pr.created_at,
    closed: pr.closed_at,
    merged: pr.merged_at,
    description: pr.body,
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

function renderContributors(contributors) {
  let user_list = document.querySelector(".userTabslist");

  user_list.innerHTML = "";
  contributors.forEach((c) => {
    user_list.insertAdjacentHTML(
      "beforeend",
      `
      <div class="contributor">
        <img src="${c.avatar}" alt="avatar"/>
        <p class="contributor-name">${c.username}</p>
      </div>
    `,
    );
  });
}

// Listener for contributor selector
document.querySelector(".userTabslist").addEventListener("click", (e) => {
  const contributor = e.target.closest(".contributor");
  if (!contributor) return;

  const username = contributor.querySelector(".contributor-name").textContent;
  // console.log("Clicked contributor:", username);

  // Do stuff
  document.getElementById("contributorResultsHeading").textContent =
    "Analytics for contributer " + username;
});
