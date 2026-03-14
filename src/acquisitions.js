import { Octokit } from "https://esm.sh/octokit?bundle";

import Chart from 'chart.js/auto';

// import {getContributorStats, getRepoDetails} from "./analytics.js";

const octokit = new Octokit({
  auth: import.meta.env.VITE_GITHUB_TOKEN, // or use environment variables in Node
});

const unix = 1742083200;
const date = new Date(unix * 1000);

const owner = localStorage.getItem("owner");
const repo = localStorage.getItem("repo");

// const insights = JSON.parse(localStorage.getItem("insights"));

let contributorChart = null;

function monthLabelFromUnix(unix) {
  return new Date(unix * 1000).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function getMonthLabelsForRepo(createdAt) {
  const labels = [];

  const now = new Date();
  const repoCreated = new Date(createdAt);

  const oneYearAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  let startDate;

  // If repo is less than a year old, start from creation month
  if (repoCreated > oneYearAgo) {
    startDate = new Date(repoCreated.getFullYear(), repoCreated.getMonth(), 1);
  } else {
    startDate = oneYearAgo;
  }

  const current = new Date(startDate);

  while (
    current.getFullYear() < now.getFullYear() ||
    (current.getFullYear() === now.getFullYear() &&
      current.getMonth() <= now.getMonth())
  ) {
    labels.push(
      current.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    );

    current.setMonth(current.getMonth() + 1);
  }

  return labels;
}

function buildDatasets(contributors, labels) {
  return contributors.map((contributor) => {
    const monthlyCommits = Object.fromEntries(labels.map(label => [label, 0]));

    for (const week of contributor.weeks) {
      const label = monthLabelFromUnix(week.w);

      if (monthlyCommits[label] !== undefined) {
        monthlyCommits[label] += week.c;
      }
    }

    return {
      label: contributor.author?.login || "Unknown",
      data: labels.map(label => monthlyCommits[label]),
      tension: 0.3,
    };
  });
}

 async function getContributorStats(owner, repo) {
  for (let i = 0; i < 5; i++) {
    const res = await octokit.request(
      "GET /repos/{owner}/{repo}/stats/contributors",
      { owner, repo }
    );

    if (res.status === 202) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      continue;
    }

    return res.data;
  }

  throw new Error("GitHub stats are still being generated. Try again.");
}


async function getRepoDetails(owner, repo) {
  const res = await octokit.request("GET /repos/{owner}/{repo}", {
    owner,
    repo,
  });

  return res.data;
}




async function renderContributorChart() {
  const [repoDetails, contributors] = await Promise.all([
    getRepoDetails(owner, repo),
    getContributorStats(owner, repo),
  ]);

  const labels = getMonthLabelsForRepo(repoDetails.created_at);
  const datasets = buildDatasets(contributors, labels);

  const ctx = document.getElementById("acquisitions");

  contributorChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets,
    },
    options: {
      responsive: true,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        title: {
          display: true,
          text: "Commits by Contributor per Month",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

renderContributorChart().catch(console.error);