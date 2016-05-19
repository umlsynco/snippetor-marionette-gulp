var mongoose = require('mongoose');
var log = require('./log')(module);
var config = require('./config');

log.info("DB: " + config.get('mongoose:uri'));

mongoose.connect(config.get('mongoose:uri'));

var db = mongoose.connection;

db.on('error', function (err) {
    log.error('connection error:', err.message);
});

db.once('open', function callback() {
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
    },
    {
        versionKey: false
    }
);

var GithubUser = new Schema({
    username: String,
    gid: Number,
    provider: String,
    disaplyName: String,
    accessToken: String,
    followers: { type: Number, default: 0 }, // Number of followers
    following: { type: Number, default: 0 }  // Number of following
//    created_at: Date
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
        branch: {
            type: String,
            required: true
        },
        gid: { // Github repo id, to be able to handle repo name change in the future
            type: Number,
            required: true
        },
        dataProvider: {
            type: String,
            enum: ['GitHub', 'GitLab', "Bitbacket", "Localhost"],
            required: true
        },
        count: { // snippets count
            type: Number,
            required: true,
            default: 0
        },
        followers: { // number of followers
            type: Number,
            required: true,
            default: 0
        }
    },
    {
        versionKey: false
    }
);

var GithubUserFollow = new Schema({
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        follow_user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        follow: { type: Boolean, default: true }
    },
    {
        versionKey: false
    });

//
// Keep the number of user repositories
// which user committed snippets
//
var GithubUserRepoRefs = new Schema({
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        repository: {
            type: Schema.Types.ObjectId,
            ref: 'repository',
            required: true
        },
        count: {
            // The number of snippets which created user in this repository
            // (There is no relation to comments count)
            type: Number,
            default: 0
        },
        follow: {
            // Is user follow this repository or just contribute into it
            type: Boolean,
            default: false
        }
    },
    {
        versionKey: false
    }
);

// SNIPPETS DATABASE STRUCTURE
// Schemas

var CommentItem = new Schema({
    repository: {type: Schema.Types.ObjectId, ref: 'repository', required: true},
    path: {type: String, required: true},
    line: {type: Number, required: true},
    comment: {type: String, required: true},
    sha: {type: String, required: false}
});

var SnippetItem = new Schema({
    name: {type: String, required: true}, // Unique filename
    version: {type: String, required: true}, // version controle, to check diff etc
    userId: {type: Schema.Types.ObjectId, ref: 'User', required: true}, // Github Oauth user ID
    description: {type: String, required: true}, // Detailed description of the snippet
    tags: {type: String, required: true}, // Hash tags ???
    comments: [{type: Schema.Types.ObjectId, ref: 'comment'}], // list of comments
    repositories: [{type: Schema.Types.ObjectId, ref: 'repository'}], // list of repositories
    visibility: {
        type: String,
        enum: ['public', 'private', "draft"],
        required: true
    },
    stars: { type: Number, required: true, default: 0},
    forks: { type: Number, required: true, default: 0},
    followers: { type: Number, required: true, default: 0},
    createdAt: Date,
    updatedAt: Date,
    ccount: Number // Number of comments
});


var GithubUserSnippetRefs = new Schema({
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        snippet: {
            type: Schema.Types.ObjectId,
            ref: 'snippet',
            required: true
        },
        star: {
            type: Boolean,
            default: false
        },
        follow: {
            // Is user follow this snipp
            type: Boolean,
            default: false
        }
    },
    {
        versionKey: false
    }
);

var GithubUserLogs = new Schema({
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        mixed: {
            type: Schema.Types.Mixed,
            required: true
        },
        action: {
            type: String,
            enum: ["create-snippet", "remove-snippet", "update-snippet", "fork-snippet",
                   "star-snippet", "unstar-snippet",
                   "follow-snippet", "unfollow-snippet",
                   "follow-user", "unfollow-user",
                   "follow-repo", "unfollow-repo"],
            required: true
        },
        modified: Date
    },
    {
        versionKey: false
    }
);


module.exports.GithubUserModel = mongoose.model('User', GithubUser); // User model
module.exports.GithubUserFollow = mongoose.model('UserUserFollow', GithubUserFollow); // User-User
module.exports.GithubUserRepoRefs = mongoose.model('UserRepoFollow', GithubUserRepoRefs); // User-Repo
module.exports.GithubUserSnippetRefs = mongoose.model('UserSnippetFollow', GithubUserSnippetRefs); // User-Snippet

module.exports.GithubUserLogs = mongoose.model('UserLogs', GithubUserLogs); // User-Logs - for dashboard

module.exports.GithubRepoModel = mongoose.model('repository', GithubRepo);
module.exports.CommentItemModel = mongoose.model('comment', CommentItem);
module.exports.SnippetItemModel = mongoose.model('snippet', SnippetItem);
