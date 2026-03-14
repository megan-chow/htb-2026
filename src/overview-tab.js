import "./analytics.js";

// Store GitHub Repo Insights
const insights = localStorage.getItem("insights");
const commitDetails = insights.commitDetails;

async function loadOverviewTab() {
  const container = document.getElementById("stats");
  if (!container) return;

  const res = await fetch("/components/overview-tab.html");
  container.innerHTML = await res.text();

  const commit_frequency = document.getElementById("commit-frequency");
  commit_frequency.innerHTML = "Total Commits: " + (await getTotalCommits());

  console.log(localStorage.username);
  getTotalCommits().then((result) => console.log(result));
  getOpenPRs().then((result) => console.log(result));
}
window.loadOverviewTab = loadOverviewTab;

async function getUserName() {
  return localStorage.username;
}

async function getTotalCommits() {
  let name = localStorage.username;
  const insights = JSON.parse(localStorage.getItem("insights"));
  const commitDetails = insights.commitDetails;

  if (commitDetails[name] && Array.isArray(commitDetails[name])) {
    return commitDetails[name].length;
  }
}

async function getCommitsInRange() {}

async function getLastCommit() {
  return commitDetails[0];
}

async function getOpenPRs() {
  // let count = 0;
  // for (let i = 0; i < localStorage.pullRequestStats.length; i++) {
  //   if (localStorage.pullRequestStats[i].state === "open") {
  //     count++;
  //   }
  // }
  // return count;
}

async function getOpenIssues() {}

async function getClosedIssues() {}

async function getGraph(graph_name) {}
