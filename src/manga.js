import moment from 'moment'

export default async (ctx, next, kitsu) => {
  let query = ctx.request.body.text
  console.log('manga: ' + query)
  let extended = false
  if (query.indexOf('extended ') == 0) {
    query = query.substring(9)
    extended = true
  }
  if (query.indexOf('ex ') == 0) {
    query = query.substring(3)
    extended = true
  }
  let manga
  try {
    manga = await kitsu.searchManga(encodeURI(query), extended)
  }
  catch (error) {
    ctx.status = 404
    return
  }
  if (manga) {
    console.log(manga.canonicalTitle)
    let text = ''
    let fields = []
    let title_link = process.env.KITSU_HOST + '/manga/' + manga.slug
    let fallback = manga.canonicalTitle + ' - ' + title_link

    if (manga.synopsis) {
      text = manga.synopsis
      fallback += `\n${manga.synopsis}`
    }

    if (extended) {
      let { averageRating, subtype, startDate } = manga

      if (averageRating) {
        averageRating = averageRating.toString().slice(0, 4)
        fields.push({
          title: ':bar_chart: Rating',
          value: averageRating,
          short: true
        })
        fallback += `\nRating: ${averageRating}`
      }

      if (subtype) {
        subtype = subtype.charAt(0).toUpperCase() + subtype.slice(1)
        fields.push({
          title: ':blue_book: Type',
          value: subtype,
          short: true
        })
        fallback += `\nType: ${subtype}`
      }

      if (manga.chapterCount) {
        fields.push({
          title: ':bookmark: Chapters',
          value: manga.chapterCount,
          short: true
        })
        fallback += `\nChapters: ${manga.chapterCount}`
      }

      if (manga.volumeCount) {
        fields.push({
          title: ':books: Volumes',
          value: manga.volumeCount,
          short: true
        })
        fallback += `\nVolumes: ${manga.volumeCount} minutes`
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

      if (manga.genres) {
        let genres = manga.genres.map(genre => genre.name)
        genres = genres.join(', ')
        fields.push({
          title: ':performing_arts: Genres',
          value: genres,
          short: true
        })
        fallback += `\nGenres: ${genres}`
      }
    }

    let body = {
      response_type: 'in_channel',
      link_names: true,
      attachments: [{
        color: '#F65440',
        mrkdwn_in: ['text'],
        callback_id: manga.id,
        title: manga.canonicalTitle,
        title_link,
        text,
        fields,
        fallback,
        footer: 'Kitsu API',
        footer_icon: 'https://kitsu-slack.herokuapp.com/icon.png',
        ts: moment().unix(),
        actions: [{
          name: 'manga',
          text: 'Edit Library Status',
          type: 'button'
        }]
      }]
    }

    let image = manga.posterImage ? manga.posterImage.large : null
    if (image) {
      if (extended)
        body.attachments[0].image_url = image
      else body.attachments[0].thumb_url = image
    }

    ctx.status = 200
    ctx.body = body
  }
}
