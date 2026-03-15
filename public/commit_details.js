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

  // Uncomment the following line to render commit details
  renderCommitDetails(username);
});

export function renderCommitDetails(username) {
  console.log("rendering commit details");
  const insights = JSON.parse(localStorage.getItem("insights") || "{}");
  const commits = insights.commitDetails?.[username] || [];
  const output = document.getElementById("stats");
  output.innerHTML = "";

  commits.slice(0, 20).forEach((commit, commitIndex) => {
    const block = document.createElement("div");
    block.className = "commit-block";

    block.insertAdjacentHTML("beforeend", `
      <div class="commit-header">
        <strong>${commit.sha.slice(0, 7)}</strong> — ${commit.message}
        <br><small>${new Date(commit.date).toLocaleString()}</small>
      </div>
    `);

    // File selector row
    const selectorRow = document.createElement("div");
    selectorRow.className = "file-selector-row";

    const label = document.createElement("label");
    label.textContent = "Changed file";
    label.htmlFor = `file-sel-${commitIndex}`;

    const select = document.createElement("select");
    select.id = `file-sel-${commitIndex}`;

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent =
      `— ${commit.files.length} file${commit.files.length !== 1 ? "s" : ""} changed —`;
    select.appendChild(placeholder);

    commit.files.forEach((file, fileIndex) => {
      const opt = document.createElement("option");
      opt.value = fileIndex;
      opt.textContent = file.filename;
      select.appendChild(opt);
    });

    const meta = document.createElement("span");
    meta.className = "diff-meta";
    meta.innerHTML = `<span class="add">+0</span> <span class="del">-0</span>`;

    selectorRow.appendChild(label);
    selectorRow.appendChild(select);
    selectorRow.appendChild(meta);
    block.appendChild(selectorRow);

    // Diff output area
    const diffContainer = document.createElement("div");
    diffContainer.className = "diff-container";
    block.appendChild(diffContainer);

    select.addEventListener("change", () => {
      const fileIndex = select.value;
      if (fileIndex === "") {
        diffContainer.innerHTML = "";
        meta.innerHTML = `<span class="add">+0</span> <span class="del">-0</span>`;
        return;
      }

      const file = commit.files[Number(fileIndex)];
      meta.innerHTML = `<span class="add">+${file.additions}</span> <span class="del">-${file.deletions}</span>`;

      if (!file.patch) {
        diffContainer.innerHTML = `<div class="no-diff">No patch available.</div>`;
        return;
      }

      const fullDiff = `--- a/${file.filename}\n+++ b/${file.filename}\n${file.patch}`;

      diffContainer.innerHTML = diff2html(fullDiff, {
        inputFormat: "diff",
        outputFormat: "line-by-line",
        drawFileList: false,
        matching: "lines",
        colorScheme: "dark"
      });
    });

    output.appendChild(block);
  });
}