import joi from 'joi'

export const createUser = joi.object({
    name: joi.string().required()
} )

export const createMessage = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid("message", "private_message").required()
})