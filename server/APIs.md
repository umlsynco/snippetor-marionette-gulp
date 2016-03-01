# Server API

It should be unified server api for a different data providers:
1. GitHub
2. Bitbucket
3. SourceForge
4. GitLab
5. Localhost (if possible)
etc


## Get user info:

There are two major use-cases when user-API is required:
1. The authenticated user info: On user log-in we need to know more information about snippets which user created before
2. It should be possible to select any GitHub user and get the list of public snippets

*Note:* You should get nothing if user never log-ined into the snippetor!!!

```
GET /api/users/:id
```
### Response

Get user info and the list of repositories which user contribute snipets to:

```
{
  "login": "octocat",
  "id": 1,
  "avatar_url": "https://github.com/images/error/octocat_happy.gif",
  "gravatar_id": "",
  "html_url": "https://github.com/octocat",
  "name": "monalisa octocat",
  "email": "octocat@github.com",
  "snippet_repos": [
      { "name" : "chrome/chrome", "snp_all": 1999, "snp_user": 3, "id": 1888},
      { "name" : "chrome/net", "snp_all": 4, "snp_user": 4, "id" : 1990}
  ],
  "followers": 20,
  "following": 0,
  "created_at": "2008-01-14T04:33:35Z",
  "updated_at": "2008-01-14T04:33:35Z"
}
```

## Post user info: (Temporary API: just for testing)

```
POST /api/users/:id
```



----------------------------------------------------------

# Repository information:


## Get repository by name:

```
GET /api/repos?name=umlsynco/snippetor
```

### Response

Expected single result, but anyway return an array

```
  [{
     "name": "umlsynco/snippetor",
     "full_path": "http://github.com/umlsynco/snippetor",
     "snp_all": 1999,
     "id": 8
  }]
```

## Create repo:

It is not possible to cache all github repositories, therefore we could register them at runtime.
If user select some repository then we should post it into the list of available or get it's "ID"

```
POST /api/repos?name=umlsynco/snippetor
```






----------------------------------------------------------


# Snippets API


## List snippets for user
```
GET /api/snippets?uid=userid&name_filter=bublik
```

Note: if user id is undefined then the authorized user id will be active

### Response

```
[
 {
    "id": "snippet id",
    "version" : "version",
    "title" : " snippet title",
    "description": "description",
    "tags": ["tag", "tag2" ...],
    "userid": "uid",
    "repoid": {
       "id": "repo id",
       "name" : "repo name",
       "snp_all": 188, // count of snippets
       "snp_count": 8
    },
 }
]

```


## Get concreate snippet:

```
GET /api/snippet/:id
```
### Response
```
 {
    "id": "snippet id",
    "version" : "1.0.1",
    "title" : " Some snippet title",
    "description": "description",
    "tags": ["tag", "tag2" ...],
    "userid": "uid",
    "repositories": [
      {
       "id": "repo id",
       "name" : "repo name",
       "snp_all": 188, // count of snippets
       "snp_count": 8
       },
       ...
    ], 
    "contnet" : [
       {
          "path" : "/path/to/file",
          "sha": "optional",
          "comment": "User comment",
          "line": 12,
          "repo_id": "repo id"
        },
        ...
    ]
 }
```

## POST/UPDATE/REMOVE snippets

```
POST /api/snippet
UPDATE/REMOVE /api/snippets/:id
```

