# gatsby-source-qiita

[![npm version](https://badge.fury.io/js/gatsby-source-qiita.svg)](https://badge.fury.io/js/gatsby-source-qiita)

Source plugin for pulling data into Gatsby from [Qiita](https://qiita.com) using the [Qiita API v2](https://qiita.com/api/v2/docs).

## Install

`npm install --save gatsby-source-qiita`

## How to use

```js
// In your gatsby-config.js
module.exports = {
  plugins: [
    {
      resolve: `gatsby-source-qiita`,
      options: {
        accessToken: `YOUR_PERSONAL_ACCESS_TOKEN`,
        userName: `YOUR_UAWE_NAME`,
        // (optional) default is false.
        fetchPrivate: false,
        // (optional) default is [].
        excludedPostIds: ['da8347f81a9f021b637f']
      }
    }
  ]
}
```

## How to query

```graphql
{
  allQiitaPost {
    edges {
      node {
        id
        title
        rendered_body
        body
        comments_count
        created_at
        likes_count
        reactions_count
        tags {
          name
        }
        updated_at
        url
        user {
          id
        }
        page_views_count
      }
    }
  }
}
```
