var mongoose    = require('mongoose');
var log         = require('./log')(module);

mongoose.connect('mongodb://localhost/test1');
var db = mongoose.connection;

db.on('error', function (err) {
    log.error('connection error:', err.message);
});
db.once('open', function callback () {
    log.info("Connected to DB!");
});

var Schema = mongoose.Schema;

// GitHub OAuth API


// SNIPPETS DATABASE STRUCTURE

// Schemas
var GitRepo = new Schema({
    dataProvider: {
        type: String,
        enum: ['GitHub', 'GitLab', "Bitbacket"],
        required: true
    },
    repository: { type: String, required: true },
});

var CommentItem = new Schema({
	path: { type: String, required: true },
	repository: { type: GitRepo, required: true },
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
	commentId: { type: CommentItem, required: true } // Unique comment for this snippet
});

var Article = new Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String, required: true },
    images: [Images],
    modified: { type: Date, default: Date.now }
});

// validation
Article.path('title').validate(function (v) {
    return v.length > 5 && v.length < 70;
});

var ArticleModel = mongoose.model('Article', Article);

module.exports.ArticleModel = ArticleModel;
