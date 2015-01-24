#!/usr/bin/env node
'use strict'
var fs = require('fs')
var request = require('request')

var baseurl = 'https://developer.mozilla.org/en-US/docs/Web/'
var headers = {'Accept-Language': 'en', 'User-Agent': 'Mozilla/5.0 ' +
    '(Macintosh; Intel Mac OS X 10.9; rv:1.0) Gecko/19480101 Firefox/1.0'}

function filenameCache(url) {
    return encodeURIComponent(url.replace(baseurl, '')) + '.html'
}

function _load(url, done) {
    var opt = {url: url, headers: headers, jar: request.jar()}
    request(opt, function (_, res, txt) {
        if (_) throw _
        if (res.statusCode != 200)
            throw new Error('Error (' + url + '): expected 200, got ' +
                res.statusCode)
        done(txt)
    })
}

function savePageAs(url, path, done) {
    console.log('Loading', url)
    _load(url, function (txt) {
        console.log('Saving to', path)
        fs.writeFile(path, txt, function (_) {
            if (_) throw _
            setTimeout(done, 2000)
        })
    })
}

function main() {
    var pages = fs.readFileSync('mdn.txt', {encoding: 'utf8'})
        .split('\n')
        .filter(function (line) { return !isBlank(line) })
        .map(function (url) {
            var path = 'mdn_cache/' + filenameCache(url)
            if (fs.existsSync(path))
                return null
            return savePageAs.bind(null, url, path)
        })
        .filter(function (x) { return x != null })
    loop(pages)
}

function isBlank(line) { return !line || !line.trim() }

function loop(fn) {
    if (fn.length)
        fn.pop()(loop.bind(null, fn))
}

if (require.main === module) main()
else module.exports = {
    filenameCache: filenameCache,
    isBlank: isBlank
}
