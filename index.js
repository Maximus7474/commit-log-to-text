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
            ...data
                .map(commit => ({
                    hash: commit.sha.substring(0, 7),
                    message: commit.commit.message.split('\n')[0],
                    author: commit.author.login,
                    autorId: commit.author.id,
                    date: new Date(commit.commit.author.date).toLocaleString()
                })),
        ];

        return fetchCommits(page + 1, commits);
    } catch (error) {
        console.error('Error fetching commits:', error.message);
    }
}

fetchCommits()
.then(commits => {

    if (!commits) return console.error('Failed to retrieve commits.');
    
    // Contributor Statistics
    let contributors = {};
    commits
        .filter(commit => 
            !commit.message.startsWith("Merge pull request")
        )
        .forEach(commit => {
        if (!contributors[commit.autorId]) contributors[commit.autorId] = {
            commits: 0,
            name: commit.author,
        };

        contributors[commit.autorId].commits++; 
    });

    // Merged pull requests
    let mergeRequets = commits.filter(commit => 
        commit.message.startsWith("Merge pull request")
    ).length

    console.log("\x1b[32m\n" +
        "  ____                          _ _     _                \n" +
        " / ___|___  _ __ ___  _ __ ___ (_) |_  | |    ___   __ _ \n" +
        "| |   / _ \\| '_ ` _ \\| '_ ` _ \\| | __| | |   / _ \\ / _` |\n" +
        "| |__| (_) | | | | | | | | | | | | |_  | |__| (_) | (_| |\n" +
        " \\____\\___/|_| |_| |_|_| |_| |_|_|\\__| |_____\\___/ \\__, |\n" +
        "                                                     |___/  \n"+
        "\x1b[0m\n"+
        ` - Loaded for \x1b[34m${OWNER}/${REPO}\x1b[0m\n`+
        ` - Found \x1b[32m${commits.length}\x1b[0m commits\n`+
        ` - Found \x1b[32m${Object.keys(contributors).length}\x1b[0m contributors\n`+
        ` - Found \x1b[32m${mergeRequets}\x1b[0m Merged pull requests\n`+
        "\n"+
        "\x1b[33mGenerating Output\x1b[0m"
    );

    const header = `\n==== Commit Log for: ${OWNER}/${REPO}  ====\n`;
    let output = header;

    output += `\n- Commit Count: ${commits.length}\n`;
    output += `- ${mergeRequets} Merged pull requests\n`;

    output += `- ${Object.keys(contributors).length} Contributors:\n${Object.keys(contributors).map(id => {
        const { name, commits } = contributors[id];
        return `  - ${name.padEnd(20)}: ${String(commits).padEnd(4)} commit${commits > 1 ? 's' : ''}\n`;
    }).join('')}`;

    output += `\n${"=".repeat(header.length - 1)}\n`;
    
    output += `\n${" ".repeat(Math.floor((header.length - 1) * 0.3))}==== Full Commit Log ====\n`;

    commits.forEach(commit => {
        output += `\n- ${commit.hash} - ${commit.message}\n`;
        output += `  By: ${commit.author} on ${commit.date}\n`;
    });

    output += "\n\nGenerated with: https://github.com/Maximus7474/commit-log-to-text"

    fs.writeFile('output/commit_log.txt', output, (err) => {
        if (err) return console.error('[\x1b[31mERROR\x1b[0m] Writing to file:\n\x1b[31m', err.message,'\x1b[0m\n', err);

        console.log('[\x1b[32mSUCESS\x1b[0m]Commit log has been saved to output/commit_log.txt');
    });
});


