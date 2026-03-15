// import { Octokit } from "https://esm.sh/octokit?bundle";

import Chart from 'chart.js/auto';

// import {getContributorStats, getRepoDetails} from "./analytics.js";

// const octokit = new Octokit({
//   auth: import.meta.env.VITE_GITHUB_TOKEN, // or use environment variables in Node
// });

let contributorChart = null;
let languageChart = null;
let selectedContributors = new Set();
let showOther = true;
const TOP_N = 4;

const unix = 1742083200;
const date = new Date(unix * 1000);

const owner = localStorage.getItem("owner");
const repo = localStorage.getItem("repo");

const insights = JSON.parse(localStorage.getItem("insights"));

// let contributorChart = null;

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

function buildLanguageData(languages) {
    const labels = Object.keys(languages);
    const data = Object.values(languages);

    return { labels, data};
}

function getTotalCommits(contributor) {
  return contributor.weeks.reduce((sum, week) => sum + week.c, 0);
}

function sortContributorsByTotal(contributors) {
  return [...contributors].sort(
    (a, b) => getTotalCommits(b) - getTotalCommits(a)
  );
}

function splitTopContributors(contributors, topN = 6) {
  const sorted = sortContributorsByTotal(contributors);

  return {
    topContributors: sorted.slice(0, topN),
    otherContributors: sorted.slice(topN),
  };
}

function buildOtherDataset(contributors, labels) {
  const monthlyCommits = Object.fromEntries(
    labels.map((label) => [label, 0])
  );

  for (const contributor of contributors) {
    for (const week of contributor.weeks) {
      const label = monthLabelFromUnix(week.w);

      if (monthlyCommits[label] !== undefined) {
        monthlyCommits[label] += week.c;
      }
    }
  }

  return {
    label: "Other",
    data: labels.map((label) => monthlyCommits[label]),
    tension: 0.3,
    borderDash: [5, 5],
  };
}

function getVisibleDatasets(allContributors, labels) {
  const { topContributors, otherContributors } = splitTopContributors(
    allContributors,
    TOP_N
  );

  const topContributorNames = new Set(
    topContributors.map((c) => c.author?.login || "Unknown")
  );

  const manuallySelected = allContributors.filter((c) => {
    const name = c.author?.login || "Unknown";
    return selectedContributors.has(name) && !topContributorNames.has(name);
  });

  const visibleContributors = [...topContributors, ...manuallySelected];
  const datasets = buildDatasets(visibleContributors, labels);

  if (showOther && otherContributors.length > 0) {
    datasets.push(buildOtherDataset(otherContributors, labels));
  }

  return datasets;
}

function renderContributorChart() {
  const insights = JSON.parse(localStorage.getItem("insights"));

  if (!insights) {
    console.log("No insights in localStorage yet.");
    return;
  }

  if (!insights.repoDetails?.created_at) {
    throw new Error("repoDetails.created_at is missing from insights");
  }

  if (!insights.contributorStats) {
    throw new Error("contributorStats is missing from insights");
  }

  const labels = getMonthLabelsForRepo(insights.repoDetails.created_at);
  const datasets = getVisibleDatasets(insights.contributorStats, labels);

  const ctx = document.getElementById("acquisitions");

  if (contributorChart) {
    contributorChart.destroy();
  }

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
          text: `Commits by Contributor per Month: ${owner}/${repo}`,
        },
        legend: {
          display: true,
          onClick(e, legendItem, legend) {
            const chart = legend.chart;
            const datasetIndex = legendItem.datasetIndex;
            const visible = chart.isDatasetVisible(datasetIndex);

            chart.setDatasetVisibility(datasetIndex, !visible);
            chart.update();
          },
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

function renderLanguagesChart(languages) {
    const insights = JSON.parse(localStorage.getItem("insights"));
    const container = document.getElementById("language-pie");

    


    if (!container) return;

    const { labels, data} = buildLanguageData(insights.languages);

    if (languageChart) {
        languageChart.destroy();
    }


    languageChart = new Chart(container, {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                label: 'Language Usage',
                data,
                hoverOffset: 4,
            }],
        },
        options: {
            responsive: true,
            plugins: {
                title: { 
                    display: true,
                    text: `Languages Used: ${owner}/${repo}`,
                },
                legend: {
                    display: true,
                    position: 'right',
                },
            }
        }
    });
}

function renderContributorSelector(allContributors) {
  const container = document.getElementById("contributorSelector");
  const searchInput = document.getElementById("contributorSearch");

  if (!container || !searchInput) return;

  const sorted = sortContributorsByTotal(allContributors);

  function drawList(filterText = "") {
    const lower = filterText.toLowerCase();

    const filtered = sorted.filter((c) => {
      const name = c.author?.login || "Unknown";
      return name.toLowerCase().includes(lower);
    });

    container.innerHTML = "";

    filtered.forEach((contributor) => {
      const name = contributor.author?.login || "Unknown";
      const total = getTotalCommits(contributor);
      const checked = selectedContributors.has(name);

      container.insertAdjacentHTML(
        "beforeend",
        `
        <label class="contributor-option">
          <input type="checkbox" data-name="${name}" ${checked ? "checked" : ""}>
          ${name} (${total})
        </label>
        `
      );
    });
  }

  drawList();

  searchInput.addEventListener("input", () => {
    drawList(searchInput.value);
  });

  container.addEventListener("change", (e) => {
    const checkbox = e.target.closest("input[type='checkbox']");
    if (!checkbox) return;

    const name = checkbox.dataset.name;

    if (checkbox.checked) {
      selectedContributors.add(name);
    } else {
      selectedContributors.delete(name);
    }

    renderContributorChart();
  });
}

function initializeContributorUI() {
  const insights = JSON.parse(localStorage.getItem("insights"));
  if (!insights?.contributorStats) return;

  renderContributorSelector(insights.contributorStats);

  const otherToggle = document.getElementById("toggleOther");
  if (otherToggle) {
    otherToggle.checked = showOther;

    otherToggle.addEventListener("change", () => {
      showOther = otherToggle.checked;
      renderContributorChart();
    });
  }
}

window.addEventListener("insightsReady", () => {
  initializeContributorUI();
  renderContributorChart();
  renderLanguagesChart();
});

window.addEventListener("DOMContentLoaded", () => {
  initializeContributorUI();
  renderContributorChart();
  renderLanguagesChart();
});








// async function renderContributorChart() {
//   const [repoDetails, contributors] = await Promise.all([
//     getRepoDetails(owner, repo),
//     getContributorStats(owner, repo),
//   ]);

//   const labels = getMonthLabelsForRepo(repoDetails.created_at);
//   const datasets = buildDatasets(contributors, labels);

//   const ctx = document.getElementById("acquisitions");

//   contributorChart = new Chart(ctx, {
//     type: "line",
//     data: {
//       labels,
//       datasets,
//     },
//     options: {
//       responsive: true,
//       interaction: {
//         mode: "index",
//         intersect: false,
//       },
//       plugins: {
//         title: {
//           display: true,
//           text: "Commits by Contributor per Month",
//         },
//       },
//       scales: {
//         y: {
//           beginAtZero: true,
//         },
//       },
//     },
//   });
// }

// renderContributorChart().catch(console.error);