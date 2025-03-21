const git = require('../../core/git');
let commitGit = function () {
    // Use environment variables if provided, otherwise fallback to default bot
    let INSIGHT_BOT_USERNAME = process.env.GIT_USERNAME || 'github-actions[bot]';
    let INSIGHT_BOT_EMAIL = process.env.GIT_EMAIL || '41898282+github-actions[bot]@users.noreply.github.com';
    let commit = async function (message) {
        console.log(`Git Commit "${message}"`)
        try {
            await git.commit(INSIGHT_BOT_USERNAME, INSIGHT_BOT_EMAIL, message);
        } catch (error) {
            console.log(error);
        }
    }
    return {
        commit: commit
    };
}();
module.exports = commitGit;