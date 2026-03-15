import "./analytics.js";

// Store GitHub Repo Insights
const insights = JSON.parse(localStorage.getItem("insights"));
// const insights = localStorage.getItem("insights");
const commitDetails = insights.commitDetails;

async function loadOverviewTab() {
  const container = document.getElementById("stats");
  if (!container) return;

  const res = await fetch("/components/overview-tab.html");
  container.innerHTML = await res.text();

  const commit_frequency = document.getElementById("total-commit");
  commit_frequency.innerHTML = "Total Commits: " + (await getTotalCommits());

  const open_pr = document.getElementById("open-pr");
  open_pr.innerHTML = "Open Pull Requests: " + (await getOpenPRs());

  await displayLatestCommit();
  console.log(commitDetails);
  console.log(localStorage.username);
  console.log("Commits: " + (await getTotalCommits()));
  console.log("Open PRs: " + (await getOpenPRs()));
  //console.log("Latest Commit: " + (await displayLatestCommit));
}
window.loadOverviewTab = loadOverviewTab;

async function getUserName() {
  return localStorage.username;
}

async function getTotalCommits() {
  //Use contributors array instead

  let name = localStorage.username;

  // const insights = JSON.parse(localStorage.getItem("insights"));
  // const commitDetails = insights.commitDetails;

  // console.log("1" + insights.contributors.username);
  // console.log("2" + name);

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
  let message = commitDetails[name][0].message;
  if (!(commitDetails[name].length < 1)) {
    console.log(message);

    const latest_commit = document.getElementById("latest-commit");
    const messageElement = document.createElement("p");

    messageElement.textContent = "Message: " + message;
    latest_commit.appendChild(messageElement);

    console.log("help");
    let date_time = commitDetails[name][0].date;
    date_time = date_time.split(/[T,Z]/);
    console.log(date_time);

    const latestCommitDate = document.createElement("p");
    latestCommitDate.textContent = "Date: " + date_time[0];
    latest_commit.appendChild(latestCommitDate);

    const latestCommitTime = document.createElement("p");
    latestCommitTime.textContent = "Time: " + date_time[1];
    latest_commit.appendChild(latestCommitTime);
  } else {
    document.getElementById("latest-commit");
  }
}

async function getOpenPRs() {
  let count = 0;
  let name = localStorage.username;
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

async function getOpenIssues() {}

async function getClosedIssues() {}

async function getGraph(graph_name) {}

async function getCommitsInRange() {}

//Test
