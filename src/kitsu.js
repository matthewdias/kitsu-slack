import OAuth2 from 'client-oauth2'
import JsonApi from 'devour-client'
const baseUrl = process.env.KITSU_HOST + '/api'

class Kitsu {
  constructor () {
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
      waifuOrHusbando: '',
      waifu: {
        jsonApi: 'hasOne',
        type: 'characters'
      },
      gender: '',
      location: '',
      birthday: '',
      createdAt: '',
      followersCount: '',
      followingCount: '',
      avatar: { medium: '' }
    })

    this.compactUserFields = ['name', 'about', 'avatar']
    this.userFields = [
      ...this.compactUserFields,
      'waifuOrHusbando',
      'gender',
      'location',
      'birthday',
      'createdAt',
      'followersCount',
      'followingCount'
    ]

    this.jsonApi.define('character', {
      name: ''
    })

    this.characterFields = ['name']

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
      popularityRank: '',
      posterImage: { large: '' },
      episodeCount: '',
      episodeLength: '',
      subtype: '',
      startDate: '',
      ageRating: '',
      ageRatingGuide: '',
      youtubeVideoId: '',
      genres: {
        jsonApi: 'hasMany',
        type: 'genres'
      }
    }, { collectionPath: 'anime' })

    this.compactAnimeFields = ['canonicalTitle', 'slug', 'synopsis', 'posterImage']
    this.animeFields = [
      ...this.compactAnimeFields,
      'averageRating',
      'popularityRank',
      'episodeCount',
      'episodeLength',
      'subtype',
      'startDate',
      'ageRating',
      'ageRatingGuide',
      'youtubeVideoId'
    ]

    this.jsonApi.define('manga', {
      canonicalTitle: '',
      slug: '',
      synopsis: '',
      averageRating: '',
      popularityRank: '',
      posterImage: { large: '' },
      chapterCount: '',
      volumeCount: '',
      subtype: '',
      startDate: '',
      ageRating: '',
      ageRatingGuide: '',
      genres: {
        jsonApi: 'hasMany',
        type: 'genres'
      }
    }, { collectionPath: 'manga' })

    this.compactMangaFields = ['canonicalTitle', 'slug', 'synopsis', 'posterImage']
    this.mangaFields = [
      ...this.compactMangaFields,
      'averageRating',
      'popularityRank',
      'chapterCount',
      'volumeCount',
      'subtype',
      'startDate',
      'ageRating',
      'ageRatingGuide'
    ]

    this.jsonApi.define('genre', {
      name: ''
    })

    this.genreFields = ['name']

    this.jsonApi.define('libraryEntry', {
      status: '',
      anime: {
        jsonApi: 'hasOne',
        type: 'anime'
      },
      manga: {
        jsonApi: 'hasOne',
        type: 'manga'
      },
      user: {
        jsonApi: 'hasOne',
        type: 'users'
      }
    }, { collectionPath: 'library-entries' })

    this.libraryEntryFields = ['status']
  }

  authenticate (token) {
    this.jsonApi.headers['Authorization'] = `Bearer ${token}`
  }

  unauthenticate () {
    delete this.jsonApi.headers['Authorization']
  }

  login (username, password) {
    return this.auth.owner.getToken(username, password)
  }

  refresh (token, refresh) {
    let authToken = this.auth.createToken(token, refresh)
    return authToken.refresh()
  }

  getUserId (name) {
    return new Promise((resolve, reject) => {
      this.jsonApi.findAll('user', {
        filter: { name },
        page: { limit: 1 },
        fields: { users: ['name'].join() }
      }).then((users) => {
        resolve(users[0].id)
      })
    })
  }

  getUser (id, extended) {
    return this.jsonApi.find('user', id, {
      include: 'waifu',
      fields: {
        users: extended ? this.userFields.join() : this.compactUserFields.join(),
        characters: this.characterFields.join()
      }
    })
  }

  findUser (name, extended) {
    return new Promise((resolve, reject) => {
      this.jsonApi.findAll('user', {
        filter: { name },
        include: 'waifu',
        page: { limit: 1 },
        fields: {
          users: extended ? this.userFields.join() : this.compactUserFields.join(),
          characters: this.characterFields.join()
        }
      }).then((users) => {
        resolve(users[0])
      })
    })
  }

  searchUsers (query, extended) {
    return new Promise((resolve, reject) => {
      this.jsonApi.findAll('user', {
        filter: { query },
        include: 'waifu',
        page: { limit: 1 },
        fields: {
          users: extended ? this.userFields.join() : this.compactUserFields.join(),
          characters: this.characterFields.join()
        }
      }).then((users) => {
        resolve(users[0])
      })
    })
  }

  searchAnime (text, extended) {
    return new Promise((resolve, reject) => {
      this.jsonApi.findAll('anime', {
        filter: { text },
        include: 'genres',
        page: { limit: 1 },
        fields: {
          anime: extended ? this.animeFields.join() : this.compactAnimeFields.join(),
          genres: this.genreFields.join()
        }
      }).then((anime) => {
        resolve(anime[0])
      })
    })
  }

  searchManga (text, extended) {
    return new Promise((resolve, reject) => {
      this.jsonApi.findAll('manga', {
        filter: { text },
        include: 'genres',
        page: { limit: 1 },
        fields: {
          manga: extended ? this.mangaFields.join() : this.compactMangaFields.join(),
          genres: this.genreFields.join()
        }
      }).then((manga) => {
        resolve(manga[0])
      })
    })
  }

  searchFollows (follower, followed) {
    return new Promise((resolve, reject) => {
      this.jsonApi.findAll('follow', {
        filter: { follower, followed },
        include: 'follower,followed'
      }).then((follows) => {
        resolve(follows[0])
      })
    })
  }

  createFollow (follow) {
    return this.jsonApi.create('follow', follow)
  }

  removeFollow (id) {
    return this.jsonApi.destroy('follow', id)
  }

  createEntry (entry) {
    return this.jsonApi.create('libraryEntry', entry)
  }

  getEntry (id) {
    return this.jsonApi.find('libraryEntry', id)
  }

  getEntryForAnime (userId, animeId) {
    return new Promise((resolve, reject) => {
      this.jsonApi.findAll('libraryEntry', {
        filter: { userId, animeId },
        fields: { libraryEntries: this.libraryEntryFields.join() }
      }).then((entries) => {
        resolve(entries[0])
      })
    })
  }

  getEntryForManga (userId, mangaId) {
    return new Promise((resolve, reject) => {
      this.jsonApi.findAll('libraryEntry', {
        filter: { userId, mangaId },
        fields: { libraryEntries: this.libraryEntryFields.join() }
      }).then((entries) => {
        resolve(entries[0])
      })
    })
  }

  updateEntry (entry) {
    return this.jsonApi.update('libraryEntry', entry)
  }

  removeEntry (id) {
    return this.jsonApi.destroy('libraryEntry', id)
  }
}

module.exports = Kitsu
