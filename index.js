const Alexa = require('ask-sdk-core');
const persistenceAdapter = require('ask-sdk-s3-persistence-adapter');
const request = require('request-promise');


const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const repromptText = `If you want to learn something new today, just say: Teach me something`
        const speechText = `Welcome to Today I learned ! I have many interesting stories and facts to tell you ... ${repromptText}`;

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(repromptText)
            .getResponse();
    }
};

const firstStoryIntroList = [
    `Here's an interesting story: `,
    `Here's an interesting fact: `,
    `Want to impress your friends ? Tell them the following story: `,
];

const firstStoryRepromptTextList = [
    'Would you like to learn something else ?',
    'I have another interesting one, would you like to hear it ?',
    'Do you want to impress your friends with another story ?',
    'What about another one ?',
    'Another one ?',
    'One more ?'
];

const ReadOnePostHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'ReadOnePost';
    },
    async handle(handlerInput) {

        let til = await getNeverReadTIL(handlerInput);

        const repromptText = firstStoryRepromptTextList[Math.floor(Math.random() * firstStoryRepromptTextList.length)];
        const introText = firstStoryIntroList[Math.floor(Math.random() * firstStoryIntroList.length)];
        const speechText = `${introText}
                            ${til.message} ... ${repromptText}`;

        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes['PREVIOUS_INTENT'] = 'ReadOnePost';
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(repromptText)
            .withStandardCard('Today I learned', `${til.message} \n Source: ${til.sourceUrl}`, til.thumbnail)
            .getResponse();
    }
};

const anotherStoryIntroList = [
    `Wow ! You're really a curious person ! Here's another one: `,
    `Another one: `,
    `And another one: `,
    `Alright, here's another story: `,
    `Ok, another cool thing to learn for you: `,
    `Hmmm, I have no more stories for you ... Just joking, you can ask me as much as you want, listen to this one: `
];

const anotherStoryRepromptTextList = [
    'Would you like to learn something else ?',
    'I have another interesting one, would you like to hear it ?',
    'Do you want to impress your friends with another story ?',
    'What about another one ?',
    'Another one ?',
    'One more ?'
];

const ReadAnotherPostHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent'
            && 
            (handlerInput.attributesManager.getSessionAttributes()['PREVIOUS_INTENT'] === 'ReadOnePost' || handlerInput.attributesManager.getSessionAttributes()['PREVIOUS_INTENT'] === 'ReadAnotherPost')
    },
    async handle(handlerInput) {

        let til = await getNeverReadTIL(handlerInput);

        const repromptText = anotherStoryRepromptTextList[Math.floor(Math.random() * anotherStoryRepromptTextList.length)];
        const introText = anotherStoryIntroList[Math.floor(Math.random() * anotherStoryIntroList.length)];
        const speechText = `${introText}
                            ${til.message} ... ${repromptText}`;

        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes['PREVIOUS_INTENT'] = 'ReadAnotherPost';
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(repromptText)
            .withStandardCard('Today I learned', `${til.message} \n Source: ${til.sourceUrl}`, til.thumbnail)
            .getResponse();
    }
};
const DoNotReadAnotherPostHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent'
            && 
            (handlerInput.attributesManager.getSessionAttributes()['PREVIOUS_INTENT'] === 'ReadOnePost' || handlerInput.attributesManager.getSessionAttributes()['PREVIOUS_INTENT'] === 'ReadAnotherPost')
    },
    handle(handlerInput) {

        const speechText = `Ok ! I still have lot of cool stories for you, don't hesitate to ask me some new ones again.`;

        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes['PREVIOUS_INTENT'] = 'DoNotReadAnotherPost';
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speechText = `You can ask me to tell you a new interesting fact anything you want`;

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speechText = `I think it's time to go brag to your friends about what you just learned. Goodbye !`;
        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = handlerInput.requestEnvelope.request.intent.name;
        const speechText = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speechText)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
      return true;
    },
    handle(handlerInput, error) {
      console.log(`Error handled: ${error.message}`);
      console.log(`Error stack: ${error.stack}`);
      return handlerInput.responseBuilder
        .speak('Sorry, an error occured')
        .getResponse();
    },
  };



let skill;
exports.handler = async (event, context) => {
// Make sure to add this so you can re-use `conn` between function calls.
// See https://www.mongodb.com/blog/post/serverless-development-with-nodejs-aws-lambda-mongodb-atlas
context.callbackWaitsForEmptyEventLoop = false;

if (!skill) {
    skill = Alexa.SkillBuilders.custom()
    .withPersistenceAdapter(new persistenceAdapter.S3PersistenceAdapter({bucketName: process.env.S3_PERSISTENCE_BUCKET}))
    .addRequestHandlers(
        LaunchRequestHandler,
        ReadOnePostHandler,
        ReadAnotherPostHandler,
        DoNotReadAnotherPostHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler) // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    .addErrorHandlers(
        ErrorHandler)
    .create();
}

const response = await skill.invoke(event, context);

return response;
};


let tilFrontPageFeed = [];
async function getNeverReadTIL(handlerInput) {

    if (tilFrontPageFeed.length === 0) {
        tilFrontPageFeed = (await request.get({
            url:'https://www.reddit.com/r/todayilearned.json',
            json: true
        })).data.children
        .map(c => c.data)
        .filter(f => f.score > 2000)
        .map(f => {
            f.title = f.title.replace('TIL that', '').replace('TIL ', '').replace('TIL: ', '');
            return {
                message: f.title,
                source: f.domain,
                sourceUrl: f.url,
                thumbnail: f.thumbnail,
                id: f.permalink
            }
        });
    }

    let til;
    const userData = (await handlerInput.attributesManager.getPersistentAttributes()) || {};
    if (!userData.readMessages) userData.readMessages = {};
    
    for (let story of tilFrontPageFeed) {
        if (!userData.readMessages[story.id]) {
            til = story;
            break;
        }
    }

    userData.readMessages[til.id] = true;
    handlerInput.attributesManager.setPersistentAttributes(userData);
    await handlerInput.attributesManager.savePersistentAttributes();
    return til;
}

