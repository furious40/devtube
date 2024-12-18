// Import necessary modules and utilities
const { imageKit } = require("@lib/db")
const { generateID } = require("@lib/utils")
const Channel = require("@models/Channel")
const Subscription = require("@models/Subscription")
const { default: axios } = require('axios')


const createChannel = async (req, res) => {

    const channel = req.channel
    const uid = generateID(channel.id)

    if (req.query.handle && (await Channel.findOne({ handle: req.query.handle })) && req.query.handle !== req.channel.uid) {
        return res.status(400).json({ message: 'Channel name already exists' })
    }

    if (req.file) {
        const response = await imageKit.upload({
            file: req.file.buffer,
            name: req.file.originalname
        })

        if (response.url) channel.logoURL = response.url
    }


    const collectionResponse = await axios.post(
        `https://video.bunnycdn.com/library/${process.env.BUNNY_STREAM_LIBRARY_ID}/collections`,
        { name: uid },
        { headers: { AccessKey: process.env.BUNNY_STREAM_API_KEY } }
    )
    const { guid: collectionId } = collectionResponse.data

    // Update channel details
    Object.assign(channel, {
        handle: req.body.handle,
        name: req.body.name,
        collectionId,
        uid
    })

    // Save the channel to the database
    await channel.save()

    res.status(200).json({ message: "Channel created successfully", uid })



}

const updateChannel = async (req, res) => {
    try {
        const channel = req.channel

        if (req.files?.logo) {
            const response = await imageKit.upload({
                file: req.files.logo[0].buffer,
                fileName: req.files.logo[0].originalname,
            })

            if (response.url) channel.logoURL = response.url
        }

        if (req.files?.banner) {
            const response = await imageKit.upload({
                file: req.files.banner[0].buffer,
                fileName: req.files.banner[0].originalname,
            })

            if (response.url) channel.bannerImageURL = response.url
        }

        // Update channel details
        Object.assign(channel, {
            handle: req.body.handle,
            name: req.body.name,
            description: req.body.description,
        })

        // Save the channel to the database
        await channel.save()

        res.status(200).json({ message: "Channel updated successfully" })
    } catch (error) {
        console.error("Channel update error:", error)
        res.status(500).json({ error: "Oops! Something went wrong while creating the channel." })
    }
}

const getChannelByHandle = async (handle) => {
    try {
        return await Channel.findOne({ handle })

    } catch (error) {
        console.error("Error fetching channel by handle:", error)
        throw new Error("Error fetching channel by handle");

    }
}

const getChannelByUid = async (uid) => {
    try {
        return await Channel.findOne({ uid })
    } catch (error) {
        console.error("Error fetching channel by UID:", error)
        throw new Error("Failed to fetch channel by UID")
    }
}


const getChannelById = async (id) => {
    try {
        return await Channel.findById(id)
    } catch (error) {
        console.error("Error fetching channel by ID:", error)
        throw new Error("Failed to fetch channel by ID")
    }
}

const getSubscription = async ({ subscriber, channel }) => {
    try {
        return await Subscription.findOne({ subscriber, channel })
    } catch (error) {
        console.error("Error fetching Subscription:", error)
        throw new Error("Failed to fetch Subscription")
    }
}

const getChannelAndSubscription = async (req, res, isHandle = true) => {
    try {
        const currentChannel = isHandle ? await getChannelByHandle(req.params[0]) : getChannelByUid(req.params[0])

        if (!currentChannel) return res.status(404).json({ message: "Channel not found" })

        const subscription = await getSubscription({ subscriber: req.channel?.id, channel: currentChannel.id })

        res.render('devtube', { currentChannel, subscription, page: 'channel' })
    } catch (error) {
        console.error("Error fetching channel and subscription:", error)
        throw new Error("failed to fetch")

    }
}

const subscribeChannel = async (req, res) => {

    if (!req.channel) return res.status(401).json({ error: "login to subscribe" })


    try {
        const channel = await Channel.findOne({ uid: req.params.uid })

        if (!channel) return res.status(404).json({ message: "Channel not found" })

        if (req.channel.subscriptions.includes(channel.id)) {
            return res.status(400).json({ message: "Already subscribed" })
        }


        const subscription = await Subscription.create({
            subscriber: req.channel.id,
            channel: channel.id,
            mode: 'notification'
        })

        req.channel.subscriptions.push(subscription.id)
        channel.subscribers.push(req.channel.id)

        await req.channel.save()
        await channel.save()


        res.status(200).json({ message: "Subscribed successfully" })

    } catch (error) {

        console.error("Error subscribing channel:", error)
        res.status(500).json({ error: "Failed to subscribe" })

    }
}


const unsubscribeChannel = async (req, res) => {
    try {
        const channel = await Channel.findOne({ uid: req.params.uid })

        if (!channel) return res.status(404).json({ error: "Channel not found" })

        const subscription = await getSubscription({ subscriber: req.channel.id, channel: channel.id })

        if (!subscription) return res.status(404).json({ error: "Not subscribed to this channel" })

        req.channel.subscriptions.pull(subscription._id)
        channel.subscribers.pull(subscription.subscriber)

        await req.channel.save()
        await channel.save()
        await subscription.remove()

        res.status(200).json({ message: "Unsubscribed successfully" })
    } catch (error) {
        console.error("Unsubscription error:", error)
        res.status(500).json({ error: "Oops! Something went wrong while unsubscribing." })
    }
}

const notificationsChannel = async (req, res) => {
    try {
        const channel = await Channel.findOne({ uid: req.params.uid })

        if (!channel) return res.status(404).json({ error: "Channel not found" })

        const subscription = await getSubscription({ subscriber: req.channel._id, channel: channel._id })

        if (!subscription) return res.status(404).json({ error: "Not subscribed to this channel" })

        subscription.mode = req.params.mode === "notification" ? "notification" : "silent"

        await subscription.save()

        res.status(200).json({ message: "Notifications successfully updated" })
    } catch (error) {
        console.error("Notifications error:", error)
        res.status(500).json({ error: "Oops! Something went wrong while setting notifications." })
    }
}

module.exports = {
    updateChannel,
    getSubscription,
    createChannel,
    getChannelByHandle,
    getChannelAndSubscription,
    notificationsChannel,
    getChannelByUid,
    getChannelById,
    subscribeChannel,
    unsubscribeChannel
}