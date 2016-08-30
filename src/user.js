import superagent from 'superagent'
import superagentJsonapify from 'superagent-jsonapify'
superagentJsonapify(superagent)

export default async (ctx, next) => {
  var profile
  console.log('user: ' + ctx.request.body.text)
  await superagent.get(process.env.API_URL + '/users?filter[name]=' + ctx.request.body.text)
    .then(user => {
      if (user.body.data[0]) {
        profile = user.body.data[0]
        console.log(profile.attributes.name)
      }else {
        ctx.status = 404
        throw new Error('Not Found')
      }
    })

  ctx.status = 200
  ctx.body = {
    'response_type': 'in_channel',
    'link_names': true,
    'attachments': [
      {
        'color': '#EC8662',
        'pretext': '@' + ctx.request.body.user_name,
        'mrkdwn_in': ['text'],
        'title': profile.attributes.name,
        'title_link': profile.links.self,
        'text': profile.attributes.bio,
        // "thumb_url": process.env.API_URL + profile.attributes.avatar,
        'thumb_url': 'https://i.imgur.com/so56rpG.jpg',
        'fields': [
          {
            'title': 'About',
            'value': profile.attributes.about,
            'short': false
          },
          {
            'title': 'Waifu/Husbando',
            'value': profile.attributes.waifuOrHusbando,
            'short': true
          }
        ],
        'fallback': '@' + ctx.request.body.user_name +
          '\n' + profile.attributes.name +
          '\nAbout: ' + profile.attributes.about +
          '\nBio: ' + profile.attributes.bio +
          '\nWaifu/Husbando: ' + profile.attributes.waifuOrHusbando
      }
    ]
  }
}
