import moment from 'moment'
import help from './help'

export function mangaAttachment (manga, extended) {
  let text = ''
  let fields = []
  let title_link = process.env.KITSU_HOST + '/manga/' + manga.slug
  let fallback = manga.canonicalTitle + ' - ' + title_link

  if (manga.synopsis) {
    text = manga.synopsis
    fallback += `\n${manga.synopsis}`
  }

  if (extended) {
    let { averageRating, popularityRank, subtype, startDate, ageRating, ageRatingGuide } = manga

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

    if (manga.categories) {
      let categories = manga.categories.map(genre => genre.title)
      categories = categories.join(', ')
      fields.push({
        title: ':label: Categories',
        value: categories,
        short: true
      })
      fallback += `\nCategories: ${categories}`
    }
  }

  let attachment = {
    color: '#F65440',
    mrkdwn_in: ['text'],
    callback_id: manga.id,
    title: manga.canonicalTitle,
    title_link,
    text,
    fields,
    fallback,
    footer: 'Kitsu API',
    footer_icon: 'https://kitsu-slack.herokuapp.com/footer-icon.png',
    ts: moment().unix(),
    actions: [{
      name: 'manga',
      text: 'Edit Library Status',
      type: 'button'
    }]
  }

  let image = manga.posterImage ? manga.posterImage.large : null
  if (image) {
    if (extended) {
      attachment.image_url = image
    } else attachment.thumb_url = image
  }

  return attachment
}

export async function mangaAction ({ ctx, kitsu, action, kitsuid, callback_id, body, title, token }) {
  if (action.name === 'manga') {
    let menu = {
      name: 'mangaentry',
      type: 'select',
      options: [
        { text: 'Currently Reading', value: 'current' },
        { text: 'Want to Read', value: 'planned' },
        { text: 'Completed', value: 'completed' },
        { text: 'On Hold', value: 'on_hold' },
        { text: 'Dropped', value: 'dropped' },
        { text: 'Not in Library', value: 'unadded' }
      ],
      confirm: {
        title: 'Edit ' + title,
        text: `Are you sure you want to edit ${title}?`
      }
    }

    kitsu.authenticate(token)
    let entry = await kitsu.getEntryForManga(kitsuid, callback_id)
    kitsu.unauthenticate()

    let status = entry ? entry.status : 'unadded'
    if (entry) {
      menu.selected_options = [
        menu.options.find(option => option.value === status)
      ]
    }

    body.attachments[0].title = 'Edit ' + title
    body.attachments[0].actions = [ menu ]
    ctx.body = body
    return true
  }

  if (action.name === 'mangaentry') {
    let { value } = action.selected_options[0]
    kitsu.authenticate(token)
    let entry = await kitsu.getEntryForManga(kitsuid, callback_id)

    if (value === 'unadded') {
      if (entry) {
        await kitsu.removeEntry(entry.id)
        body.text = 'Removed.'
        ctx.body = body
      }
      kitsu.unauthenticate()
      return true
    }

    let data = {
      status: value
    }

    if (entry) {
      data.id = entry.id
      await kitsu.updateEntry(data)
      kitsu.unauthenticate()
      body.text = 'Saved.'
      ctx.body = body
      return true
    }

    data.manga = { id: callback_id }
    data.user = { id: kitsuid }
    await kitsu.createEntry(data)
    kitsu.unauthenticate()
    body.text = 'Added.'
    ctx.body = body
  }
  return false
}

export default async (ctx, next, kitsu) => {
  let { text, user_id, team_id } = ctx.request.body
  if (!text) {
    help(ctx, next)
    return
  }

  console.log('manga: ' + text)
  let extended = false
  if (text.indexOf('extended ') === 0) {
    text = text.substring(9)
    extended = true
  }
  if (text.indexOf('ex ') === 0) {
    text = text.substring(3)
    extended = true
  }
  let manga
  try {
    let { token, fresh } = await kitsu.authUser(team_id, user_id, ctx, kitsu)
    if (fresh) {
      kitsu.authenticate(token)
    } else return
    manga = await kitsu.searchManga(encodeURI(text), extended)
    kitsu.unauthenticate()
  } catch (error) {
    ctx.status = 404
    return
  }
  if (manga) {
    console.log(manga.canonicalTitle)

    let body = {
      response_type: 'in_channel',
      link_names: true,
      attachments: [mangaAttachment(manga, extended)]
    }

    ctx.status = 200
    ctx.body = body
  }
}
