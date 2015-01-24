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

function main() {
    var pages = fs.readFileSync('mdn.txt', {encoding: 'utf8'})
        .split('\n')
        .filter(function (line) { return !isBlank(line) })
    pages.forEach(loadPageName)
    console.log(pageNameCache)
}

if (require.main === module) main()
