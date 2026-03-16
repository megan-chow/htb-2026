import Chart from "chart.js/auto";

let contributorChart = null;
let languageChart = null;
let donutChart = null;
let selectedContributors = new Set();
let showOther = true;
const TOP_N = 4;

const unix = 1742083200;
const date = new Date(unix * 1000);

function getOwner() { return localStorage.getItem("owner"); }
function getRepo() { return localStorage.getItem("repo"); }
function getInsights() { return JSON.parse(localStorage.getItem("insights")); }

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
      }),
    );

    current.setMonth(current.getMonth() + 1);
  }

  return labels;
}

function buildDatasets(contributors, labels) {
  return contributors.map((contributor) => {
    const monthlyCommits = Object.fromEntries(
      labels.map((label) => [label, 0]),
    );

    for (const week of contributor.weeks || []) {
      const label = monthLabelFromUnix(week.w);

      if (monthlyCommits[label] !== undefined) {
        monthlyCommits[label] += week.c;
      }
    }

    return {
      label: contributor.author?.login || "Unknown",
      data: labels.map((label) => monthlyCommits[label]),
      tension: 0.3,
    };
  });
}

function buildLanguageData(languages) {
  const labels = Object.keys(languages);
  const data = Object.values(languages);

  return { labels, data };
}

function buildPRStatusCounts(pullRequests) {
  const counts = {
    Approved: 0,
    Denied: 0,
    Pending: 0,
  };

  for (const pr of pullRequests) {
    if (pr.merged) {
      counts.Approved++;
    } else if (pr.state === "open") {
      counts.Pending++;
    } else if (pr.state === "closed") {
      counts.Denied++;
    }
  }

  return counts;
}

function buildDonutData(counts) {
  return {
    labels: Object.keys(counts),
    data: Object.values(counts),
  };
}

function getTotalCommits(contributor) {
  return contributor.weeks.reduce((sum, week) => sum + week.c, 0);
}

function sortContributorsByTotal(contributors) {
  return [...contributors].sort(
    (a, b) => getTotalCommits(b) - getTotalCommits(a),
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
  const monthlyCommits = Object.fromEntries(labels.map((label) => [label, 0]));

  for (const contributor of contributors) {
    for (const week of contributor.weeks || []) {
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
    TOP_N,
  );

  const topContributorNames = new Set(
    topContributors.map((c) => c.author?.login || "Unknown"),
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

  if (!Array.isArray(insights.contributorStats) || insights.contributorStats.length === 0) {
    console.log("contributorStats not ready yet.");
    return;
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
          text: `Commits by Contributor per Month: ${getOwner()}/${getRepo()}`,
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

    if (!container || !insights) return;

  if (!insights.languages || typeof insights.languages !== "object") return;

  const { labels, data } = buildLanguageData(insights.languages);

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
                    text: `Languages Used: ${getOwner()}/${getRepo()}`,
                },
                legend: {
                    display: true,
                    position: 'right',
                },
            }
        }
    });
}

function renderPRDonutChart(pull) {
  const insights = JSON.parse(localStorage.getItem("insights"));
  const container = document.getElementById("pr-donut");

    if (!container || !insights) return;

  if (!Array.isArray(insights.pullRequestStats)) return;

  const counts = buildPRStatusCounts(insights.pullRequestStats);
  const { labels, data } = buildDonutData(counts);

  if (donutChart) {
    donutChart.destroy();
  }

    donutChart = new Chart(container, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{

                label:'PR Status',
                data,
                hoverOffset: 4,


            }],
        
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `PR Status: ${getOwner()}/${getRepo()}`,
                },
            },
            legend: {
                display: true,
                position: 'right',
            },
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
        `,
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

export function displayGraphs() {
  const insights = JSON.parse(localStorage.getItem("insights"));
  if (!insights) return;

  const statsDiv = document.getElementById("stats");
  if (!statsDiv) return;

  if (!Array.isArray(insights.contributorStats) || insights.contributorStats.length == 0) {
    statsDiv.innerHTML = `
      <p>Generating repository overview...</p>
    `;
    return;
  }

  statsDiv.innerHTML = `
    <div class="repo-graphs-layout">
      <div class="graph-card">
        <canvas id="acquisitions"></canvas>

        <input
          type="text"
          id="contributorSearch"
          placeholder="Search contributors"
        />
        <div id="contributorSelector"></div>

        <label>
          <input type="checkbox" id="toggleOther" checked />
          Show Other
        </label>
      </div>

      <div class="graph-card">
        <canvas id="language-pie"></canvas>
      </div>

      <div class="graph-card">
        <canvas id="pr-donut"></canvas>
      </div>
    </div>
  `;

  initializeContributorUI();
  renderContributorChart();
  renderLanguagesChart();
  renderPRDonutChart();
}

window.addEventListener("insightsReady", () => {
  console.log("insights ready listener");
  if(localStorage.getItem("tab") === "tab-repo") displayGraphs();
});
