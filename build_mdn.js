#!/usr/bin/env node
'use strict'
var assert = require('assert')
var fs = require('fs')
var cheerio = require('cheerio')

var fetch_mdn = require('./fetch_mdn.js')
var filenameCache = fetch_mdn.filenameCache
var isBlank = fetch_mdn.isBlank

var pageNameCache = {}

function loadPageName(url) {
    var path = 'mdn_cache/' + filenameCache(url)
    var html = fs.readFileSync(path, {encoding: 'utf8'})
    var $ = cheerio.load(html)

    pageNameCache[url] = $('#wiki-document-head h1').text().trim()
    assert.ok(pageNameCache[url])
}

function buildPage(url) {
    var path = 'mdn_cache/' + filenameCache(url)
    var html = fs.readFileSync(path, {encoding: 'utf8'})
    var $ = cheerio.load(html)

    $('#Quick_Links').remove()
    $('#Browser_compatibility').nextUntil('h2').addBack().remove()

    var $article = $('#wikiArticle')
    assert.ok($article.length)
    var html = '<template><div class="wikiArticle text-content">' + $article.html() +
               '</div></template>'
    html = html.split('\n')
        .map(function (line) { return line.trim() })
        .filter(function (line) { return line.length != 0 })
        .join('\n')

    fs.writeFileSync('docs/' + filenamePage(url), html)
}

function filenamePage(url) {
    return pageNameCache[url] + '.html'
}

function saveDocsIndex() {
    var names = Object.keys(pageNameCache)
        .map(function (k) { return pageNameCache[k] })
    var script = 'window.blazinAllPages=' + JSON.stringify(names) + '\n'
    fs.writeFileSync('docs/index.js', script)
}

function main() {
    var pages = fs.readFileSync('mdn.txt', {encoding: 'utf8'})
        .split('\n')
        .filter(function (line) { return !isBlank(line) })

    pages.forEach(loadPageName)
    console.log(pageNameCache)
    pages.forEach(buildPage)
    saveDocsIndex()
}

if (require.main === module) main()
