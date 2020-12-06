const express = require("express");
const { ApolloServer, gql } = require('apollo-server-express');
const cors = require('cors');
const dotEnv = require('dotenv');
const typeDefs = require('./typedefs');
const { connection } = require('./database/util')
const {verifyUser } = require('./helper/context')
const Dataloader = require('dataloader');

const resolvers = require('./resolvers')
const loaders = require('./loaders')

// set env variables
dotEnv.config();

const app = express();

connection();

// cors
app.use(cors());

// body parser middleware
app.use(express.json());

const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: async({ req, connection }) => {
        const contextObj = {};
        if (req) {
            await verifyUser(req);
            contextObj.email = req.email,
            contextObj.loggedInUserId = req.loggedInUserId
        }

        contextObj.loaders = {
            user: new Dataloader(keys => loaders.user.batchUsers(keys))
        }

        return contextObj;
    },
    formatError: (error) => {
        console.log(error);
        return {
            message: error.message
        };
    }
});

apolloServer.applyMiddleware({app, path: '/graphql'});

const PORT = process.env.PORT || 3000;

app.use('/', (req, res, next) => {
    console.log("get endpoint called");
    res.send({ message: "Hello 1" })
})

const httpServer = app.listen(PORT, () => {
    console.log(`Server listening on PORT: ${PORT}`);
    console.log(`Graphql endpoint: ${apolloServer.graphqlPath}`);
})

apolloServer.installSubscriptionHandlers(httpServer);