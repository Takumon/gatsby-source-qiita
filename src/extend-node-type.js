
import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInt,
} from 'gatsby/graphql'
import rehype from 'rehype'
import visit from 'unist-util-visit'
import hastToString from 'hast-util-to-string'

module.exports = ({ type }) => {
  if (type.name !== 'QiitaPost') {
    return {}
  }

  const ParentHeadingType = new GraphQLObjectType({
    name: `QiitaParentHeadings`,
    fields: {
      value: {
        type: GraphQLString,
        resolve: ({ value }) => value
      },
      id: {
        type: GraphQLString,
        resolve: ({ id }) => id
      },
      depth: {
        type: GraphQLInt,
        resolve: ({ depth }) => depth
      }
    }
  })

  const HeadingType = new GraphQLObjectType({
    name: `QiitaHeading`,
    fields: {
      value: {
        type: GraphQLString,
        resolve: ({ value }) => value
      },
      id: {
        type: GraphQLString,
        resolve: ({ id }) => id
      },
      depth: {
        type: GraphQLInt,
        resolve: ({ depth }) => depth
      },
      parents: {
        type: new GraphQLList(ParentHeadingType),

        resolve(heading) {
          return heading.parents;
        }

      }
    }
  })

  return {
    headings: {
      type: new GraphQLList(HeadingType),
      resolve: ({ rendered_body }) => _attachParents(_extractHeadingDetails(rendered_body))
    }
  }
}



const MIN_HEADER_DEPTH = 1
const HEADER_TYPE_IN_HAST = 'element'
const HEADER_TAG_NAMES_IN_HAST = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']


function _attachParents(headers) {
  // Investigation from the reverse
  headers.reverse();
  const result = headers.map((h, i) => {
    // Empty array, if a header has no parent.
    h.parents = []
    const lastIndex = headers.length - 1

    if (i === lastIndex) {
      return h
    }

    let currentDepth = h.depth

    for (let targetIndex = i + 1; targetIndex <= lastIndex; targetIndex++) {
      // The investigation end
      // In the case of the largest header, since the parent does not exist,
      if (currentDepth === MIN_HEADER_DEPTH) {
        break
      }

      const targetH = headers[targetIndex]

      // (Pattern 1)If the target is smaller than current,
      // The target is parent of current.
      if (currentDepth > targetH.depth) {
        h.parents.push(targetH);

        // continue the investigation with the parent depth.
        currentDepth = targetH.depth;
      } else {

        // (Pattern 2)If the target is larger than current,
        // (Pattern 3)If the target is equals to current,
        // continue the investigation with the depth as it is,
        // because there is a possibility that there is a parent thereafter,
      }
    }

    return h
  })

  // Revert the reverse array
  return result.reverse();
}


function _extractHeadingDetails(htmlStr) {
  const htmlAst = rehype.parse(htmlStr)

  const result = []
  visit(htmlAst, HEADER_TYPE_IN_HAST, node => {
    if (!HEADER_TAG_NAMES_IN_HAST.includes(node.tagName)) {
      return
    }

    const heading = {
      depth: Number(node.tagName[1]),
      // In case of html from Qiita. Header has prefix of "\n"
      value: hastToString(node).replace('\n', '')
    }
    node.children.filter(c => _isHeaderIdLink(c)).forEach(c => {
      heading.id = decodeURI(c.properties.href.split('#')[1])
    });

    result.push(heading)
  })

  return result
}

function _isHeaderIdLink(node) {
  return node.tagName === 'a'
          && c.properties.href
          && c.properties.href.startsWith('#')
}