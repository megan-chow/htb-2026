import "./analytics.js";

// Store GitHub Repo Insights
const insights = JSON.parse(localStorage.getItem("insights"));
// const insights = localStorage.getItem("insights");
const commitDetails = insights.commitDetails;

export async function loadOverviewTab() {
  const container = document.getElementById("stats");
  if (!container) return;

  const res = await fetch("/components/overview-tab.html");
  container.innerHTML = await res.text();

  const commit_frequency = document.getElementById("commit-frequency");
  commit_frequency.innerHTML = "Total Commits: " + (await getTotalCommits());

  const open_pr = document.getElementById("open-pr");
  open_pr.innerHTML = "Open Pull Requests: " + (await getOpenPRs());

  console.log(localStorage.username);
  console.log("Commits: " + (await getTotalCommits()));
  console.log("Open PRs: " + (await getOpenPRs()));
}
window.loadOverviewTab = loadOverviewTab;

async function getUserName() {
  return localStorage.username;
}

async function getTotalCommits() {
  let name = localStorage.username;
  // const insights = JSON.parse(localStorage.getItem("insights"));
  const commitDetails = insights.commitDetails;

  if (commitDetails[name] && Array.isArray(commitDetails[name])) {
    return commitDetails[name].length;
  }
}

async function getLastCommit() {
  return commitDetails[0];
}

async function getOpenPRs() {
  let count = 0;
  const prs = insights.pullRequestStats;

  for (let i = 0; i < insights.pullRequestStats.length; i++) {
    if (
      insights.pullRequestStats[i].state.open &&
      insights.pullRequestStats[i].author.username === localData.username
    ) {
      count++;
    }
  }
  return count;
}

async function getOpenIssues() {}

async function getClosedIssues() {}

async function getGraph(graph_name) {}

async function getCommitsInRange() {}
