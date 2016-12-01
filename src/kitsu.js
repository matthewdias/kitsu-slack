import OAuth2 from 'client-oauth2'
import JsonApi from 'devour-client'
const baseUrl = process.env.API_URL

class Kitsu {
  constructor() {
    this.auth = new OAuth2({
      clientId: '202a06b488f1d7f9b92b7f61ab5720d64e6d5e1989427308e5f62472a01227c5',
      clientSecret: '2b6dac58f737484d2d314826c83f357b9a0aa2c33d5e6b6322feb9b2b8fb234f',
      accessTokenUri: baseUrl + '/oauth/token'
    })

    this.jsonApi = new JsonApi({ apiUrl: baseUrl + '/edge' })

    this.jsonApi.define('user', {
      name: '',
      about: '',
      bio: '',
      waifuOrHusbando: '',
      waifu: {
        jsonApi: 'hasOne',
        type: 'characters'
      },
      avatar: { original: '' }
    })

    this.jsonApi.define('character', {
      name: ''
    })

    this.jsonApi.define('anime', {
      titles: {
        en: '',
        en_jp: '',
        ja_jp: ''
      },
      canonicalTitle: '',
      slug: '',
      synopsis: '',
      averageRating: '',
      posterImage: { original: '' },
      episodeCount: '',
      episodeLength: '',
      showType: ''
    }, { collectionPath: 'anime' })

    this.jsonApi.define('libraryEntry', {
      status: '',
      progress: '',
      reconsuming: '',
      reconsumeCount: '',
      private: '',
      rating: '',
      media: {
        jsonApi: 'hasOne',
        type: 'anime'
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

  login(username, password) {
    return new Promise((pass, fail ) => {
      this.auth.owner.getToken(username, password).then((user) => {
        this.authenticate(user.accessToken)
        pass(user)
      })
    })
  }

  searchUsers(name) {
    return new Promise((pass, fail) => {
      this.jsonApi.findAll('user', {
        filter: { name }
      }).then((users) => {
        pass(users[0])
      })
    })
  }

  searchAnime(text) {
    return new Promise((pass, fail) => {
      this.jsonApi.findAll('anime', {
        filter: { text }
      }).then((anime) => {
        pass(anime[0])
      })
    })
  }

  createEntry(entry) {
    return new Promise((pass, fail) => {
      this.jsonApi.create('libraryEntry', entry).then((entry) => {
        pass(entry)
      })
    })
  }

  getEntry(id) {
    return new Promise((pass, fail) => {
      this.jsonApi.find('libraryEntry', id).then((entry) => {
        pass(entry)
      })
    })
  }

  getEntryForAnime(id) {
    return new Promise((pass, fail) => {
      this.jsonApi.findAll('libraryEntry', {
        filter: {
          userId: localStorage.getItem('id'),
          mediaId: id
        }
      }).then((entries) => {
        if (entries[0])
          pass(entries[0])
        else
          fail(Error('none'))
      })
    })
  }

  updateEntry(entry) {
    return new Promise((pass, fail) => {
      this.jsonApi.update('libraryEntry', entry).then((entry) => {
        pass(entry)
      })
    })
  }

  removeEntry(id) {
    return new Promise((pass, fail) => {
      this.jsonApi.destroy('libraryEntry', id).then((entry) => {
        pass(entry)
      })
    })
  }
}

module.exports = Kitsu
