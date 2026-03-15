import "./analytics.js";
import Chart from "chart.js/auto";

function getInsights() {
  return JSON.parse(localStorage.getItem("insights"));
}

export async function loadOverviewTab() {
  const container = document.getElementById("stats");
  if (!container) return;

  const res = await fetch("/components/overview-tab.html");
  container.innerHTML = await res.text();

  const commit_frequency = document.getElementById("total-commit-container");
  commit_frequency.innerHTML = "Total Commits: " + (await getTotalCommits());

  const open_pr = document.getElementById("open-pr-container");
  open_pr.innerHTML = "Open Pull Requests: " + (await getOpenPRs());

  await displayLatestCommit();
  await displayUserName();
  await renderPRChart();
  await renderAddDeleteChart();

  // console.log(commitDetails);
  // console.log(localStorage.username);
  console.log("Commits: " + (await getTotalCommits()));
  console.log("Open PRs: " + (await getOpenPRs()));
  //console.log("Latest Commit: " + (await displayLatestCommit));
}
window.loadOverviewTab = loadOverviewTab;

async function displayUserName() {
  let username_container = document.getElementById("username-container");
  let userNameElement = document.createElement("h1");
  userNameElement.textContent = "@" + localStorage.username;
  username_container.appendChild(userNameElement);
}

async function getTotalCommits() {
  //Use contributors array instead

  let name = localStorage.username;

  // const insights = JSON.parse(localStorage.getItem("insights"));
  // const commitDetails = insights.commitDetails;

  // console.log("1" + insights.contributors.username);
  // console.log("2" + name);

  const insights = getInsights();
  for (let i = 0; i < insights.contributors.length; i++) {
    if (insights.contributors[i].username === name) {
      return insights.contributors[i].commits;
    }

    console.log("Working");
  }

  // if (Array.isArray(commitDetails[name])) {
  //   return commitDetails[name].length;
  // }
}

async function displayLatestCommit() {
  let name = localStorage.username;
  let message;

  let latest_commit = document.getElementById("latest-commit-container");
  let messageElement = document.createElement("p");
  let date_time;
  let latestCommitDate = document.createElement("p");
  let latestCommitTime = document.createElement("p");

  const insights = getInsights();
  const commitDetails = insights?.commitDetails || {};
  if (Array.isArray(commitDetails[name]) && !(commitDetails[name].length < 1)) {
    message = commitDetails[name][0].message;
    console.log(message);

    messageElement.textContent = "Message: " + message;

    date_time = commitDetails[name][0].date;
    date_time = date_time.split(/[T,Z]/);

    latestCommitDate.textContent = "Date: " + date_time[0];

    latestCommitTime.textContent = "Time: " + date_time[1];
  } else {
    messageElement.textContent = "No recent commits";
    latestCommitDate.textContent = "-";
    latestCommitTime.textContent = "-";
  }
  latest_commit.appendChild(messageElement);
  latest_commit.appendChild(latestCommitDate);
  latest_commit.appendChild(latestCommitTime);
}

async function getOpenPRs() {
  let count = 0;
  let name = localStorage.username;
  const insights = getInsights();
  const prs = insights.pullRequestStats;

  for (let i = 0; i < insights.pullRequestStats.length; i++) {
    if (
      insights.pullRequestStats[i].state === "open" &&
      insights.pullRequestStats[i].author.username === name
    ) {
      count++;
    }
  }
  return count;
}

async function getClosePRs() {
  let count = 0;
  let name = localStorage.username;
  const prs = insights.pullRequestStats;

  for (let i = 0; i < insights.pullRequestStats.length; i++) {
    if (
      insights.pullRequestStats[i].state === "closed" &&
      insights.pullRequestStats[i].author.username === name
    ) {
      count++;
    }
  }
  return count;
}

let prChart = null;
const owner = localStorage.getItem("owner");

async function buildPrPieData() {
  const labels = ["Closed PRs", "Opened PRs"];
  const data = [await getClosePRs(), await getOpenPRs()];

  return { labels, data };
}

async function renderPRChart() {
  const pr_container = document.getElementById("pr-pie-container");
  console.log("pr_container:", pr_container); // is it null?
  console.log("pr_container tag:", pr_container?.tagName); // is it CANVAS?

  if (!pr_container) return;

  const { labels, data } = await buildPrPieData();

  if (prChart) {
    prChart.destroy();
  }

  prChart = new Chart(pr_container, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          label: "Pull Requests",
          data,
          hoverOffset: 4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
        },
        legend: {
          display: true,
          position: "right",
        },
      },
    },
  });
}

let addDeleteChart = null;

async function buildAddDeletePieData() {
  const labels = ["Deleted Lines", "Added Lines"];
  const data = [await getClosePRs(), await getOpenPRs()];

  return { labels, data };
}

async function renderAddDeleteChart() {
  const pr_container = document.getElementById("pr-pie-container");
  console.log("pr_container:", pr_container); // is it null?
  console.log("pr_container tag:", pr_container?.tagName); // is it CANVAS?

  if (!pr_container) return;

  const { labels, data } = await buildPrPieData();

  if (addDeleteChart) {
    addDeleteChart.destroy();
  }

  addDeleteChart = new Chart(pr_container, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          label: "Pull Requests",
          data,
          hoverOffset: 4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
        },
        legend: {
          display: true,
          position: "right",
        },
      },
    },
  });
}

// function getClosedPR() {}

// window.addEventListener("DOMContentLoaded", () => {
//   renderLanguagesChart();
// });

// async function getOpenIssues() {}

// async function getClosedIssues() {}

// async function getGraph(graph_name) {}

// async function getCommitsInRange() {}
