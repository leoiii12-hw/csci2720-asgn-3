// Choi Man Kin 1155077469

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/1155077469', {useNewUrlParser: true});

/**
 * Schema
 */
const EventSchema = new mongoose.Schema({
    eventId: {type: Number, required: true, unique: true},
    name: {type: String, required: true},
    loc: {type: Number},
    quota: {type: Number}
});
const Event = mongoose.model('Event', EventSchema);

const LocationSchema = new mongoose.Schema({
    locId: {type: Number, required: true, unique: true},
    name: {type: String, required: true},
    quota: {type: Number}
});
const Location = mongoose.model('Location', LocationSchema);


/**
 * App
 */
const db = mongoose.connection;

db.once('open', start).on('error', console.error.bind(console, 'connection error:'));

function start() {
    const app = express();
    const port = 3000;

    app.use(bodyParser.urlencoded({extended: true}));

    app.get('/event/:eventId', async (req, res) => {
        const event = await Event.findOne({eventId: req.params.eventId}, ['eventId', 'name', 'loc', 'quota'].join(' '));
        if (!event) {
            res.status(400).send('Event not exist.');
            return;
        }

        res.send(`${event['eventId']}<br>${event['name']}<br>${event['loc']}<br>${event['quota']}`);
    });

    app.post('/event', async (req, res) => {
        const location = await Location.findOne({locId: req.body['loc']}, ['locId', 'name', 'quota'].join(' '));
        if (!location) {
            res.status(400).send('Location not exist.');
            return;
        }
        if (location['quota'] < req.body['quota']) {
            res.status(400).send('Location quota is invalid.');
            return;
        }

        const latestEvent = await Event.findOne({}, ['eventId'].join(' '), {sort: {eventId: -1}});

        const newEventId = latestEvent ? latestEvent.eventId + 1 : 1;
        const event = new Event({
            eventId: newEventId,
            name: req.body['name'],
            loc: req.body['loc'],
            quota: req.body['quota']
        });

        await event.save();

        res.status(201).send('Event created.');
    });

    app.delete('/event/:eventId', async (req, res) => {
        const event = await Event.findOne({eventId: req.params.eventId}, ['eventId', 'name', 'loc', 'quota'].join(' '));
        if (!event) {
            res.status(400).send('Event not exist.');
            return;
        }

        await Event.deleteOne({eventId: req.params.eventId});

        res.status(200).send(`Event deleted.<br>${event['eventId']}<br>${event['name']}<br>${event['loc']}<br>${event['quota']}`);
    });

    // List all the events available
    app.get('/event', async (req, res) => {
        const events = await Event.find({}, ['eventId', 'name', 'loc', 'quota'].join(' '));

        res.send(events);
    });

    // List all the locations available
    app.get('/loc', async (req, res) => {
        const quota = req.query.quota;

        if (!quota) {
            // List all the locations available
            const locations = await Location.find({}, ['locId', 'name', 'quota'].join(' '));

            res.send(locations);
        } else {
            // List all the locations with quota of at least this number.
            const locations = await Location.find({quota: {$gte: parseInt(quota)}}, ['locId', 'name', 'quota'].join(' '));

            if (locations.length > 0)
                res.send(locations);
            else
                res.send('No location fulfils the quota requirement.')
        }
    });

    // Show the details for this location ID.
    app.get('/loc/:locationId', async (req, res) => {
        const location = await Location.findOne({locId: req.body['loc']}, ['locId', 'name', 'quota'].join(' '));
        if (!location) {
            res.status(400).send('Location not exist.');
            return;
        }

        res.send(`${event['locId']}<br>${event['name']}<br>${event['quota']}`);
    });

    // Create a new location with the input from a user form.
    app.post('/loc', async (req, res) => {
        const latestLocation = await Location.findOne({}, ['locId'].join(' '), {sort: {locId: -1}});

        const newLocationId = latestLocation ? latestLocation.locId + 1 : 1;
        const location = new Location({
            locId: newLocationId,
            name: req.body['name'],
            quota: req.body['quota']
        });

        await location.save();

        res.status(201).send('Location created.');
    });

    app.listen(port, () => console.log(`Example app listening on port ${port}!`));
}