import axios from 'axios'
import crypto from 'crypto'

exports.sourceNodes = async ({
  actions,
  createNodeId
}, {
  accessToken,
  userName
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
  const items = await http.get('/authenticated_user/items')
                          .then(res => res.data)
                          .catch(error => console.log(error))

  // 記事詳細一覧取得
  const posts = await Promise.all(items.map(async item =>
    await http.get(`/items/${item.id}`)
              .then(item => item.data)
  ))

  // ノード登録
  posts.forEach(post => {

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