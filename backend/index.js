const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/tree", async (req, res) => {
  const { repoUrl } = req.body;
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return res.status(400).json({ error: "Invalid URL" });

  const [_, owner, repo] = match;

  try {
    const repoData = await axios.get(`https://api.github.com/repos/${owner}/${repo}`);
    const defaultBranch = repoData.data.default_branch;

    const treeData = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`
    );

    const tree = treeData.data.tree.map(item => ({
      path: item.path,
      type: item.type, // 'blob' or 'tree'
      size: item.size || 0 // folders don't have size
    }));

    let readme = "";
    try {
      const readmeRes = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/readme`,
        {
          headers: {
            Accept: "application/vnd.github.v3.raw"
          }
        }
      );
      readme = readmeRes.data;
    } catch {
      readme = "";
    }

    res.json({ tree, readme });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch repo data" });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
