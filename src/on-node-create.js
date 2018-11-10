import axios from 'axios'
import crypto from 'crypto'


const PER_PAGE = 100
const MAX_PAGE = 100


module.exports = async (
  {
    actions,
    createNodeId
  },
  {
    accessToken,
    userName,
    fetchPrivate = false,
    excludedPostIds = []
  }
) => {


  // vaidation options
  if (!accessToken) {
    throw 'You need to set an accessToken.'
  }

  if (!userName) {
    throw 'You need to set an userName.'
  }

  const http = axios.create({
    baseURL: 'https://qiita.com/api/v2/'
  })

  // Qiita Authorization
  http.interceptors.request.use(config => {
    config.headers.Authorization = `Bearer ${accessToken}`
    return config
  }, error => Promise.reject(error))

  // Get posts of authenticated user
  let posts = []

  for (let page = 1; page <= MAX_PAGE; page++) {
    const items = await http.get(`/authenticated_user/items?page=${page}&per_page=${PER_PAGE}`)
                            .then(res => res.data)
                            .catch(error => console.log(error))

    posts = [...posts, ...items]

    // End loop assuming that there is no next page
    // If the items length is the maximum number per page,
    // there is a possibility that the next page may exist so that continues loop
    if (items.length !== PER_PAGE) {
      break
    }
  }

  // Exclude private posts, if fetchPrivate is false.
  if (!fetchPrivate) {
    posts = posts.filter(post => !post.private)
  }

  // Create QiitaPost Node
  posts
    // Exclude posts specified in options.
    .filter(post => !excludedPostIds.includes(post.id))
    .forEach(post => {
      const contentDigest =
        crypto.createHash(`md5`)
              .update(JSON.stringify(post))
              .digest('hex')

      actions.createNode({
        ...post,
        id: createNodeId(`QiitaPost${post.id}`),
        children: [],
        parent: `__SOURCE__`,
        internal: {
          type: 'QiitaPost',
          contentDigest
        }
      })
    })

  return
}