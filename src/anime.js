import moment from 'moment'

export function animeAttachment (anime, extended) {
  let text = ''
  let fields = []
  let title_link = process.env.KITSU_HOST + '/anime/' + anime.slug
  let fallback = anime.canonicalTitle + ' - ' + title_link

  if (anime.synopsis) {
    text = anime.synopsis
    fallback += `\n${anime.synopsis}`
  }

  if (extended) {
    let { averageRating, popularityRank, subtype, startDate, youtubeVideoId, ageRating, ageRatingGuide } = anime

    if (averageRating) {
      fields.push({
        title: ':bar_chart: Rating',
        value: averageRating + '%',
        short: true
      })
      fallback += `\nRating: ${averageRating}%`
    }

    if (popularityRank) {
      fields.push({
        title: ':star: Popularity',
        value: '#' + popularityRank,
        short: true
      })
      fallback += `\nPopularity: #${popularityRank}`
    }

    if (subtype) {
      subtype = subtype.charAt(0).toUpperCase() + subtype.slice(1)
      fields.push({
        title: ':vhs: Type',
        value: subtype,
        short: true
      })
      fallback += `\nType: ${subtype}`
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
        value: anime.episodeLength + ' minutes',
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
      if (ageRatingGuide) {
        ageRating += ': ' + ageRatingGuide
      }
      fields.push({
        title: ':love_hotel: Age Rating',
        value: ageRating,
        short: true
      })
      fallback += `\nAge Rating: ${ageRating}`
    }

    if (anime.genres) {
      let genres = anime.genres.map(genre => genre.name)
      genres = genres.join(', ')
      fields.push({
        title: ':performing_arts: Genres',
        value: genres,
        short: true
      })
      fallback += `\nGenres: ${genres}`
    }

    if (youtubeVideoId) {
      youtubeVideoId = `https://www.youtube.com/watch?v=${youtubeVideoId}`
      fields.push({
        title: ':film_frames: Trailer',
        value: `<${youtubeVideoId}|Watch Here>`,
        short: true
      })
      fallback += `\nTrailer: ${youtubeVideoId}`
    }
  }

  let attachment = {
    color: '#F65440',
    mrkdwn_in: ['text'],
    callback_id: anime.id,
    title: anime.canonicalTitle,
    title_link,
    text,
    fields,
    fallback,
    footer: 'Kitsu API',
    footer_icon: 'https://kitsu-slack.herokuapp.com/footer-icon.png',
    ts: moment().unix(),
    actions: [{
      name: 'anime',
      text: 'Edit Library Status',
      type: 'button'
    }]
  }

  let image = anime.posterImage ? anime.posterImage.large : null
  if (image) {
    if (extended) {
      attachment.image_url = image
    } else attachment.thumb_url = image
  }

  return attachment
}

export default async (ctx, next, kitsu) => {
  let query = ctx.request.body.text
  console.log('anime: ' + query)
  let extended = false
  if (query.indexOf('extended ') === 0) {
    query = query.substring(9)
    extended = true
  }
  if (query.indexOf('ex ') === 0) {
    query = query.substring(3)
    extended = true
  }
  let anime
  try {
    anime = await kitsu.searchAnime(encodeURI(query), extended)
  } catch (error) {
    ctx.status = 404
    return
  }
  if (anime) {
    console.log(anime.canonicalTitle)

    let body = {
      response_type: 'in_channel',
      link_names: true,
      attachments: [animeAttachment(anime, extended)]
    }

    ctx.status = 200
    ctx.body = body
  }
}
