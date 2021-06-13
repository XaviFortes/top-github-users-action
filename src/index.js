/*!
 * top-github-users-monitor 1.0.0
 * https://github.com/gayanvoice/top-github-users-monitor
 * (c) 2021 gayanvoice
 * Released under the MIT License
 */
const pullGit = require('./helper/git/pull-git');
const commitGit = require('./helper/git/commit-git');
const pushGit = require('./helper/git/push-git');
const configFile = require('./helper/file/config_file');
const outputCheckpoint = require('./helper/checkpoint/output_checkpoint');
const outputCache = require('./helper/cache/output_cache');
const outputMarkdown = require('./helper/markdown/output_markdown');
const outputHtml = require('./helper/html/output_html');
const createHtmlFile = require('./helper/html/file/create_html_file');
const createRankingJsonFile = require('./helper/html/file/create_ranking_json_file');
const createIndexPage = require('./helper/markdown/page/create_index_page');
const createPublicContributionsPage = require('./helper/markdown/page/create_public_contributions_page');
const createTotalContributionsPage = require('./helper/markdown/page/create_total_contributions_page');
const createFollowersPage = require('./helper/markdown/page/create_followers_page');
const requestOctokit = require('./helper/octokit/request_octokit');
const OutputMarkdownModel = require('./model/markdown/OutputMarkdownModel');
let Index = function () {
    // const AUTH_KEY = "";
    // const GITHUB_USERNAME_AND_REPOSITORY = 'gayanvoice/top-github-users';
    const AUTH_KEY = process.env.CUSTOM_TOKEN;
    const GITHUB_USERNAME_AND_REPOSITORY = process.env.GITHUB_REPOSITORY;
    const MAXIMUM_ITERATIONS = 10;
    const MAXIMUM_ERROR_ITERATIONS = 4;
    let getCheckpoint = async function (locationsArray, country, checkpoint) {
        let indexOfTheCountry = locationsArray.findIndex(location => location.country === country);
        if(indexOfTheCountry === checkpoint){
            console.log("checkpoint set", country)
            return true;
        } else {
            console.log("checkpoint not set", country)
            return false;
        }
    }
    let saveCache = async function (readConfigResponseModel, readCheckpointResponseModel) {
        console.log(`########## SaveCache ##########`)
        for await(const locationDataModel of readConfigResponseModel.locations){
            let isCheckpoint = await getCheckpoint(readConfigResponseModel.locations, locationDataModel.country, readCheckpointResponseModel.checkpoint);
            if(isCheckpoint){
                let json = await requestOctokit.request(AUTH_KEY, MAXIMUM_ITERATIONS, MAXIMUM_ERROR_ITERATIONS, locationDataModel.locations);
                await outputCache.saveCacheFile(locationDataModel.country, json);
            }
        }
    }
    let saveMarkdown = async function (readConfigResponseModel, readCheckpointResponseModel) {
        console.log(`########## SaveMarkDown ##########`)
        for await(const locationDataModel of readConfigResponseModel.locations){
            let isCheckpoint = await getCheckpoint(readConfigResponseModel.locations, locationDataModel.country, readCheckpointResponseModel.checkpoint)
            if(isCheckpoint){
                let readCacheResponseModel =  await outputCache.readCacheFile(locationDataModel.country);
                if(readCacheResponseModel.status) {
                    let outputMarkdownModel =  new OutputMarkdownModel(GITHUB_USERNAME_AND_REPOSITORY, locationDataModel, readCacheResponseModel, readConfigResponseModel);
                    await outputMarkdown.savePublicContributionsMarkdownFile(locationDataModel.country, createPublicContributionsPage.create(outputMarkdownModel));
                    await outputMarkdown.saveTotalContributionsMarkdownFile(locationDataModel.country, createTotalContributionsPage.create(outputMarkdownModel));
                    await outputMarkdown.saveFollowersMarkdownFile(locationDataModel.country, createFollowersPage.create(outputMarkdownModel));
                }
            }
            await outputCheckpoint.saveCheckpointFile(readConfigResponseModel.locations, locationDataModel.country, readCheckpointResponseModel.checkpoint)
        }
        if(!readConfigResponseModel.devMode) await outputMarkdown.saveIndexMarkdownFile(createIndexPage.create(GITHUB_USERNAME_AND_REPOSITORY, readConfigResponseModel));
    }
    let saveHtml = async function (readConfigResponseModel) {
        console.log(`########## SaveHtml ##########`);
        await outputHtml.saveRankingJsonFile(await createRankingJsonFile.create(readConfigResponseModel));
        await outputHtml.saveHtmlFile(createHtmlFile.create());
    }
    let getCommitMessage = async function (readConfigResponseModel, readCheckpointResponseModel) {
        let message;
        for await(const locationDataModel of readConfigResponseModel.locations){
            let isCheckpoint = await getCheckpoint(readConfigResponseModel.locations, locationDataModel.country, readCheckpointResponseModel.checkpoint - 1);
            if(isCheckpoint){
                message =  `Update ${locationDataModel.country}`
            }
        }
        return message;
    }
    let main = async function () {
        let readConfigResponseModel = await configFile.readConfigFile();
        let readCheckpointResponseModel = await outputCheckpoint.readCheckpointFile();
        if(readConfigResponseModel.status && readCheckpointResponseModel.status){
            if(!readConfigResponseModel.devMode) await pullGit.pull();
            await saveCache(readConfigResponseModel, readCheckpointResponseModel);
            await saveMarkdown(readConfigResponseModel, readCheckpointResponseModel)
            await saveHtml(readConfigResponseModel)
            console.log(await getCommitMessage(readConfigResponseModel, readCheckpointResponseModel))
            if(!readConfigResponseModel.devMode) await commitGit.commit(getCommitMessage(readConfigResponseModel, readCheckpointResponseModel));
            if(!readConfigResponseModel.devMode) await pushGit.push();
        }
    }
    return {
        main: main,
    };
}();
Index.main().then(() => { });