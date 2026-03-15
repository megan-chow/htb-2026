import "./style.css";
import { loadOverviewTab } from "./overview-tab.js";
import { renderCommitDetails } from "./commit_details.js";

async function githubAPI(path) {
  const res = await fetch(`/api/github?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} on ${path}`);
  return res.json();
}

window.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const output = document.getElementById("output");

  const owner = params.get("owner");
  const repo = params.get("repo");
  console.log("AAAAAAAAA");
  if (owner && repo) {
    try {
      // Pre-fill the search bar
      document.getElementById("repoInput").value =
        `https://github.com/${owner}/${repo}`;

      const insights = await generateInsights(owner, repo);
      console.log("print");
      // output.textContent = JSON.stringify(insights, null, 2);
      localStorage.setItem("insights", JSON.stringify(insights));
      localStorage.setItem("owner", owner);
      localStorage.setItem("repo", repo);
    } catch (err) {
      output.textContent = "Error: " + err.message;
    }
  }
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

// document.getElementById("generateBtn").addEventListener("click", async () => {
//   const url = document.getElementById("repoInput").value.trim();
//   const output = document.getElementById("output");

//   try {
//     const { owner, repo } = parseRepoUrl(url);

//     const insights = await generateInsights(owner, repo);

//     output.textContent = JSON.stringify(insights, null, 2);
//   } catch (err) {
//     output.textContent = "Error: " + err.message;
//   }
// });

function parseRepoUrl(url) {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(\/|$)/);

  if (!match) {
    throw new Error("Invalid GitHub repository URL");
  }

  return { owner: match[1], repo: match[2] };
}

async function generateInsights(owner, repo) {
  const [contributors, contributorStats, repoDetails, languages, commits, commitDetails, pulls, issues, authors] =
    await Promise.all([
      getContributors(owner, repo),
      getContributorStats(owner,repo),
      getRepoDetails(owner, repo),
      getLanguages(owner, repo),
      getCommitActivity(owner, repo),
      getContributorChanges(owner, repo),
      getPullRequests(owner, repo),
      getIssues(owner, repo),
      getAuthors(owner, repo),

    ]);

  renderContributors(contributors);

  return {
    contributors: contributors,
    contributorStats: contributorStats,
    repoDetails: repoDetails,
    languages: languages,
    commitFrequency: commits,
    commitDetails: commitDetails,
    pullRequestStats: pulls,
    issueStats: issues,
    authors: authors,
  };
}

async function getContributors(owner, repo) {
  console.log("getContributors");
  const data = await githubAPI(`/repos/${owner}/${repo}/contributors`);
  console.log("getContributors done");
  return data.map((c) => ({
    username: c.login,
    avatar: c.avatar_url,
    url: c.html_url,
    commits: c.contributions,
  }));
}
export { getContributors };

async function getCommitActivity(owner, repo) {
  console.log("getcommitactivity")
  return githubAPI(`/repos/${owner}/${repo}/stats/commit_activity`);
}

async function getContributorStats(owner, repo) {
  return githubAPI(`/repos/${owner}/${repo}/stats/contributors`);
}

async function getRepoDetails(owner, repo) {
  const data = await githubAPI(`/repos/${owner}/${repo}`);
  return { created_at: data.created_at };
}

async function getLanguages(owner, repo) {
  return githubAPI(`/repos/${owner}/${repo}/languages`);
}

async function getRecentCommits(owner, repo, limit = 20) {
  return githubAPI(`/repos/${owner}/${repo}/commits?per_page=${limit}`);
}

async function getCommitDetails(owner, repo, sha) {
  return githubAPI(`/repos/${owner}/${repo}/commits/${sha}`);
}

