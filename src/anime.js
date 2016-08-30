import superagent from 'superagent'
import superagentJsonapify from 'superagent-jsonapify'
superagentJsonapify(superagent)

export default async (ctx, next) => {
  var media
  console.log('anime: ' + ctx.request.body.text)
  await superagent.get(process.env.API_URL + '/anime?filter[text]=' + ctx.request.body.text)
    .then(animus => {
      if (animus.body.data[0]) {
        media = animus.body.data[0]
        console.log(media.attributes.canonicalTitle)
      }else {
        ctx.status = 404
        throw new Error('Not Found')
      }
    })

  // var genres = media.relationships.genres.data.map(genre => genre.id)
  var type = media.attributes.showType
  type = type.charAt(0).toUpperCase() + type.slice(1)
  var rating = media.attributes.averageRating.toString().slice(0, 4)

  ctx.status = 200
  ctx.body = {
    'response_type': 'in_channel',
    'link_names': true,
    'attachments': [
      {
        'color': '#EC8662',
        'pretext': '@' + ctx.request.body.user_name,
        'mrkdwn_in': ['text'],
        'callback_id': 'anime/' + media.id,
        'title': media.attributes.canonicalTitle,
        'title_link': media.links.self,
        'text': media.attributes.synopsis,
        // "thumb_url": process.env.API_URL + media.attributes.posterImage,
        'image_url': 'https://static.hummingbird.me/anime/poster_images/000/007/442/large/attack-on-titan-2.jpg?1418580054',
        // "thumb_url": "https://static.hummingbird.me/anime/poster_images/000/007/442/large/attack-on-titan-2.jpg?1418580054",
        'fields': [
          {
            'title': 'Rating',
            'value': rating,
            'short': true
          },
          {
            'title': 'Type',
            'value': type,
            'short': true
          },
          {
            'title': 'Episodes',
            'value': media.attributes.episodeCount,
            'short': true
          },
          {
            'title': 'Length',
            'value': media.attributes.episodeLength,
            'short': true
          }
        ],
        'fallback': '@' + ctx.request.body.user_name +
          '\n' + media.attributes.canonicalTitle +
          '\nRating: ' + rating +
          '\nType: ' + type +
          '\nEpisodes: ' + media.attributes.episodeCount +
          '\nLength: ' + media.attributes.episodeLength + ' minutes' +
          // '\nGenres: ' + genres +
          '\nSynopsis: ' + media.attributes.synopsis,
        'actions': [
          {
            'name': 'current',
            'text': 'Currently Watching',
            'style': 'primary',
            'type': 'button'
          },
          {
            'name': 'planned',
            'text': 'Plan to Watch',
            'type': 'button'
          },
          {
            'name': 'completed',
            'text': 'Completed',
            'type': 'button'
          },
          {
            'name': 'hold',
            'text': 'On Hold',
            'type': 'button'
          },
          {
            'name': 'dropped',
            'text': 'Dropped',
            'type': 'button'
          }
        ]
      }
    ]
  }
}
