'use strict'

const util = require('./util')
const cidForHash = require('./common').cidForHash
const EthBlockHead = require('ethereumjs-block/header')

exports = module.exports

exports.multicodec = 'eth-block-list'

/*
 * resolve: receives a path and a block and returns the value on path,
 * throw if not possible. `block` is an IPFS Block instance (contains data + key)
 */
exports.resolve = (block, path, callback) => {
  let result
  util.deserialize(block.data, (err, node) => {
    if (err) return callback(err)

    // root
    if (!path || path === '/') {
      result = { value: node, remainderPath: '' }
      return callback(null, result)
    }

    // check tree results
    let pathParts = path.split('/')
    let firstPart = pathParts.shift()
    let remainderPath = pathParts.join('/')

    exports.tree(block, (err, paths) => {
      if (err) return callback(err)

      let treeResult = paths.find(child => child.path === firstPart)
      if (!treeResult) {
        let err = new Error('Path not found ("' + firstPart + '").')
        return callback(err)
      }

      result = {
        value: treeResult.value,
        remainderPath: remainderPath
      }
      return callback(null, result)
    })
  })
}

/*
 * tree: returns a flattened array with paths: values of the project. options
 * are option (i.e. nestness)
 */

exports.tree = (block, options, callback) => {
  // parse arguments
  if (typeof options === 'function') {
    callback = options
    options = undefined
  }
  if (!options) {
    options = {}
  }

  util.deserialize(block.data, (err, blockList) => {
    if (err) return callback(err)

    const paths = []

    // external links (none)

    // external links as data (none)

    // internal data

    blockList.forEach((rawBlock, index) => {
      paths.push({
        path: index.toString(),
        value: new EthBlockHead(rawBlock)
      })
    })

    // helpers

    paths.push({
      path: 'count',
      value: blockList.length
    })

    callback(null, paths)
  })
}
