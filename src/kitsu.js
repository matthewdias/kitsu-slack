import OAuth2 from 'client-oauth2'
import JsonApi from 'devour-client'
const baseUrl = process.env.KITSU_HOST + '/api'

class Kitsu {
  constructor() {
    this.auth = new OAuth2({
      clientId: process.env.KITSU_CLIENT,
      clientSecret: process.env.KITSU_SECRET,
      accessTokenUri: baseUrl + '/oauth/token'
    })

    this.jsonApi = new JsonApi({ apiUrl: baseUrl + '/edge' })

    this.jsonApi.headers['User-Agent'] = 'Slack/1.0.0'

    this.jsonApi.define('user', {
      name: '',
      about: '',
      website: '',
      // waifuOrHusbando: '',
      // waifu: {
        // jsonApi: 'hasOne',
        // type: 'characters'
      // },
      gender: '',
      location: '',
      birthday: '',
      createdAt: '',
      followersCount: '',
      followingCount: '',
      lifeSpentOnAnime: '',
      avatar: { medium: '' }
    })

    this.jsonApi.define('character', {
      name: ''
    })

    this.jsonApi.define('follow', {
      follower: {
        jsonApi: 'hasOne',
        type: 'users'
      },
      followed: {
        jsonApi: 'hasOne',
        type: 'users'
      }
    })

    this.jsonApi.define('anime', {
      canonicalTitle: '',
      slug: '',
      synopsis: '',
      averageRating: '',
      posterImage: { large: '' },
      episodeCount: '',
      episodeLength: '',
      showType: '',
      startDate: '',
      ageRating: '',
      ageRatingGuide: '',
      nsfw: '',
      youtubeVideoId: '',
      genres: {
        jsonApi: 'hasMany',
        type: 'genres'
      }
    }, { collectionPath: 'anime' })

    this.jsonApi.define('manga', {
      canonicalTitle: '',
      slug: '',
      synopsis: '',
      averageRating: '',
      posterImage: { large: '' },
      chapterCount: '',
      volumeCount: '',
      mangaType: '',
      startDate: '',
      genres: {
        jsonApi: 'hasMany',
        type: 'genres'
      }
    }, { collectionPath: 'manga' })

    this.jsonApi.define('genre', {
      name: ''
    })

    this.jsonApi.define('libraryEntry', {
      status: '',
      progress: '',
      reconsuming: '',
      reconsumeCount: '',
      private: '',
      rating: '',
      media: {
        jsonApi: 'hasOne'
      },
      user: {
        jsonApi: 'hasOne',
        type: 'users'
      }
    }, { collectionPath: 'library-entries' })
  }

  authenticate(token) {
    this.jsonApi.headers['Authorization'] = `Bearer ${token}`
  }

  unauthenticate() {
    delete this.jsonApi.headers['Authorization']
  }

  login(username, password) {
    return this.auth.owner.getToken(username, password)
  }

  refresh(token, refresh) {
    let authToken = this.auth.createToken(token, refresh)
    return authToken.refresh()
  }

  getUser(id) {
    return this.jsonApi.find('user', id)
  }

  searchUsers(query) {
    return new Promise((pass, fail) => {
      this.jsonApi.findAll('user', {
        filter: { query },
        // include: 'waifu',
        page: { limit: 1 }
      }).then((users) => {
        pass(users[0])
      })
    })
  }

  searchAnime(text) {
    return new Promise((pass, fail) => {
      this.jsonApi.findAll('anime', {
        filter: { text },
        include: 'genres',
        page: { limit: 1 }
      }).then((anime) => {
        pass(anime[0])
      })
    })
  }

  searchManga(text) {
    return new Promise((pass, fail) => {
      this.jsonApi.findAll('manga', {
        filter: { text },
        include: 'genres',
        page: { limit: 1 }
      }).then((manga) => {
        pass(manga[0])
      })
    })
  }

  searchFollows(follower, followed) {
    return new Promise((pass, fail) => {
      this.jsonApi.findAll('follow', {
        filter: { follower, followed },
        include: 'follower,followed'
      }).then((follows) => {
        pass(follows[0])
      })
    })
  }

  createFollow(follow) {
    return this.jsonApi.create('follow', follow)
  }

  removeFollow(id) {
    return this.jsonApi.destroy('follow', id)
  }

  createEntry(entry) {
    return this.jsonApi.create('libraryEntry', entry)
  }

  getEntry(id) {
    return this.jsonApi.find('libraryEntry', id)
  }

  getEntryForMedia(type, userId, mediaId) {
    return new Promise((pass, fail) => {
      this.jsonApi.findAll('libraryEntry', {
        filter: { userId, mediaId },
        include: 'media'
      }).then((entries) => {
        entries = entries.filter((entry) => {
          return entry.media.type == type
        })
        pass(entries[0])
      })
    })
  }

  updateEntry(entry) {
    return this.jsonApi.update('libraryEntry', entry)
  }

  removeEntry(id) {
    return this.jsonApi.destroy('libraryEntry', id)
  }
}

module.exports = Kitsu
