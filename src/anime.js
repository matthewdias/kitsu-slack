export default async (ctx, next, kitsu) => {
  console.log('anime: ' + ctx.request.body.text)
  await kitsu.searchAnime(ctx.request.body.text).then(anime => {
    if (anime) {
      console.log(anime.canonicalTitle)
      let type = anime.showType
      type = type.charAt(0).toUpperCase() + type.slice(1)
      let rating = anime.averageRating.toString().slice(0, 4)

      ctx.status = 200
      ctx.body = {
        'response_type': 'in_channel',
        'link_names': true,
        'attachments': [
          {
            'color': '#EC8662',
            'pretext': '@' + ctx.request.body.user_name,
            'mrkdwn_in': ['text'],
            'callback_id': 'anime/' + anime.id,
            'title': anime.canonicalTitle,
            'title_link': anime.links.self,
            'text': anime.synopsis,
            "thumb_url": anime.posterImage.original,
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
                'value': anime.episodeCount,
                'short': true
              },
              {
                'title': 'Length',
                'value': anime.episodeLength,
                'short': true
              }
            ],
            'fallback': '@' + ctx.request.body.user_name +
              '\n' + anime.canonicalTitle +
              '\nRating: ' + rating +
              '\nType: ' + type +
              '\nEpisodes: ' + anime.episodeCount +
              '\nLength: ' + anime.episodeLength + ' minutes' +
              // '\nGenres: ' + genres +
              '\nSynopsis: ' + anime.synopsis,
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
    } else {
      ctx.status = 404
      throw new Error('Not Found')
    }
  })
}