async function getContributorChanges(owner, repo) {
  // console.log("AAAAAAA");
  // const commits = await getRecentCommits(owner, repo);

  // const contributors = {};

  // for (const commit of commits) {
  //   const sha = commit.sha;
  //   const author = commit.author?.login || "Unknown";

  //   const details = await getCommitDetails(owner, repo, sha);

  //   if (!contributors[author]) {
  //     contributors[author] = [];
  //   }

  //   for (const file of details.files) {
  //     contributors[author].push({
  //       sha,
  //       filename: file.filename,
  //       additions: file.additions,
  //       deletions: file.deletions,
  //       patch: file.patch,
  //     });
  //   }
  // }

  // return contributors;


  const commits = await getRecentCommits(owner, repo, 50);
  // console.log("BBBBBBBB");
  const contributors = {};

  for (const commit of commits) {
    const sha = commit.sha;
    const author = commit.author?.login || "Unknown";

    const details = await getCommitDetails(owner, repo, sha);

    if (!contributors[author]) {
      contributors[author] = [];
    }

    // Group all files for this commit into one object
    const commitEntry = {
      sha,
      message: details.commit.message,
      date: details.commit.author.date,
      files: details.files.map(file => ({
        filename: file.filename,
        additions: file.additions,
        deletions: file.deletions,
        patch: file.patch
      }))
    };

    contributors[author].push(commitEntry);
  }

  return contributors;
}



async function getPullRequests(owner, repo) {
  const res = await githubAPI(`/repos/${owner}/${repo}/pulls?state=all&per_page=10`);
  return Promise.all(res.map(async(pr) => ({
    number: pr.number,
    title: pr.title,
    state: pr.state,
    author: {
      username: pr.user.login,
      avatar: pr.user.avatar_url,
    },
    labels: pr.labels.map((l) => l.name),
    sourceBranch: pr.head.ref,
    targetBranch: pr.base.ref,
    created: pr.created_at,
    closed: pr.closed_at,
    merged: pr.merged_at,
    description: pr.body,
    timeToMergeHours: pr.merged_at
      ? (new Date(pr.merged_at) - new Date(pr.created_at)) / 36e5
      : null,
    // Calls the async function to get data for specific pr
    files: await getFilesChangedInPR(owner, repo, pr.number).catch(() => []),
    reviews: await getReviews(owner, repo, pr.number).catch((e) => { console.error("reviews error", pr.number, e); return []; }),
    commits: await getPRCommits(owner, repo, pr.number).catch((e) => { console.error("commits error", pr.number, e); return []; }),
    comments: await getComments(owner, repo, pr.number).catch((e) => { console.error("comments error", pr.number, e); return []; }),

  })));
}

async function getIssues(owner, repo) {
  const res = await githubAPI(`/repos/${owner}/${repo}/issues?state=closed&per_page=50`);
  return res.map((issue) => ({
    number: issue.number,
    created: issue.created_at,
    closed: issue.closed_at,
    resolutionHours:
      (new Date(issue.closed_at) - new Date(issue.created_at)) / 36e5,
  }));
}

async function getAuthors(owner, repo) {
  const res = await githubAPI(`/repos/${owner}/${repo}/commits`);
  let author = [];
  res.forEach((commit) => {
    author.push(commit.commit.author.name);
  });

  const uniqueAuthors = [...new Set(author)];

  // console.log(res.data);
  // console.log(author);
  // console.log(uniqueAuthors);

  return uniqueAuthors;
}

async function getFilesChangedInPR(owner, repo, pull_number) {
  return githubAPI(`/repos/${owner}/${repo}/pulls/${pull_number}/files`);
}

async function getReviews(owner, repo, pull_number) {
  return githubAPI(`/repos/${owner}/${repo}/pulls/${pull_number}/reviews`);
}

async function getPRCommits(owner, repo, pull_number) {
  return githubAPI(`/repos/${owner}/${repo}/pulls/${pull_number}/commits`);
}

async function getComments(owner, repo, pull_number) {
  return githubAPI(`/repos/${owner}/${repo}/issues/${pull_number}/comments`);
}

function renderContributors(contributors) {
  let user_list = document.querySelector(".userTabslist");

  user_list.innerHTML = "";
  contributors.forEach((c) => {
    user_list.insertAdjacentHTML(
      "beforeend",
      `
      <div class="contributor">
        <img src="${c.avatar}" alt="avatar"/>
        <p class="contributor-name">${c.username}</p>
      </div>
    `,
    );
  });
  hideLoader();
}

