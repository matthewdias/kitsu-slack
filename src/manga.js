import moment from 'moment'

export default async (ctx, next, kitsu) => {
  console.log('manga: ' + ctx.request.body.text)
  await kitsu.searchManga(encodeURI(ctx.request.body.text)).then(manga => {
    if (manga) {
      console.log(manga.canonicalTitle)
      let text = ''
      let fields = []
      let title_link = process.env.KITSU_HOST + '/manga/' + manga.slug
      let fallback = manga.canonicalTitle + ' - ' + title_link
      let { averageRating, mangaType, startDate } = manga

      if (manga.synopsis) {
        text = manga.synopsis
        fallback += `\n${manga.synopsis}`
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

      if (mangaType) {
        mangaType = mangaType.charAt(0).toUpperCase() + mangaType.slice(1)
        fields.push({
          title: ':blue_book: Type',
          value: mangaType,
          short: true
        })
        fallback += `\nType: ${mangaType}`
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

      let actions = [
        {
          name: 'current',
          text: 'Currently Reading',
          style: 'primary',
          type: 'button'
        },
        {
          name: 'planned',
          text: 'Plan to Read',
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
          callback_id: 'manga/' + manga.id,
          title: manga.canonicalTitle,
          title_link,
          text,
          image_url: manga.posterImage ? manga.posterImage.large : null,
          fields,
          fallback,
          // actions
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
