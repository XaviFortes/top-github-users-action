const octokit = require('../../core/octokit');
let requestOctokit = function () {
    let setLocation = function (place) {
        return place.replace(/\s+/g, '_').toLowerCase();
    }
    let setQuery = function (location) {
        let query = '';
        for (const place of location) {
            query = query + `location:${setLocation(place)} `;
        }
        return query;
    }
    function randomIntFromInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min)
    }
    const setDelay = function(timeout){
        return new Promise(res => setTimeout(res, timeout));
    }
    let request = async function (AUTH_KEY, MAXIMUM_ERROR_ITERATIONS, location) {
        // Validate token
        if (!AUTH_KEY || typeof AUTH_KEY !== 'string' || AUTH_KEY.trim() === '') {
            throw new Error('Invalid GitHub authentication token');
        }
        
        // Validate location
        if (!Array.isArray(location) || location.length === 0) {
            throw new Error('Location must be a non-empty array');
        }
        
        let hasNextPage = true;
        let cursor = null;
        let array = [];
        let iterations = 0;
        let errors = 0;
        let backoffTime = 60000; // Start with 1 minute
        
        for (; hasNextPage;) {
            let octokitResponseModel = await octokit.request(AUTH_KEY, setQuery(location), cursor);
            if(octokitResponseModel.status){
                hasNextPage = octokitResponseModel.pageInfo.hasNextPage;
                cursor = octokitResponseModel.pageInfo.endCursor;
                for(const userDataModel of octokitResponseModel.node){
                    console.log(`iterations:(${iterations}) errors:(${errors}/${MAXIMUM_ERROR_ITERATIONS}) ${userDataModel.login} ${userDataModel.followers}`)
                    array.push(userDataModel)
                }
                // Reset backoff time on success
                backoffTime = 60000;
                let interval = randomIntFromInterval(1000, 5000)
                console.log(`interval:${interval}ms hasNextPage:${hasNextPage} cursor:${cursor} users:${array.length}`);
                await setDelay(interval);
                iterations++;
            } else {
                // Exponential backoff with a maximum of 10 minutes
                console.log(`Error occurred. Waiting for ${backoffTime/1000} seconds before retry.`);
                await setDelay(backoffTime);
                backoffTime = Math.min(backoffTime * 2, 600000); // Double the time, max 10 minutes
                errors++;
            }
            if(errors >= MAXIMUM_ERROR_ITERATIONS) hasNextPage = false;
        }
        return array;
    }
    return {
        request: request
    };
}();
module.exports = requestOctokit;