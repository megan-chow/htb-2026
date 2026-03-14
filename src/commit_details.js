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

function renderCommitDetails(username) {
  const insights = JSON.parse(localStorage.getItem("insights") || "{}");;
  let commits = insights.commitDetails;
  let max_commits = 20;
  let i = 0;
  let output = document.getElementById("stats");


  while (i < max_commits && i < commits[username].length) {
    console.log("i: " + i);
    const file = commits[username][i]; // assuming each entry has filename + patch
    const patch = file.patch;
    if (!patch) {
      i++;
      continue;
    } 

    // Reconstruct a valid unified diff with file headers
    const fullDiff = `--- a/${file.filename}\n+++ b/${file.filename}\n${patch}`;
    // console.log(commits[username][i].patch)
    const diff_html = diff2html(fullDiff, {
      inputFormat: "diff",
      showFiles: false,
      matching: "lines",
      outputFormat: "line-by-line"
    });
    output.insertAdjacentHTML("beforeend", `
      <div class="commit-breakdown">
        <div class="commit-timestamp"></div>
        <div class="commit-code-diff">
          ${diff_html}
        </div>
      </div>
    `);
    i++;
  }
}

