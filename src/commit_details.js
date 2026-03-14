import { html as diff2html } from 'diff2html';
import "diff2html/bundles/css/diff2html.min.css";

// Listener for contributor selector
document.querySelector(".userTabslist").addEventListener("click", e => {
  const contributor = e.target.closest(".contributor");
  if (!contributor) return;

  const username = contributor.querySelector(".contributor-name").textContent;
  // console.log("Clicked contributor:", username);

  // Do stuff
  document.getElementById("contributorResultsHeading").textContent = "Analytics for contributer " + username;
  renderCommitDetails(username);
});

// function renderCommitDetails(username) {
//   const insights = JSON.parse(localStorage.getItem("insights") || "{}");;
//   let commits = insights.commitDetails;
//   let max_commits = 20;
//   let i = 0;
//   let output = document.getElementById("stats");


//   while (i < max_commits && i < commits[username].length) {
//     console.log("i: " + i);
//     const file = commits[username][i]; // assuming each entry has filename + patch
//     const patch = file.patch;
//     if (!patch) {
//       i++;
//       continue;
//     } 

//     // Reconstruct a valid unified diff with file headers
//     const fullDiff = `--- a/${file.filename}\n+++ b/${file.filename}\n${patch}`;
//     // console.log(commits[username][i].patch)
//     const diff_html = diff2html(fullDiff, {
//       inputFormat: "diff",
//       showFiles: false,
//       matching: "lines",
//       outputFormat: "line-by-line"
//     });
//     output.insertAdjacentHTML("beforeend", `
//       <div class="commit-breakdown">
//         <div class="commit-timestamp"></div>
//         <div class="commit-code-diff">
//           ${diff_html}
//         </div>
//       </div>
//     `);
//     i++;
//   }
// }

function renderCommitDetails(username) {
  const insights = JSON.parse(localStorage.getItem("insights") || "{}");
  const commits = insights.commitDetails?.[username] || [];

  const output = document.getElementById("stats");
  output.innerHTML = "";

  commits.slice(0, 20).forEach((commit, commitIndex) => {
    // Commit header
    output.insertAdjacentHTML("beforeend", `
      <div class="commit-block">
        <div class="commit-header">
          <strong>${commit.sha.slice(0, 7)}</strong> — ${commit.message}
          <br><small>${new Date(commit.date).toLocaleString()}</small>
        </div>

        <div class="file-list" id="file-list-${commitIndex}">
          ${commit.files.map((file, fileIndex) => `
            <div class="file-entry" 
              data-commit="${commitIndex}" 
              data-file="${fileIndex}">
              ${file.filename}
            </div>
          `).join("")}
        </div>

        <div class="file-diff-container" id="diff-${commitIndex}"></div>
      </div>
    `);
  });

  // Add click listener for file selection
  output.addEventListener("click", e => {
    const fileEntry = e.target.closest(".file-entry");
    if (!fileEntry) return;

    const commitIndex = fileEntry.dataset.commit;
    const fileIndex = fileEntry.dataset.file;

    const commit = commits[commitIndex];
    const file = commit.files[fileIndex];

    const diffContainer = document.getElementById(`diff-${commitIndex}`);

    // Toggle behavior: hide if already open
    if (diffContainer.dataset.open === fileIndex) {
      diffContainer.innerHTML = "";
      diffContainer.dataset.open = "";
      return;
    }

    // Build unified diff
    const fullDiff = `--- a/${file.filename}\n+++ b/${file.filename}\n${file.patch}`;

    const diffHtml = diff2Html(fullDiff, {
      inputFormat: "diff",
      outputFormat: "line-by-line",
      showFiles: false,
      matching: "lines"
    });

    diffContainer.innerHTML = `
      <h4>${file.filename}</h4>
      ${diffHtml}
    `;
    diffContainer.dataset.open = fileIndex;
  });
}
