#!/usr/bin/env node
'use strict'
var assert = require('assert')
var fs = require('fs')
var cheerio = require('cheerio')

var fetch_mdn = require('./fetch_mdn.js')
var filenameCache = fetch_mdn.filenameCache
var isBlank = fetch_mdn.isBlank
var mdnDomain = 'https://developer.mozilla.org'

var pageNameCache = {}
var newUrls = {}

function loadPageName(url) {
    var path = 'mdn_cache/' + filenameCache(url)
    var html = fs.readFileSync(path, {encoding: 'utf8'})
    var $ = cheerio.load(html)

    pageNameCache[url] = $('#wiki-document-head h1').text().trim()
    if (pageNameCache[url] == 'Test API')
        pageNameCache[url] = 'Boolean'
    assert.ok(pageNameCache[url])
}

function buildPage(url) {
    var path = 'mdn_cache/' + filenameCache(url)
    var html = fs.readFileSync(path, {encoding: 'utf8'})
    var $ = cheerio.load(html)

    $('#Quick_Links').remove()
    $('#Browser_compatibility').nextUntil('h2').addBack().remove()

    $('pre[class^="brush"]').each(function () {
        this.tagName = 'prism-js'
        $(this).removeAttr('class').attr('language', 'javascript')
    })

    $('a').each(function () {
        var link = $(this).attr('href')
        if (!link) return
        var name = pageNameCache[mdnDomain + link]
        if (name) {
            $(this).attr('href', '#/' + name)
            return
        }
        if (link[0] == '#') {
            $(this).attr('href', '#/' + pageNameCache[url] + link)
            return
        }
        if (link.indexOf('/en-US/docs/')) return
        $(this).attr('href', mdnDomain + link)
        newUrls[mdnDomain + link] = 1
    })

    var $article = $('#wikiArticle')
    assert.ok($article.length)
    var html = '<link rel="import" href="/bower_components/prism-js/prism-js.html">\n' +
               '<template><div class="wikiArticle text-content redesign">\n' + $article.html().trim() +
               '\n' + mdnFooter(url) + '\n</div></template>'
    html = html.split('\n')
        .map(function (line) { return line.trimRight().replace('<p>&#xA0;</p>', '') })
        .filter(function (line) { return line.length != 0 })
        .join('\n')

    fs.writeFileSync('docs/' + filenamePage(url), html)
}

function filenamePage(url) {
    return encodeURIComponent(pageNameCache[url]) + '.html'
}

function mdnFooter(url) {
    return '<div class="mdnLicenseFooter">This page on MDN: <a href="' + url + '">' + pageNameCache[url] +
           '</a>, by Mozilla Contributors.<br>Licensed under the terms of ' +
           'Creative Commons Attribution-ShareAlike.</div>'
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
    console.log(Object.keys(newUrls).filter(function (url) {
        return !/\$(edit|history|locales)$/.test(url)
    }).filter(function (url) {
        return url.indexOf('/en-US/docs/tag/') == -1
    }).sort().join('\n'))
}

if (require.main === module) main()