// Listener for contributor selector
document.querySelector(".userTabslist").addEventListener("click", (e) => {
  const contributor = e.target.closest(".contributor");
  if (!contributor) return;

  const username = contributor.querySelector(".contributor-name").textContent;
  // console.log("Clicked contributor:", username);

  // Do stuff
  document.getElementById("contributorResultsHeading").textContent =
    "Analytics for contributer " + username;
  selectUser(username);
  // localStorage.setItem("username", username);
});

// *******
// Tabs
// *******
// Save state when user or tab is clicked

// ADAM LOOK HERE
function selectUser(username) {
  localStorage.setItem("username", username);
  renderContent();
}

// LOOK HERE TOO YOU DUMB BUTT
function selectTab(tab) {
  localStorage.setItem("tab", tab);
  renderContent();
}

// Render content based on current state
function renderContent() {
  const activeUser = localStorage.getItem("username");
  const activeTab = localStorage.getItem("tab");

  if (!activeUser || !activeTab) return;

  // const contributor = contributors.find(c => c.username === activeUser);

  switch (activeTab) {
    case "Overview":
      loadOverviewTab();
      // loadOverview(contributor);
      break;
    case "Commit Details":
      renderCommitDetails(activeUser);
      break;
    case "Pull Requests":
      // loadPullRequests(contributor);
      break;
    case "Charts":
      // loadCharts(contributor);
      break;
    default:
      // loadOverview(contributor);
      break;
  }
}

// Tab listeners
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => selectTab(tab.textContent));
});



// ***********************
// loading screen
// ***********************
function hideLoader() {
  toend = true;
  var overlay = document.getElementById('loading-overlay');
  setTimeout(function() {
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    setTimeout(function() { overlay.remove(); }, 600);
  }, 800); // wait for the tube animation to finish its ending
}
// THANK YOU Siyong Park on codepen.io !
// THANK YOU Siyong Park on codepen.io !
// THANK YOU Siyong Park on codepen.io !
// THANK YOU Siyong Park on codepen.io !
var $body = document.body,
  $wrap = document.getElementById('wrap'),

  areawidth = window.innerWidth,
  areaheight = window.innerHeight,

  canvassize = 1000,

  length = 30,
  radius = 5.4,

  rotatevalue = 0.035,
  acceleration = 100,
  animatestep = 0,
  toend = false,

  pi2 = Math.PI*2,

  group = new THREE.Group(),
  mesh, ringcover, ring,

  camera, scene, renderer;


camera = new THREE.PerspectiveCamera(65, 1, 1, 10000);
camera.position.z = 150;

scene = new THREE.Scene();
// scene.add(new THREE.AxisHelper(30));
scene.add(group);

mesh = new THREE.Mesh(
  new THREE.TubeGeometry(new (THREE.Curve.create(function() {},
    function(percent) {

      var x = length*Math.sin(pi2*percent),
        y = radius*Math.cos(pi2*3*percent),
        z, t;

      t = percent%0.25/0.25;
      t = percent%0.25-(2*(1-t)*t* -0.0185 +t*t*0.25);
      if (Math.floor(percent/0.25) == 0 || Math.floor(percent/0.25) == 2) {
        t *= -1;
      }
      z = radius*Math.sin(pi2*2* (percent-t));

      return new THREE.Vector3(x, y, z);

    }
  ))(), 200, 1.1, 2, true),
  new THREE.MeshBasicMaterial({
    color: 0xffffff
    // , wireframe: true
  })
);
group.add(mesh);

ringcover = new THREE.Mesh(new THREE.PlaneGeometry(50, 15, 1), new THREE.MeshBasicMaterial({color: 0x202429, opacity: 0, transparent: true}));
ringcover.position.x = length+1;
ringcover.rotation.y = Math.PI/2;
group.add(ringcover);

ring = new THREE.Mesh(new THREE.RingGeometry(4.3, 5.55, 32), new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 0, transparent: true}));
ring.position.x = length+1.1;
ring.rotation.y = Math.PI/2;
group.add(ring);

