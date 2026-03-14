import "./style.css";
import { Octokit } from "https://esm.sh/octokit";


const octokit = new Octokit({
  auth: import.meta.env.VITE_GITHUB_TOKEN, // or use environment variables in Node
});

document.getElementById("generateBtn").addEventListener("click", async () => {
  const url = document.getElementById("repoInput").value.trim();
  const output = document.getElementById("output");

  try {
    const { owner, repo } = parseRepoUrl(url);

    // Redirect to analytics page with query param
    window.location.href = `analytics.html?owner=${owner}&repo=${repo}`;
  } catch (err) {
    output.textContent = "Error: " + err.message;
  }
});

function parseRepoUrl(url) {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(\/|$)/);

  if (!match) {
    throw new Error("Invalid GitHub repository URL");
  }

  return { owner: match[1], repo: match[2] };
}
