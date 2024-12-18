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
