// import modules
import { GraphQLServer, PubSub } from 'graphql-yoga'
import db from './db.js'
import { PORT, NEW_FRUIT_ADDED_CHANNEL } from './config.js'

// define the graphql schema
const typeDefs = `
  type Query {
    getFruits: [Fruit]!
    getFruit(name: String!): Fruit
  }

  type Mutation {
    addFruit(data: FruitInput!): Fruit!
  }

  type Subscription {
    addedFruit: Fruit
  }

  type Fruit {
    name: String
    logo: String
  }

  input FruitInput {
    name: String!
    logo: String!
  }
`

// define the graphql resolvers
const resolvers = {
  Query: {
    getFruits(parent, args, ctx, info) {
      return db.fruits
    },
    getFruit(parent, args, ctx, info) {
      return db.fruits.find(({ name }) => {
        return name.toLowerCase().includes(args.name.toLowerCase())
      })
    }
  },
  Mutation: {
    addFruit(parent, args, ctx, info) {
      db.fruits.push(args.data)
      ctx.pubsub.publish(NEW_FRUIT_ADDED_CHANNEL, { addedFruit: args.data })
      return db.fruits[db.fruits.length - 1]
    }
  },
  Subscription: {
    addedFruit: {
      subscribe(parent, args, ctx, info) {
        return ctx.pubsub.asyncIterator(NEW_FRUIT_ADDED_CHANNEL)
      }
    }
  }
}

// setup the graphql server 
const server = new GraphQLServer({
  typeDefs,
  resolvers,
  context: {
    pubsub: new PubSub()
  }
})

// run the graphql server
server.start({ port: PORT }, console.log(` Server ready 🚀 .. `))
