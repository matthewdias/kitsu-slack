'use strict';

require('babel-polyfill');

var _koa = require('koa');

var _koa2 = _interopRequireDefault(_koa);

var _koaCors = require('koa-cors');

var _koaCors2 = _interopRequireDefault(_koaCors);

var _user = require('./user');

var _user2 = _interopRequireDefault(_user);

var _anime = require('./anime');

var _anime2 = _interopRequireDefault(_anime);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

var router = require('koa-router')();
var koaBody = require('koa-body')();
var app = new _koa2.default();

app.use(function () {
	var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(ctx, next) {
		var status;
		return regeneratorRuntime.wrap(function _callee$(_context) {
			while (1) {
				switch (_context.prev = _context.next) {
					case 0:
						_context.prev = 0;
						_context.next = 3;
						return next();

					case 3:
						_context.next = 10;
						break;

					case 5:
						_context.prev = 5;
						_context.t0 = _context['catch'](0);

						ctx.body = _context.t0.message;
						status = ctx.status || 500;

						console.log(status + ': ' + _context.t0.message);

					case 10:
					case 'end':
						return _context.stop();
				}
			}
		}, _callee, undefined, [[0, 5]]);
	}));

	return function (_x, _x2) {
		return _ref.apply(this, arguments);
	};
}());

router.get('/user', _user2.default);
router.get('/anime', _anime2.default);
router.get('/auth', function (ctx, next) {
	ctx.body = 'If you see this, you\'re done.';
});

app.use(router.routes());
app.use(router.allowedMethods());
app.use((0, _koaCors2.default)());
app.listen(process.env.PORT || 3000);
//# sourceMappingURL=main.js.map