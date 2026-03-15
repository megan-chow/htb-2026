import "./style.css";
import { html as diff2html } from "diff2html";
import "diff2html/bundles/css/diff2html.min.css";


export function initPRList() {
    const insights = JSON.parse(localStorage.getItem("insights"));
    const prs = insights.pullRequestStats;
    const statsDiv = document.getElementById("stats");

    statsDiv.innerHTML = prs.map((pr) => {
        const statusLabel = pr.state === "open" ? "Pending" : pr.merged ? "Merged" : "Closed";
        const statusColor = pr.state === "open" ? "#f5a523" : pr.merged ? "#2ecc70" : "#e74c3c";
        const statusBg = pr.state === "open" ? "#f5a52330" : pr.merged ? "#2ecc7030" : "#e74c3c30";
        return `
            <div class="pr-card" onclick="showPRDetail(${pr.number})">
                <div class="pr-card-header">
                    <span class="pr-card-title"><span class="pr-card-number">#${pr.number}</span> ${pr.title}</span>
                    <span class="pr-status-badge" style="background:${statusBg}; color:${statusColor}; border: 1px solid ${statusColor};">● ${statusLabel}</span>
                </div>
                <div class="pr-card-meta">
                    <img src="${pr.author.avatar}" /> ${pr.author.username}
                    <span>Opened ${new Date(pr.created).toLocaleDateString()}</span>
                    ${pr.timeToMergeHours ? `<span>Merged in ${pr.timeToMergeHours < 1 ? Math.round(pr.timeToMergeHours * 60) + "m" : Math.round(pr.timeToMergeHours) + "h"}</span>` : ""}
                </div>
                ${pr.labels.length ? `<div class="pr-card-labels">${pr.labels.map(l => `<span class="pr-label">${l}</span>`).join("")}</div>` : ""}
            </div>
        `;
    }).join("");
}

export function showPRDetail(pNumber) {
    const insights = JSON.parse(localStorage.getItem("insights"));
    const pr = insights.pullRequestStats.find(p => p.number === pNumber);
    // replace later with the actual div
    const statsDiv = document.getElementById("stats");

        const statusLabel = pr.state === "open" ? "Pending" : pr.merged ? "Merged" : "Closed";
        const statusColor = pr.state === "open" ? "#f5a523" : pr.merged ? "#2ecc70" : "#e74c3c";
        const statusBg = pr.state === "open" ? "#f5a52330" : pr.merged ? "#2ecc7030" : "#e74c3c30";

        statsDiv.innerHTML = `
        <button class="pr-detail-back" onclick="initPRList()">← Back to PRs</button>

        <div class="pr-detail-header">
            <h2 class="pr-detail-title"><span class="pr-card-number">#${pr.number}</span> ${pr.title}</h2>
            <span class="pr-status-badge" style="background:${statusBg}; color:${statusColor}; border: 1px solid ${statusColor};">● ${statusLabel}</span>
        </div>

        <div class="pr-detail-meta">
            <div class="pr-meta-item">
                <span class="pr-meta-label">Author</span>
                <span class="pr-meta-value"><img src="${pr.author.avatar}" /> ${pr.author.username}</span>
            </div>
            <div class="pr-meta-item">
                <span class="pr-meta-label">Branch</span>
                <span class="pr-meta-value">${pr.sourceBranch} <span class="pr-branch-arrow">→</span> ${pr.targetBranch}</span>
            </div>
            <div class="pr-meta-item">
                <span class="pr-meta-label">Opened</span>
                <span class="pr-meta-value">${new Date(pr.created).toLocaleDateString()}</span>
            </div>
            <div class="pr-meta-item">
                <span class="pr-meta-label">Time to Merge</span>
                <span class="pr-meta-value">${pr.timeToMergeHours ? (pr.timeToMergeHours < 1 ? Math.round(pr.timeToMergeHours * 60) + " minutes" : Math.round(pr.timeToMergeHours) + " hours") : "—"}</span>
            </div>
        </div>

        ${pr.description ? `<div class="pr-description">${pr.description}</div>` : ""}

        <div class="pr-section">
            <div class="pr-section-header">Files Changed <span class="pr-section-count">${pr.files.length}</span></div>
            ${pr.files.map(f => `
                <div class="pr-file-item">
                    <span class="pr-file-name">${f.filename}</span>
                    <span class="pr-file-stats"><span class="add">+${f.additions}</span> <span class="del">-${f.deletions}</span></span>
                </div>
            `).join("")}
        </div>

        <div class="pr-section">
            <div class="pr-section-header">Commits <span class="pr-section-count">${pr.commits.length}</span></div>
            ${pr.commits.map(c => `
                <div class="pr-commit-item">
                    <span class="pr-commit-sha">${c.sha.slice(0,7)}</span>
                    <span class="pr-commit-msg">${c.commit.message}</span>
                </div>
            `).join("")}
        </div>

        <div class="pr-section">
            <div class="pr-section-header">Reviews <span class="pr-section-count">${pr.reviews.length}</span></div>
            ${pr.reviews.length ? pr.reviews.map(r => `
                <div class="pr-review-item">
                    <span class="pr-review-user">${r.user.login}<span class="pr-review-state ${r.state.toLowerCase()}">${r.state.replace("_", " ")}</span></span>
                </div>
            `).join("") : '<div class="pr-empty">No reviews yet</div>'}
        </div>

        <div class="pr-section">
            <div class="pr-section-header">Comments <span class="pr-section-count">${pr.comments.length}</span></div>
            ${pr.comments.length ? pr.comments.map(c => `
                <div class="pr-comment-item">
                    <div class="pr-comment-user">${c.user.login}</div>
                    <div class="pr-comment-body">${c.body}</div>
                </div>
            `).join("") : '<div class="pr-empty">No comments</div>'}
        </div>
    `;
    const fileSelection = document.createElement("div");
    fileSelection.className = "pr-section pr-diff-section";
    fileSelection.innerHTML = `<div class="pr-section-header">File Diff</div>`;

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

    const meta = document.createElement("div");
    meta.className = "pr-diff-meta";
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