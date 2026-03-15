import Chart from "chart.js/auto";

// let languageChart = null;

// function buildLanguageData(languages) {
//   const labels = Object.keys(languages);
//   const data = Object.values(languages);

//   return { labels, data };
// }

// export function renderLanguagesChart(languages) {
//   const insights = JSON.parse(localStorage.getItem("insights"));
//   const container = document.getElementById("language-pie");

//   if (!container) return;

//   const { labels, data } = buildLanguageData(insights.languages);

//   if (languageChart) {
//     languageChart.destroy();
//   }

//   languageChart = new Chart(container, {
//     type: "pie",
//     data: {
//       labels,
//       datasets: [
//         {
//           label: "Language Usage",
//           data,
//           hoverOffset: 4,
//         },
//       ],
//     },
//     options: {
//       responsive: true,
//       plugins: {
//         title: {
//           display: true,
//           text: `Languages Used: ${owner}/${repo}`,
//         },
//         legend: {
//           display: true,
//           position: "right",
//         },
//       },
//     },
//   });
// }

// window.addEventListener("DOMContentLoaded", () => {
//   renderLanguagesChart();
// });
