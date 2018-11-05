import axios from 'axios'
import crypto from 'crypto'

exports.sourceNodes = async ({
  actions,
  createNodeId
}, {
  accessToken,
  userName,
  fetchPrivate = false,
  excludedPostIds = []
}) => {
  // オプションチェック
  if (!accessToken) {
    throw 'You need to set an accessToken.'
  }

  if (!userName) {
    throw 'You need to set an userName.'
  }

  const http = axios.create({
    baseURL: 'https://qiita.com/api/v2/'
  });

  // 認証
  http.interceptors.request.use(config => {
    config.headers.Authorization = `Bearer ${accessToken}`
    return config
  }, error => Promise.reject(error))

  // 指定ユーザに紐付く記事概要一覧取得
  const PER_PAGE = 100
  const MAX_PAGE = 100
  let posts = []
  for (let page = 1; page <= MAX_PAGE; page++) {
    const items = await http.get(`/authenticated_user/items?page=${page}&per_page=${PER_PAGE}`)
                            .then(res => res.data)
                            .catch(error => console.log(error))

    posts = [...posts, ...items]

    // 次ページなしとみなし終了
    // 取得記事が1ページあたりの最大件数の場合は次ページが存在する可能性があるので捜査継続
    if (items.length !== PER_PAGE)  {
      break
    }
  }

  // fetchPrivateがfalseならプライベート記事は除外する
  if (!fetchPrivate) {
    posts = posts.filter(post => !post.private)
  }



  // ノード登録
  posts
    // オプションで指定された記事を除外
    .filter(post => !excludedPostIds.includes(post.id))
    .forEach(post => {

      const contentDigest = crypto
            .createHash(`md5`)
            .update(JSON.stringify(post))
            .digest('hex')

      actions.createNode({
        ...post,
        id: createNodeId(`QiitaPost${post.id}`),
        children: [],
        parent: `__SOURCE__`,
        internal: {
          type: 'QiitaPost',
          contentDigest,
        }
      })
    })

  return
}