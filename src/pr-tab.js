import "./style.css";
import { html as diff2html } from "diff2html";
import "diff2html/bundles/css/diff2html.min.css";


export function initPRList() {
    const insights = JSON.parse(localStorage.getItem("insights"));
    const prs = insights.pullRequestStats;
        // replace later with the actual div
    const statsDiv = document.getElementById("stats");
    console.log(prs.length, prs.map(pr => pr.number));

    statsDiv.innerHTML = prs.map((pr) => {
        const statusLabel = pr.state === "open" ? "Pending Approval" : pr.merged ? "Approved" : "Denied";
        const statusColor = pr.state === "open" ? "#f5a523" : pr.merged ? "#2ecc70" : "#e74c3c";
        const statusBg = pr.state === "open" ? "#39363030" : pr.merged ? "#2ecc7030" : "#e74c3c30";
        return `
            <div onclick="showPRDetail(${pr.number})" style="cursor:pointer; background:#202429; border: 2px solid #aaaaaa; padding: 8px; border-radius: 6px; margin-bottom: 8px;">
                <strong>#${pr.number} ${pr.title}</strong>
                <span style="margin-left:8px; padding: 2px 8px; border-radius: 12px; font-size: 0.75em; background:${statusBg}; color:${statusColor}; border: 1px solid ${statusColor};">● ${statusLabel}</span><br/>
                <img src="${pr.author.avatar}" width="20" style="border-radius: 10px"/> ${pr.author.username}<br/>
                Opened: ${new Date(pr.created).toLocaleDateString()}
                ${pr.labels.length ? `| Labels: ${pr.labels.join(", ")}` : ""}
            </div>
    `;
    }).join("");
}

export function showPRDetail(pNumber) {
    const insights = JSON.parse(localStorage.getItem("insights"));
    const pr = insights.pullRequestStats.find(p => p.number === pNumber);
    // replace later with the actual div
    const statsDiv = document.getElementById("stats");

        statsDiv.innerHTML = `
        <button onclick="initPRList()">← Back</button>
        <h2>#${pr.number} ${pr.title}</h2>
        <p><strong>Author:</strong> <img src="${pr.author.avatar}" width="20" style="border-radius:50%"/> ${pr.author.username}</p>
        <p><strong>State:</strong> ${pr.state}</p>
        <p><strong>Branch:</strong> ${pr.sourceBranch} → ${pr.targetBranch}</p>
        <p><strong>Opened:</strong> ${new Date(pr.created).toLocaleDateString()}</p>
        <p><strong>Description:</strong> ${pr.description || "None"}</p>

        <h3>Files Changed (${pr.files.length})</h3>
        ${pr.files.map(f => `<div>${f.filename} +${f.additions} -${f.deletions}</div>`).join("")}

        <h3>Commits (${pr.commits.length})</h3>
        ${pr.commits.map(c => `<div>${c.sha.slice(0,7)} - ${c.commit.message}</div>`).join("")}

        <h3>Reviews (${pr.reviews.length})</h3>
        ${pr.reviews.map(r => `<div>${r.user.login}: ${r.state}</div>`).join("") || "No reviews"}

        <h3>Comments (${pr.comments.length})</h3>
        ${pr.comments.map(c => `<div>${c.user.login}: ${c.body}</div>`).join("") || "No comments"}
    `;
    const fileSelection = document.createElement("div");
    fileSelection.innerHTML = `<h3>File Diff</h3>`;

    const select = document.createElement("select");
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = `— ${pr.files.length} file${pr.files.length !== 1 ? "s" : ""} changed —`;
    select.appendChild(placeholder);

    pr.files.forEach((file, i) => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = file.filename;
        select.appendChild(opt);
    });

    const meta = document.createElement("span");
    meta.innerHTML = `<span class="add">+0</span> <span class="del">-0</span>`;

    const diffContainer = document.createElement("div");
    diffContainer.className = "diff-container";

    select.addEventListener("change", () => {
        const file = pr.files[Number(select.value)];
        if (!file) { diffContainer.innerHTML = ""; return; }
        meta.innerHTML = `<span class="add">+${file.additions}</span> <span class="del">-${file.deletions}</span>`;
        if (!file.patch) { diffContainer.innerHTML = "<div>No patch available.</div>"; return; }
        const fullDiff = `--- a/${file.filename}\n+++ b/${file.filename}\n${file.patch}`;
        diffContainer.innerHTML = diff2html(fullDiff, {
            inputFormat: "diff",
            outputFormat: "line-by-line",
            drawFileList: false,
            matching: "lines",
            colorScheme: "dark"
        });
    });

    fileSelection.appendChild(select);
    fileSelection.appendChild(meta);
    fileSelection.appendChild(diffContainer);
    statsDiv.appendChild(fileSelection);
}

window.showPRDetail = showPRDetail
window.initPRList = initPRList