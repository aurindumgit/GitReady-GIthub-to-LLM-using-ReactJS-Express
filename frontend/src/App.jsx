import { useState } from "react";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import "./App.css";

function App() {
  const [url, setUrl] = useState("");
  const [treeText, setTreeText] = useState("");
  const [readme, setReadme] = useState("");
  const [filterText, setFilterText] = useState("");
  const [rawTreeData, setRawTreeData] = useState([]);
  const [showRawReadme, setShowRawReadme] = useState(false);

  const fetchTree = async () => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/tree`, {
        repoUrl: url,
      });
      const paths = res.data.tree;
      const readmeText = res.data.readme || "";
      const tree = buildTree(paths);
      const formatted = formatTree(tree);
      setTreeText(formatted);
      setReadme(readmeText.trim());
      setRawTreeData(paths);
    } catch (err) {
      alert("Failed to fetch or format tree");
    }
  };

  const applyFilter = () => {
    if (!filterText.trim()) {
      fetchTree(); // Reset to full tree
      return;
    }

    const terms = filterText
      .toLowerCase()
      .split(",")
      .map(term => term.trim())
      .filter(term => term.length > 0);

    const lines = treeText.split("\n");
    const filteredLines = lines.filter(line => {
      const name = line.split("── ").pop()?.toLowerCase() || "";
      return terms.some(term => name.includes(term));
    });

    setTreeText(filteredLines.join("\n"));
  };

  const buildTree = (items) => {
    const root = {};
    for (const { path, type, size } of items) {
      const parts = path.split("/");
      let curr = root;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!curr[part]) {
          curr[part] = {
            __meta: {
              type: i === parts.length - 1 ? type : "tree",
              size: i === parts.length - 1 ? size : 0,
            },
          };
        }
        curr = curr[part];
      }
    }
    return root;
  };

  const formatTree = (node, prefix = "", isLast = true) => {
    const entries = Object.entries(node).filter(([key]) => key !== "__meta");
    const len = entries.length;
    return entries
      .map(([name, child], idx) => {
        const isLastEntry = idx === len - 1;
        const connector = isLastEntry ? "└── " : "├── ";
        const nextPrefix = prefix + (isLastEntry ? "    " : "│   ");
        const meta = child.__meta || {};
        const icon = meta.type === "blob" ? "📄" : "📁";
        const sizeLabel = meta.type === "blob" ? ` (${formatSize(meta.size)})` : "";
        const line = `${prefix}${connector}${icon} ${name}${sizeLabel}`;
        const children =
          Object.keys(child).length > 1
            ? "\n" + formatTree(child, nextPrefix)
            : "";
        return line + children;
      })
      .join("\n");
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    else return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="app-container">
      <div className="app-header">
        <h1 className="app-title">
          <span style={{ fontSize: "120%" }}>
            <span style={{ color: "#58a6ff" }}>GIT</span>READY
          </span>{" "}
          ~ GitHub to LLM
        </h1>
        <p className="app-summary">
          Turn your Project Directory{" "}
          <span style={{ color: "#58a6ff", fontSize: "20px" }}>
            ⟡ Prompt-friendly ⟡
          </span>
        </p>
      </div>

      <div className="input-box">
        <h1 className="app-heading">GitHub Repo Directory Tree</h1>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="GitHub Repo URL"
          className="url-input"
        />
        <button onClick={fetchTree} className="fetch-button">
          Fetch Tree
        </button>
      </div>

      {treeText && (
        <div className="output-box">
          <div className="filter-container">
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="filter-input"
              placeholder="Filter by folder name or extension (e.g. src, .js)"
            />
            <button className="filter-button" onClick={applyFilter}>
              Apply Filter
            </button>
          </div>
          <pre className="tree-output">
            Directory structure:
            {"\n" + treeText}
          </pre>
          <button
            onClick={() =>
              navigator.clipboard.writeText("Directory structure:\n" + treeText)
            }
            className="copy-button"
          >
            Copy Tree
          </button>
        </div>
      )}

      {readme && (
  <div className="output-box">
    <div className="readme-toggle-container">
      <button
        onClick={() => setShowRawReadme((prev) => !prev)}
        className="toggle-button"
      >
        {showRawReadme ? "Aa" : "</>"}
      </button>
    </div>

    {showRawReadme ? (
          <pre className="tree-output">
            README.md:
            {"\n" + readme}
          </pre>
        ) : (
          <div className="tree-output markdown-rendered">
            <h3>README.md:</h3>
            <ReactMarkdown>{readme}</ReactMarkdown>
          </div>
        )}

        <button
          onClick={() =>
            navigator.clipboard.writeText("README.md:\n" + readme)
          }
          className="copy-button"
        >
          Copy README
        </button>
      </div>
    )}


      <footer className="app-footer">
        <div className="footer-left">
          <a
            href="https://github.com/aurindumgit"
            target="_blank"
            rel="noopener noreferrer"
          >
            Made with <span role="img">❤️</span> by{" "}
            <span style={{ color: "#58a6ff" }}>Aurindum</span>
          </a>
        </div>
        <div className="footer-right">
          <a
            href="https://github.com/aurindumgit"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-button"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/aurindum/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-button"
          >
            LinkedIn
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
