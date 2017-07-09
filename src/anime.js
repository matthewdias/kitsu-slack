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

    if (anime.categories) {
      let categories = anime.categories.map(genre => genre.title)
      categories = categories.join(', ')
      fields.push({
        title: ':label: Categories',
        value: categories,
        short: true
      })
      fallback += `\nCategories: ${categories}`
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

export async function animeAction ({ ctx, kitsu, action, kitsuid, callback_id, body, title, token }) {
  if (action.name === 'anime') {
    let menu = {
      name: 'animeentry',
      type: 'select',
      options: [
        { text: 'Currently Watching', value: 'current' },
        { text: 'Want to Watch', value: 'planned' },
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
    let entry = await kitsu.getEntryForAnime(kitsuid, callback_id)
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

  if (action.name === 'animeentry') {
    let { value } = action.selected_options[0]
    kitsu.authenticate(token)
    let entry = await kitsu.getEntryForAnime(kitsuid, callback_id)

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

    data.anime = { id: callback_id }
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
  console.log('anime: ' + text)
  let extended = false
  if (text.indexOf('extended ') === 0) {
    text = text.substring(9)
    extended = true
  }
  if (text.indexOf('ex ') === 0) {
    text = text.substring(3)
    extended = true
  }
  let anime
  try {
    let { token, fresh } = await kitsu.authUser(team_id, user_id, ctx, kitsu)
    if (fresh) {
      kitsu.authenticate(token)
    } else return
    anime = await kitsu.searchAnime(encodeURI(text), extended)
    kitsu.unauthenticate()
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
