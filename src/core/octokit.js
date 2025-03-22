const { graphql } = require("@octokit/graphql");
const OctokitResponseModel = require('../model/octokit/OctokitResponseModel');
let octokit = function () {
    let getHeader = function (AUTH_KEY) {
       return  {
            headers: {
                authorization: `token ${AUTH_KEY}`,
            },
        }
    }
    let getQuery = function (locations, numberOfUsers, cursor) {
        return { query: `query {
              search(type: USER, query:"${locations} sort:followers-desc", first:${numberOfUsers}, after:${cursor}) {
                edges {
                  node {
                    __typename
                    ... on User {
                      login,
                      avatarUrl(size: 72),
                      name,
                      location,
                      company,
                      twitterUsername,
                      followers {
                        totalCount
                      }
                      contributionsCollection {
                        contributionCalendar {
                          totalContributions
                        }
                        restrictedContributionsCount
                      }
                    }
                  }
                }
                 pageInfo {
                    endCursor
                    hasNextPage
                  }
              }
            }`};
    }
    let setCursor = function (cursor) {
        if(cursor === null){
            return cursor
        } else {
            return `"${cursor}"`;
        }
    }
    let request = async function (AUTH_KEY, locations, cursor) {
        try{
            const graphqlWithAuth = graphql.defaults(getHeader(AUTH_KEY));
            const response = await graphqlWithAuth(getQuery(locations, 10, setCursor(cursor)));
            return new OctokitResponseModel(true, response);
        } catch (error) {
            const errorMessage = error.message || "Unknown error";
            const statusCode = error.status || "N/A";
            console.error(`GitHub API Error (${statusCode}): ${errorMessage}`);
            
            // Handle rate limiting specifically
            if (error.status === 403 && error.headers && error.headers['x-ratelimit-remaining'] === '0') {
                const resetTime = error.headers['x-ratelimit-reset'] * 1000;
                const waitTime = Math.ceil((resetTime - Date.now()) / 1000);
                console.error(`Rate limit exceeded. Resets in ${waitTime} seconds.`);
            }
            
            return new OctokitResponseModel(false);
        }
    }
    return {
        request: request
    };
}();
module.exports = octokit;