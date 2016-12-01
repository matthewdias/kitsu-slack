import moment from 'moment'

export default async (ctx, next, kitsu) => {
  console.log('anime: ' + ctx.request.body.text)
  await kitsu.searchAnime(encodeURI(ctx.request.body.text)).then(anime => {
    if (anime) {
      console.log(anime.canonicalTitle)
      let text = ''
      let fields = []
      let title_link = process.env.KITSU_HOST + '/anime/' + anime.slug
      let fallback = anime.canonicalTitle + ' - ' + title_link
      let { averageRating, showType, startDate, youtubeVideoId, ageRating, ageRatingGuide, nsfw } = anime

      if (anime.synopsis) {
        text = anime.synopsis
        fallback += `\n${anime.synopsis}`
      }

      if (averageRating) {
        averageRating = averageRating.toString().slice(0, 4)
        fields.push({
          title: ':bar_chart: Rating',
          value: averageRating,
          short: true
        })
        fallback += `\nRating: ${averageRating}`
      }

      if (showType) {
        showType = showType.charAt(0).toUpperCase() + showType.slice(1)
        fields.push({
          title: ':vhs: Type',
          value: showType,
          short: true
        })
        fallback += `\nType: ${showType}`
      }

      if (anime.episodeCount) {
        fields.push({
          title: ':clapper: Episodes',
          value: anime.episodeCount,
          short: true
        })
        fallback += `\nEpisodes: ${anime.episodeCount}`
      }

      if (anime.episodeLength) {
        fields.push({
          title: ':watch: Length',
          value: anime.episodeLength,
          short: true
        })
        fallback += `\nLength: ${anime.episodeLength} minutes`
      }

      if (startDate) {
        let date = moment(startDate, 'YYYY[-]MM[-]DD')
        startDate = `${date.format('MMMM Do YYYY')} (${date.fromNow()})`
        fields.push({
          title: ':spiral_calendar_pad: Date',
          value: startDate,
          short: true
        })
        fallback += `\nDate: ${startDate}`
      }

      if (ageRating) {
        if (ageRatingGuide)
          ageRating += ': ' + ageRatingGuide
        if (nsfw)
          ageRating += ' (NSFW)'
        fields.push({
          title: ':love_hotel: Age Rating',
          value: ageRating,
          short: true
        })
        fallback += `\nAge Rating: ${ageRating}`
      }

      if (youtubeVideoId) {
        youtubeVideoId = `https://www.youtube.com/watch?v=${youtubeVideoId}`
        fields.push({
          title: ':film_frames: Trailer',
          value: youtubeVideoId,
          short: true
        })
        fallback += `\nTrailer: ${youtubeVideoId}`
      }

      let actions = [
        {
          name: 'current',
          text: 'Currently Watching',
          style: 'primary',
          type: 'button'
        },
        {
          name: 'planned',
          text: 'Plan to Watch',
          type: 'button'
        },
        {
          name: 'completed',
          text: 'Completed',
          type: 'button'
        },
        {
          name: 'hold',
          text: 'On Hold',
          type: 'button'
        },
        {
          name: 'dropped',
          text: 'Dropped',
          type: 'button'
        }
      ]

      let body = {
        response_type: 'in_channel',
        link_names: true,
        attachments: [{
          color: '#F65440',
          mrkdwn_in: ['text'],
          callback_id: 'anime/' + anime.id,
          title: anime.canonicalTitle,
          title_link,
          text,
          image_url: anime.posterImage ? anime.posterImage.original : null,
          fields,
          fallback,
          actions
        }]
      }

      ctx.status = 200
      ctx.body = body
    } else {
      ctx.status = 404
      throw new Error('Not Found')
    }
  })
}
