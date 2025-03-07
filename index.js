require('dotenv').config();

const { OWNER, REPO, BRANCH, GITHUB_TOKEN = null } = process.env;

const fetchCommits = async () => {
    try {
        const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/commits?sha=${BRANCH}`, {
            headers: GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const commits = data.map(commit => ({
            hash: commit.sha.substring(0, 7),
            message: commit.commit.message.split('\n')[0],
            author: commit.commit.author.name,
            date: new Date(commit.commit.author.date).toLocaleString()
        }));

        const header = `\n==== Commit Log for: ${OWNER}/${REPO}  ====`;
        console.log(header);
        commits.forEach(commit => {
            console.log(`\n- ${commit.hash} - ${commit.message}`);
            console.log(`   By: ${commit.author} on ${commit.date}`);
        });
        console.log(`\n${"=".repeat(header.length - 1)}\n`);
    } catch (error) {
        console.error('Error fetching commits:', error.message);
    }
}

fetchCommits();
