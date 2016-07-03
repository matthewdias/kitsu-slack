'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _superagentJsonapify = require('superagent-jsonapify');

var _superagentJsonapify2 = _interopRequireDefault(_superagentJsonapify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

(0, _superagentJsonapify2.default)(_superagent2.default);
var apiUrl = 'https://hbv3-api-edge.herokuapp.com/api/edge';

exports.default = function () {
	var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(ctx, next) {
		var media, type, rating;
		return regeneratorRuntime.wrap(function _callee$(_context) {
			while (1) {
				switch (_context.prev = _context.next) {
					case 0:
						console.log(ctx.query);
						_context.next = 3;
						return _superagent2.default.get(apiUrl + '/anime?filter[text]=' + ctx.query.text).then(function (animus) {
							console.log(animus.body);
							media = animus.body.data[0];
						});

					case 3:

						// var genres = media.relationships.genres.data.map(genre => genre.id);
						type = media.attributes.showType;

						type = type.charAt(0).toUpperCase() + type.slice(1);
						rating = media.attributes.averageRating.toString().slice(0, 4);


						ctx.status = 200;
						ctx.body = {
							"response_type": "in_channel",
							"link_names": true,
							"attachments": [{
								"color": "#EC8662",
								"pretext": '@' + ctx.query.user_name,
								"mrkdwn_in": ["text"],
								"title": media.attributes.canonicalTitle,
								"title_link": media.links.self,
								"text": media.attributes.synopsis,
								// "thumb_url": apiUrl + media.attributes.posterImage,
								"image_url": "https://static.hummingbird.me/anime/poster_images/000/007/442/large/attack-on-titan-2.jpg?1418580054",
								// "thumb_url": "https://static.hummingbird.me/anime/poster_images/000/007/442/large/attack-on-titan-2.jpg?1418580054",
								"fields": [{
									"title": "Rating",
									"value": rating,
									"short": true
								}, {
									"title": "Type",
									"value": type,
									"short": true
								}, {
									"title": "Episodes",
									"value": media.attributes.episodeCount,
									"short": true
								}, {
									"title": "Length",
									"value": media.attributes.episodeLength,
									"short": true
								}],
								"fallback": '@' + ctx.query.user_name + '\n' + media.attributes.canonicalTitle + '\nRating: ' + rating + '\nType: ' + type + '\nEpisodes: ' + media.attributes.episodeCount + '\nLength: ' + media.attributes.episodeLength + ' minutes' +
								// '\nGenres: ' + genres +
								'\nSynopsis: ' + media.attributes.synopsis
								// '\nStatus: ' + ctx.status
							}]
						};

					case 8:
					case 'end':
						return _context.stop();
				}
			}
		}, _callee, undefined);
	}));

	return function (_x, _x2) {
		return _ref.apply(this, arguments);
	};
}();