import "./analytics.js";

// Store GitHub Repo Insights
const insights = localStorage.getItem("insights");

async function loadOverviewTab() {
  const container = document.getElementById("stats");
  if (!container) return;

  const res = await fetch("/components/overview-tab.html");
  container.innerHTML = await res.text();

  console.log(localStorage.username);
  console.log(getTotalCommits());
}
window.loadOverviewTab = loadOverviewTab;

async function getUserName() {
  return localStorage.username;
}

async function getTotalCommits() {
  // localStorage.insights.commitDetails.length();
  // localStorage.insights.commitDetails.foreach();
  // {
  //   if (localStorage.insights.commitDetails.isArray(username)) {
  //     return localStorage.insights.commitDetails.username.length;
  //   }
  // }
}

async function getCommitsInRange() {}

async function getLastCommit() {}

async function getOpenPRs() {}

async function getOpenIssues() {}

async function getClosedIssues() {}

async function getGraph(graph_name) {}
