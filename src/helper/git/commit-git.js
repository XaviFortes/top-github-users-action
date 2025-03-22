const git = require('../../core/git');
let commitGit = function () {
    // Use environment variables if provided, otherwise use xavifortes
    let INSIGHT_BOT_USERNAME = process.env.GIT_USERNAME || 'xavifortes';
    let INSIGHT_BOT_EMAIL = process.env.GIT_EMAIL || 'github@xavifortes.com';
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