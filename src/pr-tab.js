import "./style.css";
window.addEventListener("DOMContentLoaded", async () =>{
    // search URL
    const params = new URLSearchParams(window.location.search);
    // gets owner of repo
    const owner = params.get("owner");
    // get repo
    const repo = params.get("repo");
});

document.getElementById("showPRsBtn").addEventListener("click", () => {
    const insights = JSON.parse(localStorage.getItem("insights"));
    const prs = insights.pullRequestStats;
    const statsDiv = document.getElementById("stats");
    console.log(prs.length, prs.map(pr => pr.number));

    statsDiv.innerHTML = prs.map((pr) => {
        const color = pr.state === "open" ? "#f5a52350" : pr.merged ? "#2ecc705a" : "#e74d3c64";
        const border = pr.state === "open" ? "#f5a523" : pr.merged ? "#2ecc70" : "#e74c3c";
        return `
            <div onclick="showPRDetail(${pr.number})" style="cursor:pointer; background:${color}; border: 2px solid ${border}; padding: 8px; border-radius: 6px; margin-bottom: 8px;">                
                <strong>#${pr.number} ${pr.title}</strong> [${pr.state}]<br/>
                <img src="${pr.author.avatar}" width="20" style="border-radius: 10px"/> ${pr.author.username}<br/>
                Opened: ${new Date(pr.created).toLocaleDateString()}
                ${pr.labels.length ? `| Labels: ${pr.labels.join(", ")}` : ""}
            </div>
    `;
    }).join("");

});
