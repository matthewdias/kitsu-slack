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
		var profile;
		return regeneratorRuntime.wrap(function _callee$(_context) {
			while (1) {
				switch (_context.prev = _context.next) {
					case 0:
						console.log('user: ' + ctx.query.text);
						_context.next = 3;
						return _superagent2.default.get(apiUrl + '/users?filter[name]=' + ctx.query.text).then(function (user) {
							if (user.body.data[0]) {
								profile = user.body.data[0];
								console.log(profile.attributes.name);
							} else {
								ctx.status = 404;
								throw new Error('Not Found');
							}
						});

					case 3:

						ctx.status = 200;
						ctx.body = {
							"response_type": "in_channel",
							"link_names": true,
							"attachments": [{
								"color": "#EC8662",
								"pretext": '@' + ctx.query.user_name,
								"mrkdwn_in": ["text"],
								"title": profile.attributes.name,
								"title_link": profile.links.self,
								"text": profile.attributes.bio,
								// "thumb_url": apiUrl + profile.attributes.avatar,
								"thumb_url": "https://i.imgur.com/so56rpG.jpg",
								"fields": [{
									"title": "About",
									"value": profile.attributes.about,
									"short": false
								}, {
									"title": "Waifu/Husbando",
									"value": profile.attributes.waifuOrHusbando,
									"short": true
								}],
								"fallback": '@' + ctx.query.user_name + '\n' + profile.attributes.name + '\nAbout: ' + profile.attributes.about + '\nBio: ' + profile.attributes.bio + '\nWaifu/Husbando: ' + profile.attributes.waifuOrHusbando
							}]
						};

					case 5:
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