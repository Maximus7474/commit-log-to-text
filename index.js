const fs = require('fs');
require('dotenv').config();

const { OWNER, REPO, BRANCH, GITHUB_TOKEN = null } = process.env;
const PageSize = 100;

const fetchCommits = async (page = 1, commits = []) => {
    console.log('fetchCommits running for page', page, 'with', commits.length, 'already logged commits');
    try {
        const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/commits?sha=${BRANCH}&per_page=${PageSize}&page=${page}`, {
            headers: !!GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.length === 0) return commits;

        commits = [
            ...commits,
            ...data.map(commit => ({
                hash: commit.sha.substring(0, 7),
                message: commit.commit.message.split('\n')[0],
                author: commit.author.login,
                autorId: commit.author.id,
                date: new Date(commit.commit.author.date).toLocaleString()
            })),
        ];

        return commits; // fetchCommits(page + 1, commits);
    } catch (error) {
        console.error('Error fetching commits:', error.message);
    }
}

fetchCommits()
.then(commits => {

    if (!commits) return console.error('Failed to retrieve commits.');
    
    // Contributor Statistics
    let contributors = {};
    commits.forEach(commit => {
        if (!contributors[commit.autorId]) contributors[commit.autorId] = {
            commits: 0,
            name: commit.author,
        };

        contributors[commit.autorId].commits++; 
    });

    const header = `\n==== Commit Log for: ${OWNER}/${REPO}  ====\n`;
    let output = header;

    output += `\n- Commit Count: ${commits.length}\n`;

    output += `- ${Object.keys(contributors).length} Contributors:\n${Object.keys(contributors).map(id => {
        const { name, commits } = contributors[id];
        return `  - ${name.padEnd(20)}: ${String(commits).padEnd(4)} commit${commits > 1 ? 's' : ''}\n`;
    }).join('')}`;

    output += `\n${"=".repeat(header.length - 1)}\n`;

    fs.writeFile('output/commit_log.txt', output, (err) => {
        if (err) return console.error('[\x1b[31mERROR\x1b[0m] Writing to file:\n\x1b[31m', err.message,'\x1b[0m\n', err);

        console.log('[\x1b[32mSUCESS\x1b[0m]Commit log has been saved to output/commit_log.txt');
    });
});


