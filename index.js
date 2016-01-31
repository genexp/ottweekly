var MetalSmith = require('metalsmith');
var collections = require('metalsmith-collections');
var excerpts = require('metalsmith-excerpts');
var feed = require('metalsmith-feed');
var inPlace = require('metalsmith-in-place');
var layouts = require('metalsmith-layouts');
var markdown = require('metalsmith-markdown-remarkable');
var paths = require('metalsmith-paths');
var permalinks = require('metalsmith-permalinks');
var sass = require('metalsmith-sass');
var serve = require('metalsmith-serve');
var sitemap = require('metalsmith-sitemap');

var config = {
	title: 'OTT Weekly',
	url: 'http://www.ottweekly.com',
	author: 'OTT Weekly'
};

var metalsmith = MetalSmith(__dirname);
metalsmith.metadata({
	site: {
		title: config.title,
		url: config.url
	}
});
metalsmith
	.use(sass({
		outputDir: 'assets/css/'
	}))
	.use(paths())
	.use(collections({
		archives: {
			pattern: 'archives/*.md',
			reverse: true
			// sortBy: 'name'
		}
	}))
	.use(markdown())
	.use(permalinks({
		pattern: ':title',
		date: 'YYYY',
		linksets: [{
			match: {collection: 'archives'},
			pattern: 'archives/:file'
		}]
	}))
	.use(inPlace({
		engine: 'twig'
	}))
	.use(layouts({
		engine: 'twig'
	}))
	.use(excerpts())
	.use(feed({collection: 'archives'}))
	.use(sitemap({
		hostname: config.url,
		omitIndex: true
	}));

// only enable live-reloading when requested
if (process.env.ENABLE_SERVER) {
	metalsmith.use(serve({}));
}

metalsmith.build(function (err) {
	if (err) {
		throw err;
	}
});