// fake shadow
(function() {
  var plain, i;
  for (i = 0; i < 10; i++) {
    plain = new THREE.Mesh(new THREE.PlaneGeometry(length*2+1, radius*3, 1), new THREE.MeshBasicMaterial({color: 0x202429, transparent: true, opacity: 0.13}));
    plain.position.z = -2.5+i*0.5;
    group.add(plain);
  }
})();

renderer = new THREE.WebGLRenderer({
  antialias: true
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(canvassize, canvassize);
renderer.setClearColor('#202429');

$wrap.appendChild(renderer.domElement);

$body.addEventListener('mousedown', start, false);
$body.addEventListener('touchstart', start, false);
$body.addEventListener('mouseup', back, false);
$body.addEventListener('touchend', back, false);
	scene = new THREE.Scene();
	// scene.add(new THREE.AxisHelper(30));
	scene.add(group);

	mesh = new THREE.Mesh(
		new THREE.TubeGeometry(new (THREE.Curve.create(function() {},
			function(percent) {

				var x = length*Math.sin(pi2*percent),
					y = radius*Math.cos(pi2*3*percent),
					z, t;

				t = percent%0.25/0.25;
				t = percent%0.25-(2*(1-t)*t* -0.0185 +t*t*0.25);
				if (Math.floor(percent/0.25) == 0 || Math.floor(percent/0.25) == 2) {
					t *= -1;
				}
				z = radius*Math.sin(pi2*2* (percent-t));

				return new THREE.Vector3(x, y, z);

			}
		))(), 200, 1.1, 2, true),
		new THREE.MeshBasicMaterial({
			color: 0xAAAAAA
			// , wireframe: true
		})
	);
	group.add(mesh);

	ringcover = new THREE.Mesh(new THREE.PlaneGeometry(50, 15, 1), new THREE.MeshBasicMaterial({color: 0x202429, opacity: 0, transparent: true}));
	ringcover.position.x = length+1;
	ringcover.rotation.y = Math.PI/2;
	group.add(ringcover);

	ring = new THREE.Mesh(new THREE.RingGeometry(4.3, 5.55, 32), new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 0, transparent: true}));
	ring.position.x = length+1.1;
	ring.rotation.y = Math.PI/2;
	group.add(ring);

	// fake shadow
	(function() {
		var plain, i;
		for (i = 0; i < 10; i++) {
			plain = new THREE.Mesh(new THREE.PlaneGeometry(length*2+1, radius*3, 1), new THREE.MeshBasicMaterial({color: 0x202429, transparent: true, opacity: 0.13}));
			plain.position.z = -2.5+i*0.5;
			group.add(plain);
		}
	})();

	renderer = new THREE.WebGLRenderer({
		antialias: true
	});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(canvassize, canvassize);
	renderer.setClearColor('#202429');

	$wrap.appendChild(renderer.domElement);

	$body.addEventListener('mousedown', start, false);
	$body.addEventListener('touchstart', start, false);
	$body.addEventListener('mouseup', back, false);
	$body.addEventListener('touchend', back, false);

	animate();


	function start() {
		toend = true;
	}
	
	function back() {
		toend = false;
	}

animate();


function start() {
  toend = true;
}

function back() {
  toend = false;
}

function tilt(percent) {
  group.rotation.y = percent*0.5;
}

function render() {

  var progress;

  animatestep = Math.max(0, Math.min(240, toend ? animatestep+1 : animatestep-4));
  acceleration = easing(animatestep, 0, 1, 240);

  if (acceleration > 0.35) {
    progress = (acceleration-0.35)/0.65;
    group.rotation.y = -Math.PI/2 *progress;
    group.position.z = 50*progress;
    progress = Math.max(0, (acceleration-0.97)/0.03);
    mesh.material.opacity = 1-progress;
    ringcover.material.opacity = ring.material.opacity = progress;
    ring.scale.x = ring.scale.y = 0.9 + 0.1*progress;
  }

  renderer.render(scene, camera);

}

function animate() {
  mesh.rotation.x += rotatevalue + acceleration;
  render();
  requestAnimationFrame(animate);
}

function easing(t,b,c,d) {if((t/=d/2)<1)return c/2*t*t+b;return c/2*((t-=2)*t*t+2)+b;}
