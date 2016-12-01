export default async (ctx, next, kitsu) => {
  console.log('user: ' + ctx.request.body.text)
  await kitsu.searchUsers(ctx.request.body.text).then((user) => {
    if (user) {
      console.log(user.name)
      ctx.status = 200
      ctx.body = {
        'response_type': 'in_channel',
        'link_names': true,
        'attachments': [
          {
            'color': '#EC8662',
            'pretext': '@' + ctx.request.body.user_name,
            'mrkdwn_in': ['text'],
            'title': user.name,
            'title_link': user.links.self,
            'text': user.bio,
            "thumb_url": user.avatar.original,
            'fields': [
              {
                'title': 'About',
                'value': user.about,
                'short': false
              },
              {
                'title': user.waifuOrHusbando,
                'value': user.waifu.name,
                'short': true
              }
            ],
            'fallback': '@' + ctx.request.body.user_name +
              '\n' + user.name +
              '\nAbout: ' + user.about +
              '\nBio: ' + user.bio +
              '\nWaifu/Husbando: ' + user.waifuOrHusbando
          }
        ]
      }
    } else {
      ctx.status = 404
      throw new Error('Not Found')
    }
  })
}
