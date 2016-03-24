var mongoose    = require('mongoose');
var log         = require('./log')(module);
var config      = require('./config');

log.info("DB: " + config.get('mongoose:uri'));

mongoose.connect(config.get('mongoose:uri'));

var db = mongoose.connection;

db.on('error', function (err) {
    log.error('connection error:', err.message);
});
db.once('open', function callback () {
    log.info("Connected to DB!");
});

var Schema = mongoose.Schema;

// GitHub OAuth API


var DataProvider = new Schema({
    dataProvider: {
        type: String,
        enum: ['GitHub', 'GitLab', "Bitbacket", "Localhost"],
        required: true
    }
});

var GithubUser = new Schema({
    name: { type: String, required: true },
    dataProvider: {
        type: DataProvider,
        required: true
    }
});

//
// Repository naming user/repo for github
// count - the total number of snippets
//         in that repositories
//
var GithubRepo = new Schema({
    repository: {
        type: String,
        required: true
    },
    dataProvider: {
        type: DataProvider,
        required: true
    },
    count: {
        type: Number,
        required: true
    }
});

//
// Keep the number of user repositories
// which user commited users
//
var GithubUserRefs = new Schema({
    user: {
        type: GithubUser,
        required: true
    },
    repository : {
        type: GithubRepo,
        required: true
    },
    count: {
        type: Number,
        required: true
    }
});

// SNIPPETS DATABASE STRUCTURE
// Schemas

var CommentItem = new Schema({
	repository: { type: GithubRepo, required: true },
	path: { type: String, required: true },
    line: { type: Number, required: true },
	comment: { type: String, required: true },
	sha: { type: String, required: false }
});

var SnippetItem = new Schema({
	name: { type: String, required: true }, // Unique filename
	version: { type: String, required: true }, // version controle, to check diff etc
	userId: { type: GithubUser, required: true }, // Github Oauth user ID
	description: { type: String, required: true }, // Detailed description of the snippet
	tags: { type: String, required: true }, // Hash tags ???
    visibility: {
        type: String,
        enum: ['public', 'private', "draft"],
        required: true
    }
});

var rawSnippets = new Schema({
	snippetId: { type: SnippetItem, required: true }, // Unique snippet id
	commentId: [ CommentItem ] // Unique comment for this snippet
});

module.exports.GithubUserModel = mongoose.model('github_user', GithubUser);
module.exports.GithubRepoModel = mongoose.model('github_repo', GithubRepo);
module.exports.CommentItemModel = mongoose.model('comment', CommentItem);
module.exports.SnippetItemModel = mongoose.model('snippet', SnippetItem);
module.exports.RawSnippetsModel = mongoose.model('comment_snippet_raw', rawSnippets);
